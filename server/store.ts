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
} from '../src/types';

function throwIfError(context: string, error: any) {
  if (error) throw new Error(`${context}: ${error.message}`);
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
  };
}

function productToRow(p: Partial<Product> & { id: string }) {
  return {
    id: p.id,
    sku: p.sku ?? null,
    name: p.name,
    slug: p.slug ?? (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null),
    category: p.category ?? null,
    categories: p.categories ?? null,
    short_description: p.shortDescription ?? null,
    description: p.description ?? '',
    price_min: p.priceMin ?? 0,
    price_max: p.priceMax ?? null,
    regular_price: p.regularPrice ?? null,
    sale_price: p.salePrice ?? null,
    on_sale: p.onSale ?? false,
    image: p.image ?? null,
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
    shippingAddress: r.shipping_address ?? undefined,
    items: r.items ?? [],
    subtotal: Number(r.subtotal),
    tax: Number(r.tax),
    shippingFee: Number(r.shipping_fee),
    discountAmount: Number(r.discount_amount),
    couponCode: r.coupon_code ?? undefined,
    total: Number(r.total),
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
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
  return {
    storeName: r.store_name,
    storeTagline: r.store_tagline ?? '',
    storeEmail: r.store_email ?? '',
    storePhone: r.store_phone ?? '',
    storeAddress: r.store_address ?? '',
    currencySymbol: r.currency_symbol ?? 'Rs.',
    maintenanceMode: r.maintenance_mode ?? false,
    logoUrl: r.logo_url ?? undefined,
    taxRatePercent: Number(r.tax_rate_percent ?? 0),
    flatShippingFee: Number(r.flat_shipping_fee ?? 0),
    freeShippingThreshold: Number(r.free_shipping_threshold ?? 0),
  };
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
  async updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<GeneralSettings> {
    const row: any = { updated_at: new Date().toISOString() };
    if (settings.storeName !== undefined) row.store_name = settings.storeName;
    if (settings.storeTagline !== undefined) row.store_tagline = settings.storeTagline;
    if (settings.storeEmail !== undefined) row.store_email = settings.storeEmail;
    if (settings.storePhone !== undefined) row.store_phone = settings.storePhone;
    if (settings.storeAddress !== undefined) row.store_address = settings.storeAddress;
    if (settings.currencySymbol !== undefined) row.currency_symbol = settings.currencySymbol;
    if (settings.maintenanceMode !== undefined) row.maintenance_mode = settings.maintenanceMode;
    if (settings.logoUrl !== undefined) row.logo_url = settings.logoUrl;
    if (settings.taxRatePercent !== undefined) row.tax_rate_percent = settings.taxRatePercent;
    if (settings.flatShippingFee !== undefined) row.flat_shipping_fee = settings.flatShippingFee;
    if (settings.freeShippingThreshold !== undefined) row.free_shipping_threshold = settings.freeShippingThreshold;

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
    const { count } = await supabaseAdmin.from('orders').select('id', { count: 'exact', head: true });
    const orderNumber = `TBH-${(count || 0) + 1002}`;
    const id = `ord-${Date.now()}`;
    const now = new Date().toISOString();

    const initialTracking: OrderTrackingStep[] = [
      { status: 'pending_payment', label: 'Order Received & Placed', timestamp: now, completed: true },
      { status: 'processing', label: 'Oven Preparation', timestamp: now, note: 'Bakers preparing items', completed: false },
      { status: 'ready_for_pickup', label: 'Ready for Pickup / Delivery', timestamp: now, completed: false },
    ];

    const row = {
      id,
      order_number: orderNumber,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      customer_phone: orderData.customerPhone,
      pickup_branch: orderData.pickupBranch,
      shipping_address: orderData.shippingAddress ?? null,
      items: orderData.items,
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      shipping_fee: orderData.shippingFee,
      discount_amount: orderData.discountAmount,
      coupon_code: orderData.couponCode ?? null,
      total: orderData.total,
      payment_method: orderData.paymentMethod,
      payment_status: orderData.paymentStatus,
      bank_receipt_url: orderData.bankReceiptUrl ?? null,
      status: orderData.status || 'pending_payment',
      order_notes: orderData.orderNotes ?? null,
      tracking_history: initialTracking,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin.from('orders').insert(row).select().single();
    throwIfError('Failed to create order', error);
    return rowToOrder(data);
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
