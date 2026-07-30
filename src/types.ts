export type UserRole = 'administrator' | 'shop_manager' | 'customer' | 'subscriber';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
}

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface ProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  slug?: string;
  category: string;
  categories?: string[];
  shortDescription?: string;
  description: string;
  priceMin: number;
  priceMax?: number;
  regularPrice?: number;
  salePrice?: number;
  onSale?: boolean;
  image: string; // Featured image
  gallery?: string[]; // Product gallery images
  tags?: string[];
  isCustomizable?: boolean;
  cakeTypes?: string[];
  weights?: string[];
  isFeatured?: boolean;
  isFastMoving?: boolean;
  stockQuantity?: number;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'low_stock';
  seo?: ProductSEO;
  wcId?: number;
  wcPermalink?: string;
  rawWcCategories?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  count?: number;
  isFeatured?: boolean;
  seo?: ProductSEO;
}

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  description?: string;
  image?: string;
}

export interface WooCommerceCredentials {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedPrice: number;
  customizations?: {
    cakeType?: string;
    weight?: string;
    deliveryDate?: string;
    message?: string;
  };
}

export type OrderStatus = 
  | 'pending_payment'
  | 'processing'
  | 'on_hold'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export type PaymentMethod = 
  | 'cod' 
  | 'bank_transfer' 
  | 'stripe' 
  | 'payhere' 
  | 'dialog_genie';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  customizations?: {
    cakeType?: string;
    weight?: string;
    deliveryDate?: string;
    message?: string;
  };
}

export interface OrderTrackingStep {
  status: OrderStatus;
  label: string;
  timestamp: string;
  note?: string;
  completed: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupBranch: string;
  shippingAddress?: Address;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  bankReceiptUrl?: string;
  status: OrderStatus;
  orderNotes?: string;
  createdAt: string;
  updatedAt: string;
  trackingHistory: OrderTrackingStep[];
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_cart' | 'fixed_product';
  value: number;
  minSpend?: number;
  maxSpend?: number;
  expiryDate?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  isVerified?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminReply?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  image: string;
}

export interface HeroSlide {
  id: string;
  sub: string;
  title: string;
  highlight: string;
  image: string;
  btnText: string;
  targetLink?: string;
  isActive: boolean;
  order: number;
}

export interface GeneralSettings {
  storeName: string;
  storeTagline: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currencySymbol: string;
  maintenanceMode: boolean;
  logoUrl?: string;
  taxRatePercent: number;
  flatShippingFee: number;
  freeShippingThreshold: number;
}

export interface EmailSettings {
  senderName: string;
  senderEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  adminNotificationEmail: string;
  enableOrderConfirmations: boolean;
  orderConfirmSubject: string;
}

export type SmsProvider = 'twilio' | 'dialog_sms' | 'mobitel' | 'simulator';

export interface SmsSettings {
  provider: SmsProvider;
  accountSid: string;
  authToken: string;
  senderId: string;
  notifyOnNewOrder: boolean;
  notifyOnStatusChange: boolean;
  adminAlertPhone: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  lowStockCount: number;
  recentOrdersCount: number;
  averageOrderValue: number;
}
