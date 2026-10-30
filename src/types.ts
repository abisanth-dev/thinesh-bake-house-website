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

export interface PickupPerson {
  fullName: string;
  phone: string;
}

/** The three top-level storefront menu groups. Products and categories both belong to one. */
export type MenuGroup = 'bakery' | 'food' | 'combo';

/** One catalogue product included inside a combo, e.g. 15 × Fish Roll. */
export interface ComboItem {
  productId: string;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
}

export interface ProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface ProductVariant {
  id: string;
  wcId?: number;
  servesPersons?: number;
  sku?: string;
  price: number;
  regularPrice?: number;
  salePrice?: number;
  image?: string;
  stockQuantity?: number;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'low_stock';
  attributes: Array<{ name: string; option: string }>;
}

export interface ProductModifierOption {
  id: string;
  name: string;
  priceAdjustment: number;
  enabled: boolean;
}

export interface ProductModifierGroup {
  id: string;
  name: string;
  required: boolean;
  selectionType: 'single' | 'multiple';
  minimumSelections: number;
  maximumSelections?: number;
  options: ProductModifierOption[];
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
  /** Set by the storefront when the product's category has checkout switched off in admin. */
  checkoutDisabled?: boolean;
  seo?: ProductSEO;
  wcId?: number;
  wcPermalink?: string;
  rawWcCategories?: string[];
  variants?: ProductVariant[];
  productType?: MenuGroup;
  preparationMinutes?: number;
  allowAsap?: boolean;
  allowScheduled?: boolean;
  modifierGroups?: ProductModifierGroup[];
  /** Combo products only: the catalogue items bundled into this combo. */
  comboItems?: ComboItem[];
}

export interface SelectedFoodModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceAdjustment: number;
}

export interface CartItemCustomizations {
  cakeType?: string;
  weight?: string;
  deliveryDate?: string;
  message?: string;
  variantId?: string;
  variantLabel?: string;
  servesPersons?: number;
  foodModifiers?: SelectedFoodModifier[];
  preparationNotes?: string;
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
  /** Which main menu tab this category is listed under. Defaults to bakery. */
  menuGroup?: MenuGroup;
  /** When false, products in this category cannot be opened, added to the cart or ordered. Defaults to true. */
  checkoutEnabled?: boolean;
  /** Position of this category's carousel on the home page; null means it is not featured there. */
  homeFeaturedOrder?: number | null;
  /** Home carousel heading; falls back to the category name. */
  homeTitle?: string;
  /** Short line under the home carousel heading. */
  homeDescription?: string;
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
  customizations?: CartItemCustomizations;
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
  productType?: MenuGroup;
  comboItems?: ComboItem[];
  customizations?: CartItemCustomizations;
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
  pickupPerson?: PickupPerson;
  billingAddress?: Address;
  shippingAddress?: Address;
  deliveryDate?: string;
  deliveryTime?: string;
  orderMode?: 'asap' | 'scheduled';
  requestedFulfillmentAt?: string;
  orderType?: 'bakery' | 'food' | 'mixed';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  /** Online gateway transaction id (Dialog Genie). */
  paymentReference?: string;
  paidAt?: string;
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

export interface SocialPlatformSetting { enabled: boolean; url: string; }
export interface DeliveryAreaSetting { name: string; charge: number; postalCodes: string[]; }

export interface GeneralSettings {
  identity: {
    siteTitle: string; tagline: string; logoUrl: string; darkLogoUrl: string;
    mobileLogoUrl: string; faviconUrl: string; placeholderProductImageUrl: string; browserThemeColor: string;
  };
  business: {
    name: string; registrationNumber: string; address: string; primaryPhone: string;
    secondaryPhone: string; whatsappNumber: string; supportEmail: string;
    orderNotificationEmail: string; googleMapsUrl: string; openingHours: string;
  };
  header: {
    announcementText: string; announcementEnabled: boolean; logoSize: number; sticky: boolean;
    searchEnabled: boolean; wishlistEnabled: boolean; accountEnabled: boolean; cartEnabled: boolean;
  };
  footer: {
    description: string; logoUrl: string; copyrightText: string; showContactDetails: boolean;
    newsletterEnabled: boolean; paymentMethodLogos: string[]; quickLinks: Array<{ label: string; url: string }>;
    privacyPolicyUrl: string; termsUrl: string; refundPolicyUrl: string; deliveryPolicyUrl: string;
  };
  social: Record<'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'whatsapp' | 'linkedin', SocialPlatformSetting>;
  store: {
    currency: string; currencySymbol: string; symbolPosition: 'before' | 'after'; decimalPlaces: number;
    taxPercentage: number; pricesIncludeTax: boolean; minimumOrderAmount: number; maximumOrderAmount: number;
    guestCheckout: boolean; couponsEnabled: boolean; reviewsEnabled: boolean; wishlistEnabled: boolean;
    allowOutOfStockOrdering: boolean; lowStockThreshold: number; defaultProductSorting: string; productsPerPage: number;
    /** Main menu tabs shown on the storefront. A switched-off tab is hidden and its products cannot be ordered. */
    bakeryMenuEnabled: boolean; foodMenuEnabled: boolean; comboMenuEnabled: boolean;
  };
  delivery: {
    enabled: boolean; storePickupEnabled: boolean; defaultFee: number; freeDeliveryMinimum: number;
    areas: DeliveryAreaSetting[]; estimatedTime: string; instructions: string;
    maximumDistanceKm: number; postalCodeCheckEnabled: boolean;
  };
  foodOrdering: {
    enabled: boolean; allowAsap: boolean; allowScheduled: boolean;
    openingDays: number[]; openTime: string; closeTime: string; lastOrderTime: string;
    defaultPreparationMinutes: number; asapBufferMinutes: number; scheduledSlotMinutes: number;
    maximumOrdersPerSlot: number; temporarilyClosed: boolean; closedMessage: string;
  };
  orders: {
    numberPrefix: string; defaultStatus: OrderStatus; availableStatuses: OrderStatus[];
    automaticallyReduceStock: boolean; cancellationTimeLimitMinutes: number; customerNotesEnabled: boolean;
    adminNewOrderNotifications: boolean; customerConfirmationNotifications: boolean;
  };
  payments: {
    cashOnDeliveryEnabled: boolean; bankTransferEnabled: boolean; bankAccountInformation: string;
    payHereEnabled: boolean; payHereMerchantId: string; payHereEnvironment: 'sandbox' | 'live';
    dialogGenieEnabled: boolean; dialogGenieMerchantId: string; dialogGenieEnvironment: 'sandbox' | 'live';
    /** LKR per 1 unit of the store currency; Genie charges in rupees. Unused when the store currency is LKR. */
    dialogGenieExchangeRate: number;
    stripeEnabled: boolean; instructions: string;
  };
  contact: {
    pageHeading: string; pageDescription: string; formRecipientEmail: string;
    whatsappButtonEnabled: boolean; whatsappDefaultMessage: string; supportPhone: string;
    emailNotificationsEnabled: boolean; smsNotificationsEnabled: boolean;
  };
  seo: {
    defaultTitle: string; metaDescription: string; metaKeywords: string; openGraphImageUrl: string;
    canonicalUrl: string; googleAnalyticsId: string; googleTagManagerId: string;
    metaPixelId: string; searchEngineIndexing: boolean;
  };
  // The home page lists the bakery and food menu categories; combos are menu-tab only.
  homepage: {
    heroEnabled: boolean; categoryShowcaseEnabled: boolean;
    promotionalBannerEnabled: boolean; testimonialsEnabled: boolean; newsletterEnabled: boolean;
    /** Artwork for the three major-category cards. Empty falls back to a category or product photo. */
    bakeryCardImageUrl: string; foodCardImageUrl: string; comboCardImageUrl: string;
  };
  /** Storefront pages that can be switched off. Home is always on. */
  pages: {
    menuEnabled: boolean; promotionsEnabled: boolean; branchesEnabled: boolean; trackOrderEnabled: boolean;
    privacyPolicyEnabled: boolean; termsEnabled: boolean; refundPolicyEnabled: boolean;
  };
  /** The floating chat assistant, answered by Claude on the server. */
  assistant: { enabled: boolean; name: string; welcomeMessage: string };
  appearance: {
    primaryColor: string; secondaryColor: string; accentColor: string; buttonColor: string;
    headingFont: string; bodyFont: string; borderRadius: number; mode: 'light' | 'dark' | 'system'; customCss: string;
  };
  system: {
    maintenanceMode: boolean; maintenanceMessage: string; maintenanceImageUrl: string;
    allowAdminDuringMaintenance: boolean; timezone: string; dateFormat: string; timeFormat: string;
    defaultLanguage: string; lastUpdatedAt?: string; lastUpdatedBy?: string;
  };
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
