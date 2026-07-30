import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { fetchWooCommerceCategories, fetchWooCommerceProducts } from "./server/woocommerce.js";
import { dbStore, addLog } from "./server/store.js";
import { supabaseAdmin, requireAdmin, getAdminProfile, AdminRequest } from "./server/supabaseClient.js";
import { uploadDataUrlImage, downloadAndUploadImage } from "./server/storage.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

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
    if (!image) {
      return res.status(400).json({ error: "Image data (base64 or URL) is required." });
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

  app.put("/api/settings/general", requireAdmin, h(async (req: AdminRequest, res) => {
    const updated = await dbStore.updateGeneralSettings(req.body);
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
  app.get("/api/products", h(async (req, res) => {
    res.json(await dbStore.getProducts());
  }));

  app.post("/api/products", requireAdmin, h(async (req: AdminRequest, res) => {
    const p = req.body;
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
    const updatedProduct = { ...req.body, id: req.params.id };
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
    const newOrder = await dbStore.createOrder(req.body);
    await addLog(
      newOrder.customerName || "Customer",
      "Placed New Order",
      `Order ${newOrder.orderNumber} placed for ${newOrder.pickupBranch} (Total: ${newOrder.total})`,
      "success"
    );

    const smsSettings = await dbStore.getSmsSettings();
    if (smsSettings.notifyOnNewOrder && newOrder.customerPhone) {
      console.log(`[SMS Gateway (${smsSettings.provider})] Sent confirmation to ${newOrder.customerPhone}: "Thank you for ordering at Thinesh Bake House! Order #${newOrder.orderNumber} received. Pickup branch: ${newOrder.pickupBranch}"`);
    }

    res.json({ success: true, order: newOrder });
  }));

  app.put("/api/orders/:id/status", requireAdmin, h(async (req: AdminRequest, res) => {
    const { status, note } = req.body;
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
    res.json(await dbStore.getReviews());
  }));

  app.post("/api/reviews", h(async (req, res) => {
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

    if (!url || !consumerKey || !consumerSecret) {
      return res.status(400).json({ error: "Missing WooCommerce credentials. Please provide url, consumerKey, and consumerSecret." });
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

    // Download & re-host category images
    const migratedCategories = await Promise.all(categories.map(async (c: any) => {
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
    }));

    // Download & re-host product featured image + gallery
    const migratedProducts = await Promise.all(products.map(async (p: any) => {
      let image = p.image;
      if (image) {
        const migrated = await downloadAndUploadImage(image, `${p.id}-main`);
        if (migrated !== image) imagesMigrated++;
        image = migrated;
      }

      let gallery: string[] | undefined = undefined;
      if (Array.isArray(p.gallery) && p.gallery.length > 0) {
        gallery = await Promise.all(p.gallery.map(async (src: string, idx: number) => {
          const migrated = await downloadAndUploadImage(src, `${p.id}-gallery-${idx}`);
          if (migrated !== src) imagesMigrated++;
          return migrated;
        }));
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
    }));

    await dbStore.setCategoriesAll(migratedCategories);
    await dbStore.setProductsAll(migratedProducts);

    await supabaseAdmin.from('woocommerce_settings').update({
      is_active: false, last_synced_at: new Date().toISOString()
    }).eq('id', true);

    await addLog(
      req.adminUser?.name || "Admin",
      "Migrated WooCommerce Catalog to Supabase",
      `Downloaded & stored ${migratedProducts.length} products, ${migratedCategories.length} categories, and ${imagesMigrated} images into Supabase.`,
      "success"
    );

    res.json({
      success: true,
      message: `Migrated ${migratedProducts.length} products and ${migratedCategories.length} categories into Supabase, including ${imagesMigrated} downloaded images.`,
      productCount: migratedProducts.length,
      categoryCount: migratedCategories.length,
      imagesMigrated,
    });
  }));

  app.post("/api/woocommerce/disconnect", requireAdmin, h(async (req: AdminRequest, res) => {
    await supabaseAdmin.from('woocommerce_settings').update({ is_active: false }).eq('id', true);
    await addLog(req.adminUser?.name || "Admin", "Disconnected WooCommerce", "Live WooCommerce connection detached.", "info");
    res.json({ success: true, message: "WooCommerce live connection detached." });
  }));

  // --- GEMINI CHATBOT API ---
  app.post("/api/chat", h(async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured in the application environment variables." });
    }

    const { messages, products } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const menu = products || (await dbStore.getProducts());
    const systemInstruction = `You are "Baker Buddy", the interactive AI assistant for Thinesh Bake House (TBH) in Sri Lanka (Jaffna & Colombo branches).
Menu: ${JSON.stringify(menu, null, 2)}`;

    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: { systemInstruction, temperature: 0.7 },
    });

    res.json({ reply: response.text });
  }));

  // Serve Vite app in development vs production
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Thinesh Bake House Backend running on http://localhost:${PORT}`);
  });
}

startServer();
