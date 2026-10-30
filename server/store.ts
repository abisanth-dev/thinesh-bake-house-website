import { supabaseAdmin } from './supabaseClient.js';
import {
  Product,
  Category,
  Order,
  OrderTrackingStep,
  Coupon,
  Review,
  User,
  GeneralSettings,
  EmailSettings,
  SmsSettings,
  HeroSlide,
  ActivityLog,
  AnalyticsOverview,
  OrderStatus,
} from '../src/types.js';
import { mergeSiteSettings } from '../src/siteSettings.js';
import { checkoutDisabledCategoryNames, isProductCheckoutDisabled } from '../src/categoryCheckout.js';
import { isPaymentMethodAvailable } from '../src/paymentMethods.js';

function throwIfError(context: string, error: any) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function getColomboClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find(part => part.type === 'weekday')?.value || '');
  const time = `${parts.find(part => part.type === 'hour')?.value}:${parts.find(part => part.type === 'minute')?.value}`;
  return { weekday, time };
}

// ---------- Mappers: DB row (snake_case) <-> App shape (camelCase) ----------

function rowToProduct(r: any): Product {
  return {
    id: r.id,
    sku: r.sku ?? undefined,
    name: r.name,
    slug: r.slug ?? undefined,
    category: r.category,
    categories: r.categories ?? undefined,
    shortDescription: r.short_description ?? undefined,
    description: r.description,
    priceMin: Number(r.price_min ?? 0),
    priceMax: r.price_max != null ? Number(r.price_max) : undefined,
    regularPrice: r.regular_price != null ? Number(r.regular_price) : undefined,
    salePrice: r.sale_price != null ? Number(r.sale_price) : undefined,
    onSale: r.on_sale ?? undefined,
    image: r.image,
    gallery: r.gallery ?? undefined,
    tags: r.tags ?? undefined,
    isCustomizable: r.is_customizable ?? undefined,
    cakeTypes: r.cake_types ?? undefined,
    weights: r.weights ?? undefined,
    isFeatured: r.is_featured ?? undefined,
    isFastMoving: r.is_fast_moving ?? undefined,
    stockQuantity: r.stock_quantity ?? undefined,
    stockStatus: r.stock_status ?? undefined,
    seo: r.seo ?? undefined,
    wcId: r.wc_id ?? undefined,
    wcPermalink: r.wc_permalink ?? undefined,
    rawWcCategories: r.raw_wc_categories ?? undefined,
    variants: r.variants ?? undefined,
    productType: r.product_type ?? 'bakery',
    preparationMinutes: r.preparation_minutes ?? undefined,
    allowAsap: r.allow_asap ?? undefined,
    allowScheduled: r.allow_scheduled ?? undefined,
    modifierGroups: r.modifier_groups ?? undefined,
    comboItems: r.combo_items ?? undefined,
  };
}

function productToRow(p: Partial<Product> & { id: string }) {
  return {
    id: p.id,
    sku: p.sku ?? null,
    name: p.name,
    slug: p.slug ?? (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null),
    category: p.category ?? 'General',
    categories: p.categories ?? null,
    short_description: p.shortDescription ?? null,
    description: p.description ?? '',
    price_min: p.priceMin ?? 0,
    price_max: p.priceMax ?? null,
    regular_price: p.regularPrice ?? null,
    sale_price: p.salePrice ?? null,
    on_sale: p.onSale ?? false,
    // image/category/description are NOT NULL in Postgres, so empty values must fall back to the
    // column defaults rather than null — a combo saved before an image is picked would fail otherwise.
    image: p.image ?? '',
    gallery: p.gallery ?? null,
    tags: p.tags ?? null,
    is_customizable: p.isCustomizable ?? false,
    cake_types: p.cakeTypes ?? null,
    weights: p.weights ?? null,
    is_featured: p.isFeatured ?? false,
    is_fast_moving: p.isFastMoving ?? false,
    stock_quantity: p.stockQuantity ?? 0,
    stock_status: p.stockStatus ?? 'in_stock',
    seo: p.seo ?? null,
    wc_id: p.wcId ?? null,
    wc_permalink: p.wcPermalink ?? null,
    raw_wc_categories: p.rawWcCategories ?? null,
    variants: p.variants ?? null,
    product_type: p.productType ?? 'bakery',
    preparation_minutes: p.preparationMinutes ?? null,
    allow_asap: p.allowAsap ?? true,
    allow_scheduled: p.allowScheduled ?? true,
    modifier_groups: p.modifierGroups ?? null,
    combo_items: p.comboItems ?? null,
    updated_at: new Date().toISOString(),
  };
}

function rowToCategory(r: any): Category {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? undefined,
    image: r.image ?? undefined,
    parentId: r.parent_id ?? undefined,
    count: r.count ?? undefined,
    isFeatured: r.is_featured ?? undefined,
    seo: r.seo ?? undefined,
    menuGroup: r.menu_group ?? 'bakery',
    checkoutEnabled: r.checkout_enabled ?? true,
    // Home fields are mapped only when the columns exist, so admin saves keep working before migration 009 runs.
    ...(r.home_featured_order === undefined ? {} : { homeFeaturedOrder: r.home_featured_order }),
    ...(r.home_title === undefined ? {} : { homeTitle: r.home_title ?? '' }),
    ...(r.home_description === undefined ? {} : { homeDescription: r.home_description ?? '' }),
  };
}

function categoryToRow(c: Partial<Category> & { id: string }) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug ?? (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null),
    description: c.description ?? null,
    image: c.image ?? null,
    parent_id: c.parentId ?? null,
    count: c.count ?? 0,
    is_featured: c.isFeatured ?? false,
    seo: c.seo ?? null,
    menu_group: c.menuGroup ?? 'bakery',
    // Only written when set, so a WooCommerce re-sync keeps the admin's checkout switch.
    ...(c.checkoutEnabled === undefined ? {} : { checkout_enabled: c.checkoutEnabled }),
    ...(c.homeFeaturedOrder === undefined ? {} : { home_featured_order: c.homeFeaturedOrder }),
    ...(c.homeTitle === undefined ? {} : { home_title: c.homeTitle || null }),
    ...(c.homeDescription === undefined ? {} : { home_description: c.homeDescription || null }),
    updated_at: new Date().toISOString(),
  };
}

function rowToSlider(r: any): HeroSlide {
  return {
    id: r.id,
    sub: r.sub,
    title: r.title,
    highlight: r.highlight,
    image: r.image,
    btnText: r.btn_text,
    targetLink: r.target_link ?? undefined,
    isActive: r.is_active,
    order: r.order_num,
  };
}

function sliderToRow(s: Partial<HeroSlide> & { id: string }) {
  return {
    id: s.id,
    sub: s.sub ?? null,
    title: s.title,
    highlight: s.highlight ?? null,
    image: s.image,
    btn_text: s.btnText ?? null,
    target_link: s.targetLink ?? null,
    is_active: s.isActive ?? true,
    order_num: s.order ?? 1,
    updated_at: new Date().toISOString(),
  };
}

function rowToCoupon(r: any): Coupon {
  return {
    id: r.id,
    code: r.code,
    type: r.type,
    value: Number(r.value),
    minSpend: r.min_spend != null ? Number(r.min_spend) : undefined,
    maxSpend: r.max_spend != null ? Number(r.max_spend) : undefined,
    expiryDate: r.expiry_date ?? undefined,
    usageLimit: r.usage_limit ?? undefined,
    usageCount: r.usage_count ?? 0,
    isActive: r.is_active,
  };
}

function couponToRow(c: Partial<Coupon> & { id: string }) {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    min_spend: c.minSpend ?? null,
    max_spend: c.maxSpend ?? null,
    expiry_date: c.expiryDate ?? null,
    usage_limit: c.usageLimit ?? null,
    usage_count: c.usageCount ?? 0,
    is_active: c.isActive ?? true,
  };
}

function rowToReview(r: any): Review {
  return {
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    author: r.author,
    rating: r.rating,
    date: r.date,
    comment: r.comment,
    isVerified: r.is_verified ?? undefined,
    status: r.status,
    adminReply: r.admin_reply ?? undefined,
  };
}

function rowToOrder(r: any): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    pickupBranch: r.pickup_branch,
    pickupPerson: r.pickup_person ?? undefined,
    billingAddress: r.billing_address ?? undefined,
    shippingAddress: r.shipping_address ?? undefined,
    deliveryDate: r.delivery_date ?? undefined,
    deliveryTime: r.delivery_time ?? undefined,
    orderMode: r.order_mode ?? undefined,
    requestedFulfillmentAt: r.requested_fulfillment_at ?? undefined,
    orderType: r.order_type ?? undefined,
    items: r.items ?? [],
    subtotal: Number(r.subtotal),
    tax: Number(r.tax),
    shippingFee: Number(r.shipping_fee),
    discountAmount: Number(r.discount_amount),
    couponCode: r.coupon_code ?? undefined,
    total: Number(r.total),
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    paymentReference: r.payment_reference ?? undefined,
    paidAt: r.paid_at ?? undefined,
    bankReceiptUrl: r.bank_receipt_url ?? undefined,
    status: r.status,
    orderNotes: r.order_notes ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    trackingHistory: r.tracking_history ?? [],
  };
}

function rowToUser(r: any): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    phone: r.phone ?? undefined,
    avatar: r.avatar ?? undefined,
    billingAddress: r.billing_address ?? undefined,
    shippingAddress: r.shipping_address ?? undefined,
  };
}

function rowToLog(r: any): ActivityLog {
  return {
    id: r.id,
    timestamp: r.timestamp,
    user: r.user_name,
    action: r.action,
    details: r.details,
    type: r.type,
  };
}

function rowToGeneral(r: any): GeneralSettings {
  const legacy = mergeSiteSettings({
    identity: { siteTitle: r.store_name, tagline: r.store_tagline, logoUrl: r.logo_url } as any,
    business: { name: r.store_name, supportEmail: r.store_email, primaryPhone: r.store_phone, address: r.store_address } as any,
    store: { currencySymbol: r.currency_symbol, taxPercentage: Number(r.tax_rate_percent ?? 0) } as any,
    delivery: { defaultFee: Number(r.flat_shipping_fee ?? 0), freeDeliveryMinimum: Number(r.free_shipping_threshold ?? 0) } as any,
    system: { maintenanceMode: r.maintenance_mode ?? false } as any,
  });
  const settings = mergeSiteSettings({ ...legacy, ...(r.config || {}) });
  settings.system.lastUpdatedAt = r.updated_at ?? undefined;
  settings.system.lastUpdatedBy = r.updated_by ?? undefined;
  return settings;
}

function rowToEmail(r: any): EmailSettings {
  return {
    senderName: r.sender_name ?? '',
    senderEmail: r.sender_email ?? '',
    smtpHost: r.smtp_host ?? '',
    smtpPort: r.smtp_port ?? 587,
    smtpUser: r.smtp_user ?? '',
    adminNotificationEmail: r.admin_notification_email ?? '',
    enableOrderConfirmations: r.enable_order_confirmations ?? true,
    orderConfirmSubject: r.order_confirm_subject ?? '',
  };
}

function rowToSms(r: any): SmsSettings {
  return {
    provider: r.provider ?? 'simulator',
    accountSid: r.account_sid ?? '',
    authToken: r.auth_token ?? '',
    senderId: r.sender_id ?? '',
    notifyOnNewOrder: r.notify_on_new_order ?? true,
    notifyOnStatusChange: r.notify_on_status_change ?? true,
    adminAlertPhone: r.admin_alert_phone ?? '',
  };
}

// ---------- Activity Logging ----------

export async function addLog(
  user: string,
  action: string,
  details: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): Promise<ActivityLog> {
  const { data, error } = await supabaseAdmin
    .from('activity_logs')
    .insert({ user_name: user, action, details, type })
    .select()
    .single();
  throwIfError('Failed to write activity log', error);
  return rowToLog(data);
}

// ---------- Store Accessors ----------

export const dbStore = {
  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
    throwIfError('Failed to load products', error);
    return (data || []).map(rowToProduct);
  },
  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).maybeSingle();
    throwIfError('Failed to load product', error);
    return data ? rowToProduct(data) : null;
  },
  async saveProduct(product: Product): Promise<Product> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .upsert(productToRow(product), { onConflict: 'id' })
      .select()
      .single();
    throwIfError('Failed to save product', error);
    return rowToProduct(data);
  },
  async setProductsAll(products: Product[]): Promise<void> {
    if (products.length === 0) return;
    const rows = products.map(productToRow);
    const { error } = await supabaseAdmin.from('products').upsert(rows, { onConflict: 'id' });
    throwIfError('Failed to bulk save products', error);
  },
  async pruneProductsExcept(productIds: string[]): Promise<number> {
    const { data, error } = await supabaseAdmin.from('products').select('id');
    throwIfError('Failed to inspect existing products', error);
    const keep = new Set(productIds);
    const staleIds = (data || []).map(row => row.id as string).filter(id => !keep.has(id));
    for (let index = 0; index < staleIds.length; index += 100) {
      const { error: deleteError } = await supabaseAdmin.from('products').delete().in('id', staleIds.slice(index, index + 100));
      throwIfError('Failed to remove old products', deleteError);
    }
    return staleIds.length;
  },
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    throwIfError('Failed to delete product', error);
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabaseAdmin.from('categories').select('*').order('name');
    throwIfError('Failed to load categories', error);
    return (data || []).map(rowToCategory);
  },
  async saveCategory(category: Category): Promise<Category> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .upsert(categoryToRow(category), { onConflict: 'id' })
      .select()
      .single();
    throwIfError('Failed to save category', error);
    return rowToCategory(data);
  },
  async setCategoriesAll(categories: Category[]): Promise<void> {
    if (categories.length === 0) return;
    const rows = categories.map(categoryToRow);
    const { error } = await supabaseAdmin.from('categories').upsert(rows, { onConflict: 'id' });
    throwIfError('Failed to bulk save categories', error);
  },
  async pruneCategoriesExcept(categoryIds: string[]): Promise<number> {
    const { data, error } = await supabaseAdmin.from('categories').select('id');
    throwIfError('Failed to inspect existing categories', error);
    const keep = new Set(categoryIds);
    const staleIds = (data || []).map(row => row.id as string).filter(id => !keep.has(id));
    for (let index = 0; index < staleIds.length; index += 100) {
      const { error: deleteError } = await supabaseAdmin.from('categories').delete().in('id', staleIds.slice(index, index + 100));
      throwIfError('Failed to remove old categories', deleteError);
    }
    return staleIds.length;
  },
  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
    throwIfError('Failed to delete category', error);
  },

  // Sliders
  async getSliders(): Promise<HeroSlide[]> {
    const { data, error } = await supabaseAdmin.from('hero_slides').select('*').order('order_num');
    throwIfError('Failed to load sliders', error);
    return (data || []).map(rowToSlider);
  },
  async saveSlider(slide: HeroSlide): Promise<HeroSlide> {
    const { data, error } = await supabaseAdmin
      .from('hero_slides')
      .upsert(sliderToRow(slide), { onConflict: 'id' })
      .select()
      .single();
    throwIfError('Failed to save slide', error);
    return rowToSlider(data);
  },
  async deleteSlider(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('hero_slides').delete().eq('id', id);
    throwIfError('Failed to delete slide', error);
  },

  // Settings
  async getGeneralSettings(): Promise<GeneralSettings> {
    const { data, error } = await supabaseAdmin.from('general_settings').select('*').eq('id', true).single();
    throwIfError('Failed to load general settings', error);
    return rowToGeneral(data);
  },
  async updateGeneralSettings(settings: Partial<GeneralSettings>, actorId?: string): Promise<GeneralSettings> {
    const current = await this.getGeneralSettings();
    const merged = mergeSiteSettings({ ...current, ...settings });
    const row: any = {
      config: merged,
      store_name: merged.identity.siteTitle,
      store_tagline: merged.identity.tagline,
      store_email: merged.business.supportEmail,
      store_phone: merged.business.primaryPhone,
      store_address: merged.business.address,
      currency_symbol: merged.store.currencySymbol,
      maintenance_mode: merged.system.maintenanceMode,
      logo_url: merged.identity.logoUrl || null,
      tax_rate_percent: merged.store.taxPercentage,
      flat_shipping_fee: merged.delivery.defaultFee,
      free_shipping_threshold: merged.delivery.freeDeliveryMinimum,
      updated_at: new Date().toISOString(),
      ...(actorId ? { updated_by: actorId } : {}),
    };

    const { data, error } = await supabaseAdmin.from('general_settings').update(row).eq('id', true).select().single();
    throwIfError('Failed to update general settings', error);
    return rowToGeneral(data);
  },
  async getEmailSettings(): Promise<EmailSettings> {
    const { data, error } = await supabaseAdmin.from('email_settings').select('*').eq('id', true).single();
    throwIfError('Failed to load email settings', error);
    return rowToEmail(data);
  },
  async updateEmailSettings(settings: Partial<EmailSettings>): Promise<EmailSettings> {
    const row: any = { updated_at: new Date().toISOString() };
    if (settings.senderName !== undefined) row.sender_name = settings.senderName;
    if (settings.senderEmail !== undefined) row.sender_email = settings.senderEmail;
    if (settings.smtpHost !== undefined) row.smtp_host = settings.smtpHost;
    if (settings.smtpPort !== undefined) row.smtp_port = settings.smtpPort;
    if (settings.smtpUser !== undefined) row.smtp_user = settings.smtpUser;
    if (settings.adminNotificationEmail !== undefined) row.admin_notification_email = settings.adminNotificationEmail;
    if (settings.enableOrderConfirmations !== undefined) row.enable_order_confirmations = settings.enableOrderConfirmations;
    if (settings.orderConfirmSubject !== undefined) row.order_confirm_subject = settings.orderConfirmSubject;

    const { data, error } = await supabaseAdmin.from('email_settings').update(row).eq('id', true).select().single();
    throwIfError('Failed to update email settings', error);
    return rowToEmail(data);
  },
  async getSmsSettings(): Promise<SmsSettings> {
    const { data, error } = await supabaseAdmin.from('sms_settings').select('*').eq('id', true).single();
    throwIfError('Failed to load sms settings', error);
    return rowToSms(data);
  },
  async updateSmsSettings(settings: Partial<SmsSettings>): Promise<SmsSettings> {
    const row: any = { updated_at: new Date().toISOString() };
    if (settings.provider !== undefined) row.provider = settings.provider;
    if (settings.accountSid !== undefined) row.account_sid = settings.accountSid;
    if (settings.authToken !== undefined) row.auth_token = settings.authToken;
    if (settings.senderId !== undefined) row.sender_id = settings.senderId;
    if (settings.notifyOnNewOrder !== undefined) row.notify_on_new_order = settings.notifyOnNewOrder;
    if (settings.notifyOnStatusChange !== undefined) row.notify_on_status_change = settings.notifyOnStatusChange;
    if (settings.adminAlertPhone !== undefined) row.admin_alert_phone = settings.adminAlertPhone;

    const { data, error } = await supabaseAdmin.from('sms_settings').update(row).eq('id', true).select().single();
    throwIfError('Failed to update sms settings', error);
    return rowToSms(data);
  },

  // Orders & Tracking
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
    throwIfError('Failed to load orders', error);
    return (data || []).map(rowToOrder);
  },
  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .or(`id.eq.${id},order_number.eq.${id}`)
      .maybeSingle();
    throwIfError('Failed to load order', error);
    return data ? rowToOrder(data) : null;
  },
  async getOrdersByCustomer(email: string): Promise<Order[]> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .ilike('customer_email', email)
      .order('created_at', { ascending: false });
    throwIfError('Failed to load customer orders', error);
    return (data || []).map(rowToOrder);
  },
  async createOrder(
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'trackingHistory'>
  ): Promise<Order> {
    const settings = await dbStore.getGeneralSettings();
    if (!isPaymentMethodAvailable(orderData.paymentMethod, settings.payments)) throw new Error('That payment method isn’t available. Please choose another one.');
    if (!orderData.customerName?.trim() || !orderData.customerPhone?.trim() || !orderData.billingAddress?.street?.trim() || !orderData.billingAddress?.country?.trim()) throw new Error('Complete all required billing details.');
    if (orderData.shippingAddress) {
      const deliveryPhone = orderData.shippingAddress.phone.replace(/[\s()-]/g, '');
      if (!orderData.shippingAddress.fullName?.trim() || !orderData.shippingAddress.street?.trim() || !orderData.shippingAddress.city?.trim() || !orderData.shippingAddress.country?.trim()) throw new Error('Complete all required delivery details.');
      if (!/^(?:0\d{9}|94\d{9}|\+94\d{9})$/.test(deliveryPhone)) throw new Error('The delivery contact must be a valid Sri Lankan number.');
    } else if (!orderData.pickupPerson?.fullName?.trim() || !orderData.pickupPerson?.phone?.trim()) {
      throw new Error('Enter the pickup person’s name and contact number.');
    }
    const productIds = [...new Set(orderData.items.map(item => item.productId))];
    const { data: productRows, error: productError } = await supabaseAdmin.from('products').select('*').in('id', productIds);
    throwIfError('Failed to validate order products', productError);
    const productsById = new Map((productRows || []).map(product => [product.id, product]));
    const { data: categoryRows, error: categoryError } = await supabaseAdmin.from('categories').select('*');
    throwIfError('Failed to validate order categories', categoryError);
    const checkoutDisabledNames = checkoutDisabledCategoryNames((categoryRows || []).map(rowToCategory));
    const validatedItems = orderData.items.map(item => {
      const product = productsById.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} is no longer available.`);
      const menuGroupEnabled = product.product_type === 'food' ? settings.store.foodMenuEnabled : product.product_type === 'combo' ? settings.store.comboMenuEnabled : settings.store.bakeryMenuEnabled;
      if (!menuGroupEnabled || isProductCheckoutDisabled(product, checkoutDisabledNames)) throw new Error(`${product.name} is not available for ordering right now.`);
      if (product.stock_status === 'out_of_stock' && !settings.store.allowOutOfStockOrdering) throw new Error(`${product.name} is out of stock.`);
      if (product.product_type === 'combo') {
        // Combos are sold at one fixed bundle price, so the canonical sale/regular price is re-checked here.
        const comboPrice = Number(product.sale_price ?? product.price_min ?? 0);
        if (!(comboPrice > 0)) throw new Error(`${product.name} is not available right now.`);
        if (Math.abs(Number(item.price) - comboPrice) > 0.01) throw new Error(`The price for ${product.name} has changed. Refresh and try again.`);
        return { ...item, name: product.name, image: product.image, productType: 'combo' as const, price: comboPrice, comboItems: product.combo_items || [] };
      }
      if (product.product_type !== 'food') return { ...item, name: product.name, image: product.image, productType: 'bakery' as const };

      const bulkPackages = (product.variants || []).filter((candidate: any) => Number(candidate.servesPersons) > 0 && Number(candidate.price) > 0);
      const variant = bulkPackages.find((candidate: any) => candidate.id === item.customizations?.variantId);
      if (!variant) throw new Error(`Choose an available bulk order package for ${product.name}.`);
      if (variant?.stockStatus === 'out_of_stock' && !settings.store.allowOutOfStockOrdering) throw new Error(`The selected option for ${product.name} is out of stock.`);
      const expectedPrice = Number(variant.price);
      if (Math.abs(Number(item.price) - expectedPrice) > 0.01) throw new Error(`The price for ${product.name} has changed. Refresh and try again.`);
      return { ...item, name: product.name, image: product.image, productType: 'food' as const, price: expectedPrice, customizations: { ...item.customizations, variantId: variant.id, variantLabel: `Serves ${variant.servesPersons} people`, servesPersons: Number(variant.servesPersons), foodModifiers: undefined, preparationNotes: undefined } };
    });

    const containsFood = validatedItems.some(item => item.productType === 'food');
    const containsBakery = validatedItems.some(item => item.productType !== 'food');
    const validatedSubtotal = validatedItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    if (Math.abs(validatedSubtotal - Number(orderData.subtotal)) > 0.01) throw new Error('The cart total has changed. Refresh and try again.');
    const validatedTotal = Math.max(0, validatedSubtotal + Number(orderData.tax) + Number(orderData.shippingFee) - Number(orderData.discountAmount));
    if (Math.abs(validatedTotal - Number(orderData.total)) > 0.01) throw new Error('The order total is invalid. Refresh and try again.');
    const validatedOrderType = containsFood && containsBakery ? 'mixed' : containsFood ? 'food' : 'bakery';
    let validatedRequestedFulfillmentAt = orderData.requestedFulfillmentAt ?? null;
    if (containsFood) {
      if (!settings.foodOrdering.enabled || settings.foodOrdering.temporarilyClosed) throw new Error(settings.foodOrdering.closedMessage);
      const foodProducts = (productRows || []).filter(product => product.product_type === 'food');
      const preparationMinutes = Math.max(settings.foodOrdering.asapBufferMinutes, ...foodProducts.map(product => Number(product.preparation_minutes || settings.foodOrdering.defaultPreparationMinutes)));
      const earliestKitchenTime = new Date(Date.now() + preparationMinutes * 60_000);
      if (validatedOrderType === 'mixed' && orderData.orderMode === 'asap') throw new Error('Mixed bakery and food orders must be scheduled together.');
      if (orderData.orderMode === 'asap') {
        const clock = getColomboClock();
        if (!settings.foodOrdering.allowAsap || foodProducts.some(product => product.allow_asap === false)) throw new Error('ASAP food ordering is disabled for this cart.');
        if (!settings.foodOrdering.openingDays.includes(clock.weekday) || clock.time < settings.foodOrdering.openTime || clock.time > settings.foodOrdering.lastOrderTime) throw new Error('The kitchen is not accepting ASAP orders right now. Please schedule the order.');
        validatedRequestedFulfillmentAt = earliestKitchenTime.toISOString();
      } else {
        if (!settings.foodOrdering.allowScheduled || foodProducts.some(product => product.allow_scheduled === false) || !orderData.deliveryDate || !orderData.deliveryTime) throw new Error('Choose an available scheduled food order time.');
        const scheduledDay = new Date(`${orderData.deliveryDate}T12:00:00+05:30`).getUTCDay();
        if (!settings.foodOrdering.openingDays.includes(scheduledDay) || orderData.deliveryTime < settings.foodOrdering.openTime || orderData.deliveryTime > settings.foodOrdering.lastOrderTime) throw new Error('The selected time is outside kitchen ordering hours.');
        const requestedTime = new Date(`${orderData.deliveryDate}T${orderData.deliveryTime}:00+05:30`);
        if (Number.isNaN(requestedTime.getTime()) || requestedTime.getTime() < earliestKitchenTime.getTime()) throw new Error(`Please allow at least ${preparationMinutes} minutes for kitchen preparation.`);
        const latestItemDate = validatedItems.reduce((latest, item) => item.customizations?.deliveryDate && item.customizations.deliveryDate > latest ? item.customizations.deliveryDate : latest, '');
        if (latestItemDate && orderData.deliveryDate < latestItemDate) throw new Error(`An item in this cart requires ${latestItemDate} or later.`);
        validatedRequestedFulfillmentAt = requestedTime.toISOString();
      }
      if (settings.foodOrdering.maximumOrdersPerSlot > 0 && validatedRequestedFulfillmentAt) {
        const { count: slotCount, error: slotError } = await supabaseAdmin.from('orders').select('id', { count: 'exact', head: true }).eq('requested_fulfillment_at', validatedRequestedFulfillmentAt).not('status', 'in', '(cancelled,failed,refunded)');
        throwIfError('Failed to validate kitchen slot', slotError);
        if ((slotCount || 0) >= settings.foodOrdering.maximumOrdersPerSlot) throw new Error('That kitchen time slot is full. Choose another time.');
      }
    }
    const { count } = await supabaseAdmin.from('orders').select('id', { count: 'exact', head: true });
    const orderNumber = `${settings.orders.numberPrefix}${(count || 0) + 1002}`;
    const id = `ord-${Date.now()}`;
    const now = new Date().toISOString();
    const initialStatus = settings.orders.defaultStatus;
    const orderType = validatedOrderType;
    const preparationLabel = orderType === 'food' ? 'Kitchen Preparation' : orderType === 'mixed' ? 'Bakery & Kitchen Preparation' : 'Oven Preparation';
    const preparationNote = orderType === 'food' ? 'Kitchen team preparing food items' : orderType === 'mixed' ? 'Bakery and kitchen teams preparing the full order' : 'Bakers preparing items';

    const initialTracking: OrderTrackingStep[] = [
      { status: initialStatus, label: `Order ${initialStatus.replaceAll('_', ' ')}`, timestamp: now, completed: true },
      { status: 'processing', label: preparationLabel, timestamp: now, note: preparationNote, completed: false },
      { status: 'ready_for_pickup', label: 'Ready for Pickup / Delivery', timestamp: now, completed: false },
    ];

    const row = {
      id,
      order_number: orderNumber,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      pickup_branch: orderData.pickupBranch,
      pickup_person: orderData.pickupPerson ?? null,
      billing_address: orderData.billingAddress ?? null,
      shipping_address: orderData.shippingAddress ?? null,
      delivery_date: orderData.deliveryDate ?? null,
      delivery_time: orderData.deliveryTime ?? null,
      order_mode: orderData.orderMode ?? 'scheduled',
      requested_fulfillment_at: validatedRequestedFulfillmentAt,
      order_type: orderType,
      items: validatedItems,
      subtotal: validatedSubtotal,
      tax: orderData.tax,
      shipping_fee: orderData.shippingFee,
      discount_amount: orderData.discountAmount,
      coupon_code: orderData.couponCode ?? null,
      total: validatedTotal,
      payment_method: orderData.paymentMethod,
      // Never taken from the request: only a confirmed gateway payment or an admin marks an order paid.
      payment_status: 'unpaid',
      bank_receipt_url: orderData.bankReceiptUrl ?? null,
      status: initialStatus,
      order_notes: orderData.orderNotes ?? null,
      tracking_history: initialTracking,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin.from('orders').insert(row).select().single();
    throwIfError('Failed to create order', error);
    if (settings.orders.automaticallyReduceStock) {
      for (const item of validatedItems) {
        const { data: product } = await supabaseAdmin.from('products').select('stock_quantity').eq('id', item.productId).maybeSingle();
        if (product?.stock_quantity != null) {
          const nextStock = Math.max(0, Number(product.stock_quantity) - Number(item.quantity || 0));
          await supabaseAdmin.from('products').update({ stock_quantity: nextStock, stock_status: nextStock === 0 ? 'out_of_stock' : nextStock <= settings.store.lowStockThreshold ? 'low_stock' : 'in_stock' }).eq('id', item.productId);
        }
      }
    }
    return rowToOrder(data);
  },
  async setOrderPaymentReference(id: string, reference: string): Promise<void> {
    const { error } = await supabaseAdmin.from('orders').update({ payment_reference: reference, updated_at: new Date().toISOString() }).eq('id', id);
    throwIfError('Failed to save payment reference', error);
  },
  async markOrderPaid(id: string, reference: string, note: string): Promise<Order | null> {
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from('orders').update({ payment_status: 'paid', payment_reference: reference, paid_at: now, updated_at: now }).eq('id', id);
    throwIfError('Failed to mark order paid', error);
    return dbStore.updateOrderStatus(id, 'processing', note);
  },

  async updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<Order | null> {
    const existing = await dbStore.getOrderById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const history = [...existing.trackingHistory];
    const idx = history.findIndex((s) => s.status === status);
    if (idx > -1) {
      history[idx] = { ...history[idx], completed: true, timestamp: now, note: note ?? history[idx].note };
    } else {
      history.push({ status, label: `Status: ${status.replace('_', ' ').toUpperCase()}`, timestamp: now, note, completed: true });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status, tracking_history: history, updated_at: now })
      .eq('id', existing.id)
      .select()
      .single();
    throwIfError('Failed to update order status', error);
    return rowToOrder(data);
  },

  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabaseAdmin.from('coupons').select('*').order('code');
    throwIfError('Failed to load coupons', error);
    return (data || []).map(rowToCoupon);
  },
  async saveCoupon(coupon: Coupon): Promise<Coupon> {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .upsert(couponToRow(coupon), { onConflict: 'id' })
      .select()
      .single();
    throwIfError('Failed to save coupon', error);
    return rowToCoupon(data);
  },
  async deleteCoupon(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
    throwIfError('Failed to delete coupon', error);
  },

  // Reviews
  async getReviews(): Promise<Review[]> {
    const { data, error } = await supabaseAdmin.from('reviews').select('*').order('date', { ascending: false });
    throwIfError('Failed to load reviews', error);
    return (data || []).map(rowToReview);
  },
  async addReview(review: Omit<Review, 'id' | 'date' | 'status'>): Promise<Review> {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        product_id: review.productId,
        product_name: review.productName,
        author: review.author,
        rating: review.rating,
        comment: review.comment,
        is_verified: review.isVerified ?? false,
        status: 'pending',
      })
      .select()
      .single();
    throwIfError('Failed to add review', error);
    return rowToReview(data);
  },
  async updateReviewStatus(id: string, status: 'approved' | 'rejected', adminReply?: string): Promise<Review | null> {
    const row: any = { status };
    if (adminReply !== undefined) row.admin_reply = adminReply;
    const { data, error } = await supabaseAdmin.from('reviews').update(row).eq('id', id).select().maybeSingle();
    throwIfError('Failed to update review', error);
    return data ? rowToReview(data) : null;
  },

  // Users (admin/staff profiles; customers may not have auth accounts)
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').order('name');
    throwIfError('Failed to load users', error);
    return (data || []).map(rowToUser);
  },
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').ilike('email', email).maybeSingle();
    throwIfError('Failed to load user', error);
    return data ? rowToUser(data) : null;
  },
  async updateUserRole(userId: string, role: User['role']): Promise<User | null> {
    const { data, error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', userId).select().maybeSingle();
    throwIfError('Failed to update user role', error);
    return data ? rowToUser(data) : null;
  },

  // Customers (lightweight guest-style accounts, no password — used by the public storefront
  // for order history / wishlist identification. Real admin auth is separate, via Supabase Auth.)
  async getOrCreateCustomerByEmail(email: string, name?: string, phone?: string): Promise<User> {
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('customers')
      .select('*')
      .ilike('email', email)
      .maybeSingle();
    throwIfError('Failed to look up customer', findErr);

    if (existing) {
      return { id: existing.id, name: existing.name, email: existing.email, role: 'customer', phone: existing.phone ?? undefined, shippingAddress: existing.shipping_address ?? undefined };
    }

    const { data: created, error: createErr } = await supabaseAdmin
      .from('customers')
      .insert({ name: name || email.split('@')[0], email, phone: phone || null })
      .select()
      .single();
    throwIfError('Failed to create customer', createErr);
    return { id: created.id, name: created.name, email: created.email, role: 'customer', phone: created.phone ?? undefined, shippingAddress: created.shipping_address ?? undefined };
  },

  // Analytics & Logs
  async getLogs(): Promise<ActivityLog[]> {
    const { data, error } = await supabaseAdmin.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(200);
    throwIfError('Failed to load activity log', error);
    return (data || []).map(rowToLog);
  },
  async getAnalytics(): Promise<AnalyticsOverview> {
    const [{ data: orders, error: ordErr }, { data: products, error: prodErr }, { count: customerCount, error: custErr }] =
      await Promise.all([
        supabaseAdmin.from('orders').select('total, status'),
        supabaseAdmin.from('products').select('stock_quantity, stock_status'),
        supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      ]);
    throwIfError('Failed to load analytics (orders)', ordErr);
    throwIfError('Failed to load analytics (products)', prodErr);
    throwIfError('Failed to load analytics (customers)', custErr);

    const validOrders = (orders || []).filter((o) => o.status !== 'cancelled' && o.status !== 'failed');
    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const lowStockCount = (products || []).filter((p) => (p.stock_quantity ?? 0) <= 5 || p.stock_status === 'low_stock').length;

    return {
      totalRevenue,
      totalOrders: (orders || []).length,
      activeCustomers: customerCount || 0,
      lowStockCount,
      recentOrdersCount: (orders || []).length,
      averageOrderValue: (orders || []).length > 0 ? Math.round(totalRevenue / (orders || []).length) : 0,
    };
  },
};
