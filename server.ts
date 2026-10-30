import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fetchWooCommerceCategories, fetchWooCommerceProducts } from "./server/woocommerce.js";
import { dbStore, addLog } from "./server/store.js";
import { supabaseAdmin, requireAdmin, getAdminProfile, AdminRequest } from "./server/supabaseClient.js";
import { uploadDataUrlImage, downloadAndUploadImage } from "./server/storage.js";
import { handleChat } from "./server/chatAssistant.js";
import { availablePaymentMethods, genieChargeInLkr } from "./src/paymentMethods.js";
import { isGenieConfigured, startGeniePayment, confirmGeniePayment, siteOrigin } from "./server/genie.js";
import { genieExchangeRate, withLiveGenieRate } from "./server/exchangeRate.js";

dotenv.config();

const app = express();

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Baseline security headers for every response; the site is only served over HTTPS (Cloudflare).
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    });
    next();
  });

  // Increase payload limit for Base64 image uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Simple async error wrapper so route handlers can just `await` Supabase calls
  const h = (fn: (req: any, res: any) => Promise<void>) => (req: any, res: any) => {
    fn(req, res).catch((err: any) => {
      console.error(`${req.method} ${req.path} error:`, err);
      res.status(500).json({ error: err.message || "Internal server error." });
    });
  };

  // --- IMAGE UPLOAD API ENDPOINT (admin only) — stores into Supabase Storage ---
  app.post("/api/upload", requireAdmin, h(async (req: AdminRequest, res) => {
    const { image, fileName } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: "Image data (base64 or URL) is required." });
    }
    if (image.startsWith('data:')) {
      const match = image.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
      if (!match) return res.status(400).json({ error: 'Only PNG, JPEG, WebP, and GIF image files are supported.' });
      const estimatedBytes = Math.floor(match[2].length * 0.75);
      if (estimatedBytes > 5 * 1024 * 1024) return res.status(400).json({ error: 'Image files must be 5 MB or smaller.' });
    } else {
      try {
        const parsed = new URL(image);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
      } catch {
        return res.status(400).json({ error: 'Image must be a valid HTTP(S) URL or supported image upload.' });
      }
    }
    const url = await uploadDataUrlImage(image, fileName || `img_${Date.now()}`);
    await addLog(req.adminUser?.name || "Admin", "Uploaded Image", `Saved image to Supabase Storage`, "info");
    res.json({ success: true, url });
  }));

  // --- GENERAL, EMAIL & SMS SETTINGS APIs (admin only) ---
  app.get("/api/settings", requireAdmin, h(async (req, res) => {
    const [general, email, sms, sliders] = await Promise.all([
      dbStore.getGeneralSettings(),
      dbStore.getEmailSettings(),
      dbStore.getSmsSettings(),
      dbStore.getSliders(),
    ]);
    res.json({ general, email, sms, sliders });
  }));

  // Public-safe storefront settings. Server-only credentials and notification
  // destinations are deliberately omitted from this projection.
  app.get("/api/public-settings", h(async (req, res) => {
    // Carries the live LKR rate, so checkout shows the same rupee amount Genie will charge.
    const settings = await withLiveGenieRate(await dbStore.getGeneralSettings());
    const publicSettings = structuredClone(settings);
    publicSettings.business.orderNotificationEmail = '';
    publicSettings.contact.formRecipientEmail = '';
    publicSettings.system.lastUpdatedBy = undefined;
    // Card payment is only offered when the server holds a Genie API key and can price the order in LKR.
    if (!isGenieConfigured() || genieChargeInLkr(1, settings) === null) publicSettings.payments.dialogGenieEnabled = false;
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(publicSettings);
  }));

  // The rate Dialog Genie charges with right now (shown in admin Settings -> Payments).
  app.get("/api/payments/genie/rate", h(async (req, res) => {
    const rate = await genieExchangeRate(await dbStore.getGeneralSettings());
    res.set('Cache-Control', 'no-store');
    res.json(rate ?? { rate: null });
  }));

  app.put("/api/settings/general", requireAdmin, h(async (req: AdminRequest, res) => {
    const forbiddenKey = (value: any): string | null => {
      if (!value || typeof value !== 'object') return null;
      for (const [key, nested] of Object.entries(value)) {
        if (/(secret|password|private.?key|api.?key|access.?token|client.?secret)/i.test(key)) return key;
        const found = forbiddenKey(nested); if (found) return found;
      }
      return null;
    };
    const forbidden = forbiddenKey(req.body);
    if (forbidden) return res.status(400).json({ error: `Sensitive setting "${forbidden}" must be configured on the server and cannot be submitted from the browser.` });
    const isSafeUrl = (value: string) => !value || value.startsWith('/') || /^https?:\/\//i.test(value);
    const urls = [
      ...Object.values(req.body.social || {}).map((item: any) => item?.url || ''),
      ...(req.body.footer?.quickLinks || []).map((item: any) => item?.url || ''),
      req.body.footer?.privacyPolicyUrl || '', req.body.footer?.termsUrl || '', req.body.footer?.refundPolicyUrl || '', req.body.footer?.deliveryPolicyUrl || '',
    ];
    if (urls.some((url: any) => typeof url !== 'string' || !isSafeUrl(url))) return res.status(400).json({ error: 'Links must use HTTP(S) or a site-relative path beginning with /.' });
    if (req.body.delivery && !req.body.delivery.enabled && !req.body.delivery.storePickupEnabled) return res.status(400).json({ error: 'Enable delivery, store pickup, or both.' });
    if (req.body.payments && availablePaymentMethods(req.body.payments).length === 0) return res.status(400).json({ error: 'Enable at least one payment method customers can use at checkout (cash on delivery or bank transfer until an online gateway is connected).' });
    const updated = await dbStore.updateGeneralSettings(req.body, req.adminUser?.id);
    await addLog(req.adminUser?.name || "Admin", "Update General Settings", "Store settings updated", "info");
    res.json({ success: true, general: updated });
  }));

  app.put("/api/settings/email", requireAdmin, h(async (req: AdminRequest, res) => {
    const updated = await dbStore.updateEmailSettings(req.body);
    await addLog(req.adminUser?.name || "Admin", "Update Email Settings", "Email SMTP settings updated", "info");
    res.json({ success: true, email: updated });
  }));

  app.put("/api/settings/sms", requireAdmin, h(async (req: AdminRequest, res) => {
    const updated = await dbStore.updateSmsSettings(req.body);
    await addLog(req.adminUser?.name || "Admin", "Update SMS Settings", `SMS Provider set to ${updated.provider}`, "info");
    res.json({ success: true, sms: updated });
  }));

  // --- HERO SLIDERS APIs ---
  app.get("/api/sliders", h(async (req, res) => {
    res.json(await dbStore.getSliders());
  }));

  app.post("/api/sliders", requireAdmin, h(async (req: AdminRequest, res) => {
    const slide = { ...req.body, id: req.body.id || `slide-${Date.now()}` };
    const saved = await dbStore.saveSlider(slide);
    await addLog(req.adminUser?.name || "Admin", "Added Hero Slide", `Slide "${saved.title}" created`, "success");
    res.json({ success: true, slide: saved });
  }));

  app.put("/api/sliders/:id", requireAdmin, h(async (req: AdminRequest, res) => {
    const slide = { ...req.body, id: req.params.id };
    const saved = await dbStore.saveSlider(slide);
    await addLog(req.adminUser?.name || "Admin", "Updated Hero Slide", `Slide "${saved.title}" updated`, "info");
    res.json({ success: true, slide: saved });
  }));

  app.delete("/api/sliders/:id", requireAdmin, h(async (req: AdminRequest, res) => {
    await dbStore.deleteSlider(req.params.id);
    await addLog(req.adminUser?.name || "Admin", "Deleted Hero Slide", `Slide ID ${req.params.id} deleted`, "warning");
    res.json({ success: true });
  }));

  // --- PRODUCTS APIs ---
  const normalizeProductForSave = (input: any) => {
    if (input.productType === 'combo') {
      const comboItems = Array.isArray(input.comboItems) ? input.comboItems : [];
      if (comboItems.length === 0) throw new Error('A combo needs at least one item. Search the catalogue and add the products included in this combo.');
      const normalizedItems = comboItems.map((item: any) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        if (!item.productId || !item.name) throw new Error('Every combo line must point at a catalogue product.');
        if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`Enter a whole quantity of 1 or more for ${item.name}.`);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`Enter a valid unit price for ${item.name}.`);
        return { productId: String(item.productId), name: String(item.name), image: item.image || null, quantity, unitPrice };
      });
      const itemsTotal = normalizedItems.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
      const regularPrice = Number.isFinite(Number(input.regularPrice)) && Number(input.regularPrice) > 0 ? Number(input.regularPrice) : itemsTotal;
      const hasSalePrice = input.salePrice !== undefined && input.salePrice !== null && input.salePrice !== '';
      const salePrice = hasSalePrice ? Number(input.salePrice) : undefined;
      if (salePrice !== undefined && (!Number.isFinite(salePrice) || salePrice <= 0)) throw new Error('The combo sale value must be greater than zero.');
      if (salePrice !== undefined && salePrice >= regularPrice) throw new Error('The combo sale value must be lower than the combined item value.');
      const effectivePrice = salePrice ?? regularPrice;
      return {
        ...input,
        comboItems: normalizedItems,
        variants: [],
        modifierGroups: [],
        regularPrice,
        salePrice,
        onSale: salePrice !== undefined,
        priceMin: effectivePrice,
        priceMax: effectivePrice,
      };
    }
    if (input.productType !== 'food') return { ...input, comboItems: null };
    if (!Array.isArray(input.variants) || input.variants.length === 0) throw new Error('Food products require at least one bulk order package.');
    const variants = input.variants.map((variant: any) => {
      const servesPersons = Number(variant.servesPersons);
      const price = Number(variant.price);
      if (!Number.isInteger(servesPersons) || servesPersons < 1 || !Number.isFinite(price) || price <= 0) throw new Error('Every food package requires a valid person count and price greater than zero.');
      return {
        ...variant,
        servesPersons,
        price,
        regularPrice: price,
        salePrice: undefined,
        attributes: [{ name: 'Serves', option: `${servesPersons} persons` }],
        stockStatus: variant.stockStatus || 'in_stock',
      };
    });
    const prices = variants.map((variant: any) => variant.price);
    return { ...input, comboItems: null, variants, modifierGroups: [], priceMin: Math.min(...prices), priceMax: Math.max(...prices), regularPrice: Math.min(...prices) };
  };

  app.get("/api/products", h(async (req, res) => {
    res.json(await dbStore.getProducts());
  }));

  app.post("/api/products", requireAdmin, h(async (req: AdminRequest, res) => {
    const p = normalizeProductForSave(req.body);
    const newProduct = {
      ...p,
      id: p.id || `tbh-${Date.now()}`,
      sku: p.sku || `TBH-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      stockQuantity: Number(p.stockQuantity ?? 20),
      stockStatus: p.stockStatus || 'in_stock'
    };
    const saved = await dbStore.saveProduct(newProduct);
    await addLog(req.adminUser?.name || "Admin", "Created Product", `Added ${saved.name} (SKU: ${saved.sku})`, "success");
    res.json({ success: true, product: saved });
  }));

  app.put("/api/products/:id", requireAdmin, h(async (req: AdminRequest, res) => {
    const updatedProduct = normalizeProductForSave({ ...req.body, id: req.params.id });
    const saved = await dbStore.saveProduct(updatedProduct);
    await addLog(req.adminUser?.name || "Admin", "Updated Product", `Updated ${saved.name}`, "info");
    res.json({ success: true, product: saved });
  }));

  app.delete("/api/products/:id", requireAdmin, h(async (req: AdminRequest, res) => {
    await dbStore.deleteProduct(req.params.id);
    await addLog(req.adminUser?.name || "Admin", "Deleted Product", `Removed product ${req.params.id}`, "warning");
    res.json({ success: true });
  }));

  // --- CATEGORIES APIs ---
  app.get("/api/categories", h(async (req, res) => {
    res.json(await dbStore.getCategories());
  }));

  app.post("/api/categories", requireAdmin, h(async (req: AdminRequest, res) => {
    const c = req.body;
    const newCategory = { ...c, id: c.id || `cat-${Date.now()}`, count: c.count || 0 };
    const saved = await dbStore.saveCategory(newCategory);
    await addLog(req.adminUser?.name || "Admin", "Created Category", `Added category ${saved.name}`, "success");
    res.json({ success: true, category: saved });
  }));

  app.put("/api/categories/:id", requireAdmin, h(async (req: AdminRequest, res) => {
    const updated = { ...req.body, id: req.params.id };
    const saved = await dbStore.saveCategory(updated);
    await addLog(req.adminUser?.name || "Admin", "Updated Category", `Updated category ${saved.name}`, "info");
    res.json({ success: true, category: saved });
  }));

  app.delete("/api/categories/:id", requireAdmin, h(async (req: AdminRequest, res) => {
    await dbStore.deleteCategory(req.params.id);
    await addLog(req.adminUser?.name || "Admin", "Deleted Category", `Deleted category ${req.params.id}`, "warning");
    res.json({ success: true });
  }));

  // --- ORDERS & TRACKING APIs ---
  app.get("/api/orders", h(async (req, res) => {
    const { email } = req.query;
    if (email && typeof email === 'string') {
      return res.json(await dbStore.getOrdersByCustomer(email));
    }
    // Full order list is admin-only (no email filter = every customer's data)
    const profile = await getAdminProfile(req);
    if (!profile) {
      return res.status(401).json({ error: "Admin access required to view all orders." });
    }
    res.json(await dbStore.getOrders());
  }));

  app.get("/api/orders/track/:orderId", h(async (req, res) => {
    const order = await dbStore.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found. Please check your order number." });
    }
    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      pickupBranch: order.pickupBranch,
      items: order.items,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      trackingHistory: order.trackingHistory
    });
  }));

  app.post("/api/orders", h(async (req, res) => {
    if (req.body?.paymentMethod === 'dialog_genie' && !isGenieConfigured()) {
      return res.status(400).json({ error: 'Card payment is not available right now. Please choose another payment method.' });
    }
    const newOrder = await dbStore.createOrder(req.body);

    // Card payments: the order stays unpaid until Genie confirms; the customer is sent to Genie's payment page.
    if (newOrder.paymentMethod === 'dialog_genie') {
      try {
        const settings = await withLiveGenieRate(await dbStore.getGeneralSettings());
        const paymentUrl = await startGeniePayment(newOrder, settings, siteOrigin(req));
        await addLog(newOrder.customerName || "Customer", "Placed New Order", `Order ${newOrder.orderNumber} awaiting card payment (Total: ${newOrder.total} ${settings.store.currency}, charged as LKR ${genieChargeInLkr(newOrder.total, settings)})`, "info");
        return res.json({ success: true, order: newOrder, paymentUrl });
      } catch (error: any) {
        console.error(`Genie payment start failed for ${newOrder.orderNumber}:`, error);
        await dbStore.updateOrderStatus(newOrder.id, 'failed', 'Could not open the Dialog Genie payment page');
        return res.status(502).json({ error: 'We couldn’t open the card payment page. Please try again, or choose another payment method.' });
      }
    }

    await addLog(
      newOrder.customerName || "Customer",
      "Placed New Order",
      `Order ${newOrder.orderNumber} placed for ${newOrder.pickupBranch} (Total: ${newOrder.total})`,
      "success"
    );

    const [smsSettings, siteSettings] = await Promise.all([dbStore.getSmsSettings(), dbStore.getGeneralSettings()]);
    if (siteSettings.contact.smsNotificationsEnabled && siteSettings.orders.customerConfirmationNotifications && smsSettings.notifyOnNewOrder && newOrder.customerPhone) {
      console.log(`[SMS Gateway (${smsSettings.provider})] Sent confirmation to ${newOrder.customerPhone}: "Thank you for ordering at Thinesh Bake House! Order #${newOrder.orderNumber} received. Pickup branch: ${newOrder.pickupBranch}"`);
    }

    res.json({ success: true, order: newOrder });
  }));

  // Genie sends the customer back here after the payment page (it appends transactionId & signature,
  // which are ignored: the order's own transaction is looked up at Genie instead).
  app.get("/api/payments/genie/return/:orderId", async (req, res) => {
    try {
      const { result, order } = await confirmGeniePayment(req.params.orderId);
      const query = new URLSearchParams({ payment: result === 'invalid' ? 'failed' : result, ...(order ? { order: order.orderNumber } : {}) });
      res.redirect(303, `/?${query}`);
    } catch (error) {
      console.error('Genie return error:', error);
      res.redirect(303, `/?payment=pending`);
    }
  });

  // Server-to-server notification from Genie (deployed site only). Body: { localId, transactionId, signature }.
  app.post("/api/payments/genie/webhook", async (req, res) => {
    try {
      const { result } = await confirmGeniePayment(String(req.body?.localId || ''));
      res.json({ received: true, result });
    } catch (error) {
      console.error('Genie webhook error:', error);
      res.status(500).json({ received: false });
    }
  });

  app.put("/api/orders/:id/status", requireAdmin, h(async (req: AdminRequest, res) => {
    const { status, note } = req.body;
    const siteSettings = await dbStore.getGeneralSettings();
    if (!siteSettings.orders.availableStatuses.includes(status)) return res.status(400).json({ error: 'That order status is not enabled in Website Settings.' });
    const updatedOrder = await dbStore.updateOrderStatus(req.params.id, status, note);
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

    await addLog(req.adminUser?.name || "Admin", "Updated Order Status", `Order ${updatedOrder.orderNumber} status changed to ${status.toUpperCase()}`, "info");

    const smsSettings = await dbStore.getSmsSettings();
    if (smsSettings.notifyOnStatusChange && updatedOrder.customerPhone) {
      console.log(`[SMS Gateway (${smsSettings.provider})] Sent status update SMS to ${updatedOrder.customerPhone}: "Your Thinesh Bake House Order #${updatedOrder.orderNumber} is now: ${status.replace('_', ' ').toUpperCase()}! Branch: ${updatedOrder.pickupBranch}"`);
    }

    res.json({ success: true, order: updatedOrder });
  }));

  // --- SMS DIRECT SEND API (admin only) ---
  app.post("/api/sms/send", requireAdmin, h(async (req: AdminRequest, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: "Phone number and message are required." });
    }
    const smsSettings = await dbStore.getSmsSettings();
    console.log(`[SMS Sent via ${smsSettings.provider}] To: ${phone} | Msg: ${message}`);
    await addLog(req.adminUser?.name || "Admin", "Sent Manual SMS", `Sent SMS to ${phone}`, "info");
    res.json({ success: true, message: `SMS notification dispatched to ${phone}` });
  }));

  // --- COUPONS APIs ---
  app.get("/api/coupons", requireAdmin, h(async (req, res) => {
    res.json(await dbStore.getCoupons());
  }));

  app.post("/api/coupons", requireAdmin, h(async (req: AdminRequest, res) => {
    const coupon = { ...req.body, id: req.body.id || `c-${Date.now()}` };
    const saved = await dbStore.saveCoupon(coupon);
    await addLog(req.adminUser?.name || "Admin", "Created Coupon", `Coupon code ${saved.code} created`, "success");
    res.json({ success: true, coupon: saved });
  }));

  app.put("/api/coupons/:id", requireAdmin, h(async (req: AdminRequest, res) => {
    const coupon = { ...req.body, id: req.params.id };
    const saved = await dbStore.saveCoupon(coupon);
    await addLog(req.adminUser?.name || "Admin", "Updated Coupon", `Coupon code ${saved.code} updated`, "info");
    res.json({ success: true, coupon: saved });
  }));

  app.delete("/api/coupons/:id", requireAdmin, h(async (req: AdminRequest, res) => {
    await dbStore.deleteCoupon(req.params.id);
    await addLog(req.adminUser?.name || "Admin", "Deleted Coupon", `Coupon ID ${req.params.id} deleted`, "warning");
    res.json({ success: true });
  }));

  app.post("/api/coupons/validate", h(async (req, res) => {
    const { code, cartSubtotal } = req.body;
    const siteSettings = await dbStore.getGeneralSettings();
    if (!siteSettings.store.couponsEnabled) return res.status(403).json({ error: 'Coupons are currently disabled.' });
    const coupons = await dbStore.getCoupons();
    const found = coupons.find(c => c.code.toUpperCase() === (code || '').toUpperCase() && c.isActive);

    if (!found) {
      return res.status(400).json({ error: "Invalid or expired promotional coupon code." });
    }

    if (found.minSpend && cartSubtotal < found.minSpend) {
      return res.status(400).json({ error: `Minimum order subtotal of Rs. ${found.minSpend} required for this coupon.` });
    }

    let discount = 0;
    if (found.type === 'percentage') {
      discount = Math.round((cartSubtotal * found.value) / 100);
    } else {
      discount = found.value;
    }

    res.json({ success: true, coupon: found, discountAmount: discount });
  }));

  // --- REVIEWS APIs ---
  app.get("/api/reviews", h(async (req, res) => {
    const siteSettings = await dbStore.getGeneralSettings();
    res.json(siteSettings.store.reviewsEnabled ? await dbStore.getReviews() : []);
  }));

  app.post("/api/reviews", h(async (req, res) => {
    const siteSettings = await dbStore.getGeneralSettings();
    if (!siteSettings.store.reviewsEnabled) return res.status(403).json({ error: 'Product reviews are currently disabled.' });
    const rev = await dbStore.addReview(req.body);
    await addLog("Customer", "Submitted Review", `Review for ${rev.productName} submitted`, "info");
    res.json({ success: true, review: rev });
  }));

  app.put("/api/reviews/:id/moderate", requireAdmin, h(async (req: AdminRequest, res) => {
    const { status, adminReply } = req.body;
    const updated = await dbStore.updateReviewStatus(req.params.id, status, adminReply);
    await addLog(req.adminUser?.name || "Admin", "Moderated Review", `Review ID ${req.params.id} set to ${status}`, "info");
    res.json({ success: true, review: updated });
  }));

  // --- LIGHTWEIGHT CUSTOMER LOGIN (public storefront — no password, email-based identity) ---
  app.post("/api/auth/login", h(async (req, res) => {
    const { email, name, phone } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });
    const user = await dbStore.getOrCreateCustomerByEmail(email, name, phone);
    await addLog(user.name, "Customer Logged In", `Customer session started for ${user.email}`, "info");
    res.json({ success: true, user });
  }));

  // --- REAL ADMIN/STAFF AUTH (Supabase Auth) — returns the caller's own admin profile ---
  app.get("/api/admin/me", requireAdmin, h(async (req: AdminRequest, res) => {
    res.json({ success: true, user: req.adminUser });
  }));

  // --- USER ROLES APIs (admin/staff accounts only) ---
  app.get("/api/users", requireAdmin, h(async (req, res) => {
    res.json(await dbStore.getUsers());
  }));

  app.put("/api/users/:id/role", requireAdmin, h(async (req: AdminRequest, res) => {
    const { role } = req.body;
    const updated = await dbStore.updateUserRole(req.params.id, role);
    await addLog(req.adminUser?.name || "Admin", "Changed User Role", `User ${req.params.id} updated to role ${role}`, "warning");
    res.json({ success: true, user: updated });
  }));

  // --- ANALYTICS & ACTIVITY LOGS APIs (admin only) ---
  app.get("/api/analytics", requireAdmin, h(async (req, res) => {
    res.json(await dbStore.getAnalytics());
  }));

  app.get("/api/activity-log", requireAdmin, h(async (req, res) => {
    res.json(await dbStore.getLogs());
  }));

  // --- WOOCOMMERCE INTEGRATION (all admin only) ---

  app.get("/api/woocommerce/settings", requireAdmin, h(async (req, res) => {
    const { data, error } = await supabaseAdmin.from('woocommerce_settings').select('*').eq('id', true).single();
    if (error) throw new Error(error.message);
    res.json({
      storeUrl: data.store_url || "",
      hasConsumerKey: Boolean(data.consumer_key),
      hasConsumerSecret: Boolean(data.consumer_secret),
      isActive: data.is_active,
      lastSyncedAt: data.last_synced_at,
    });
  }));

  app.put("/api/woocommerce/settings", requireAdmin, h(async (req: AdminRequest, res) => {
    const { url, consumerKey, consumerSecret } = req.body;
    if (!url || !consumerKey || !consumerSecret) {
      return res.status(400).json({ error: "Store URL, Consumer Key, and Consumer Secret are required." });
    }
    const { error } = await supabaseAdmin
      .from('woocommerce_settings')
      .update({ store_url: url, consumer_key: consumerKey, consumer_secret: consumerSecret, updated_at: new Date().toISOString() })
      .eq('id', true);
    if (error) throw new Error(error.message);
    await addLog(req.adminUser?.name || "Admin", "Saved WooCommerce Credentials", `Store URL set to ${url}`, "info");
    res.json({ success: true });
  }));

  async function loadStoredWcCreds() {
    const { data } = await supabaseAdmin.from('woocommerce_settings').select('*').eq('id', true).single();
    return {
      url: data?.store_url || process.env.WOOCOMMERCE_URL || "",
      consumerKey: data?.consumer_key || process.env.WOOCOMMERCE_CONSUMER_KEY || "",
      consumerSecret: data?.consumer_secret || process.env.WOOCOMMERCE_CONSUMER_SECRET || "",
    };
  }

  app.post("/api/woocommerce/test", requireAdmin, h(async (req, res) => {
    const stored = await loadStoredWcCreds();
    const url = req.body.url || stored.url;
    const consumerKey = req.body.consumerKey || stored.consumerKey;
    const consumerSecret = req.body.consumerSecret || stored.consumerSecret;

    if (!url || !consumerKey || !consumerSecret) {
      return res.status(400).json({ error: "Store URL, Consumer Key, and Consumer Secret are required." });
    }

    try {
      const products = await fetchWooCommerceProducts({ url, consumerKey, consumerSecret });
      res.json({ success: true, message: `Successfully connected to WooCommerce store! Found ${products.length} products.`, productCount: products.length });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || "Could not connect to WooCommerce. Please verify store URL and keys." });
    }
  }));

  // Preview fetch — does NOT touch the database, just returns live WooCommerce data for review.
  app.post("/api/woocommerce/sync", requireAdmin, h(async (req, res) => {
    const stored = await loadStoredWcCreds();
    const url = req.body.url || stored.url;
    const consumerKey = req.body.consumerKey || stored.consumerKey;
    const consumerSecret = req.body.consumerSecret || stored.consumerSecret;

    if (!url || !consumerKey || !consumerSecret) {
      return res.status(400).json({ error: "Missing WooCommerce credentials. Please provide url, consumerKey, and consumerSecret." });
    }

    const [products, categories] = await Promise.all([
      fetchWooCommerceProducts({ url, consumerKey, consumerSecret }),
      fetchWooCommerceCategories({ url, consumerKey, consumerSecret }).catch(err => {
        console.warn("Could not fetch WooCommerce categories, using fallback:", err.message);
        return [];
      })
    ]);

    res.json({ success: true, count: products.length, products, categories, storeUrl: url, syncedAt: new Date().toISOString() });
  }));

  // Full migration: fetch products+categories, download every image into Supabase Storage,
  // and upsert everything into the Supabase database. This is the "one-click migrate" action.
  app.post("/api/woocommerce/migrate", requireAdmin, h(async (req: AdminRequest, res) => {
    const stored = await loadStoredWcCreds();
    const url = req.body.url || stored.url;
    const consumerKey = req.body.consumerKey || stored.consumerKey;
    const consumerSecret = req.body.consumerSecret || stored.consumerSecret;
    const existingItemsStrategy = req.body.existingItemsStrategy || 'keep';

    if (!url || !consumerKey || !consumerSecret) {
      return res.status(400).json({ error: "Missing WooCommerce credentials. Please provide url, consumerKey, and consumerSecret." });
    }
    if (!['keep', 'replace'].includes(existingItemsStrategy)) {
      return res.status(400).json({ error: "existingItemsStrategy must be either 'keep' or 'replace'." });
    }

    // Persist the credentials being used, so future syncs don't require re-entry
    await supabaseAdmin.from('woocommerce_settings').update({
      store_url: url, consumer_key: consumerKey, consumer_secret: consumerSecret, updated_at: new Date().toISOString()
    }).eq('id', true);

    const [products, categories] = await Promise.all([
      fetchWooCommerceProducts({ url, consumerKey, consumerSecret }),
      fetchWooCommerceCategories({ url, consumerKey, consumerSecret }).catch(() => [] as any[])
    ]);

    let imagesMigrated = 0;

    // Keep image transfers bounded so a larger WooCommerce catalogue does not
    // exhaust sockets or Supabase Storage upload capacity.
    const mapWithConcurrency = async <T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> => {
      const results = new Array<R>(items.length);
      let nextIndex = 0;
      const worker = async () => {
        while (nextIndex < items.length) {
          const index = nextIndex++;
          results[index] = await mapper(items[index], index);
        }
      };
      await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
      return results;
    };

    // Download & re-host category images
    const migratedCategories = await mapWithConcurrency(categories, 4, async (c: any) => {
      let image = c.image;
      if (image) {
        image = await downloadAndUploadImage(image, `cat-${c.slug || c.id}`);
        if (image !== c.image) imagesMigrated++;
      }
      return {
        id: String(c.id),
        name: c.name,
        slug: c.slug || String(c.name).toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: c.description || '',
        image: image || '',
        count: c.count || 0,
        isFeatured: true,
      };
    });

    // Download & re-host product featured image + gallery
    const migratedProducts = await mapWithConcurrency(products, 4, async (p: any) => {
      let image = p.image;
      if (image) {
        const migrated = await downloadAndUploadImage(image, `${p.id}-main`);
        if (migrated !== image) imagesMigrated++;
        image = migrated;
      }

      let gallery: string[] | undefined = undefined;
      if (Array.isArray(p.gallery) && p.gallery.length > 0) {
        gallery = [];
        for (const [idx, src] of p.gallery.entries()) {
          const migrated = await downloadAndUploadImage(src, `${p.id}-gallery-${idx}`);
          if (migrated !== src) imagesMigrated++;
          gallery.push(migrated);
        }
      }

      return {
        ...p,
        id: p.id || `wc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sku: p.sku || `TBH-WC-${p.wcId || Math.floor(1000 + Math.random() * 9000)}`,
        image,
        gallery,
        regularPrice: p.regularPrice || p.priceMin || 0,
        stockQuantity: p.stockQuantity || 25,
        stockStatus: p.stockStatus || 'in_stock',
      };
    });

    await dbStore.setCategoriesAll(migratedCategories);
    await dbStore.setProductsAll(migratedProducts);

    let productsRemoved = 0;
    let categoriesRemoved = 0;
    if (existingItemsStrategy === 'replace') {
      // Imported rows are saved first. Only then remove records that were not part of this import.
      productsRemoved = await dbStore.pruneProductsExcept(migratedProducts.map(product => product.id));
      categoriesRemoved = await dbStore.pruneCategoriesExcept(migratedCategories.map(category => category.id));
    }

    await supabaseAdmin.from('woocommerce_settings').update({
      is_active: false, last_synced_at: new Date().toISOString()
    }).eq('id', true);

    await addLog(
      req.adminUser?.name || "Admin",
      "Migrated WooCommerce Catalog to Supabase",
      `Downloaded & stored ${migratedProducts.length} products, ${migratedCategories.length} categories, and ${imagesMigrated} images into Supabase. Existing item strategy: ${existingItemsStrategy}. Removed ${productsRemoved} old products and ${categoriesRemoved} old categories.`,
      "success"
    );

    res.json({
      success: true,
      message: `Migrated ${migratedProducts.length} products and ${migratedCategories.length} categories into Supabase, including ${imagesMigrated} downloaded images.`,
      productCount: migratedProducts.length,
      categoryCount: migratedCategories.length,
      imagesMigrated,
      existingItemsStrategy,
      productsRemoved,
      categoriesRemoved,
    });
  }));

  app.post("/api/woocommerce/disconnect", requireAdmin, h(async (req: AdminRequest, res) => {
    await supabaseAdmin.from('woocommerce_settings').update({ is_active: false }).eq('id', true);
    await addLog(req.adminUser?.name || "Admin", "Disconnected WooCommerce", "Live WooCommerce connection detached.", "info");
    res.json({ success: true, message: "WooCommerce live connection detached." });
  }));

  // --- GEMINI CHATBOT API ---
  // Customer chat assistant (Claude). Builds its own context from the live store data; see server/chatAssistant.ts.
  app.post("/api/chat", h(async (req, res) => { await handleChat(req, res); }));

  // Serve Vite app in development vs production
  if (process.env.NODE_ENV !== "production") {
    // Keep Vite/Rollup out of the Vercel serverless bundle. They are local
    // development/build tools and include platform-specific native packages.
    const vitePackage = 'vite';
    const { createServer: createViteServer } = await import(vitePackage);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Thinesh Bake House Backend running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
