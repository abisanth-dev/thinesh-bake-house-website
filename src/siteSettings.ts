import { GeneralSettings } from './types';

export const DEFAULT_LOGO_URL = 'https://tbh.lk/wp-content/uploads/2026/02/TBH-Logo-1024x1024-1.png';

export const DEFAULT_SITE_SETTINGS: GeneralSettings = {
  identity: {
    siteTitle: 'Thinesh Bake House', tagline: 'Your Favourite Baker Since 1982', logoUrl: DEFAULT_LOGO_URL,
    darkLogoUrl: DEFAULT_LOGO_URL, mobileLogoUrl: DEFAULT_LOGO_URL, faviconUrl: DEFAULT_LOGO_URL,
    placeholderProductImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
    browserThemeColor: '#0B1354',
  },
  business: {
    name: 'Thinesh Bake House', registrationNumber: '', address: '180, Jaffna Road, Manipay, Jaffna',
    primaryPhone: '077 725 9245', secondaryPhone: '', whatsappNumber: '94777259245',
    supportEmail: 'info@tbh.lk', orderNotificationEmail: 'admin@tbh.lk', googleMapsUrl: '',
    openingHours: 'Daily · 7:00 AM–9:30 PM',
  },
  header: {
    announcementText: 'Freshly baked every day', announcementEnabled: false, logoSize: 56, sticky: true,
    searchEnabled: false, wishlistEnabled: false, accountEnabled: true, cartEnabled: true,
  },
  footer: {
    description: 'Baking joy for generations with time-honoured recipes, quality ingredients and the warm flavours our communities love.',
    logoUrl: DEFAULT_LOGO_URL, copyrightText: '© {year} Thinesh Bake House. All rights reserved.',
    showContactDetails: true, newsletterEnabled: false, paymentMethodLogos: [],
    quickLinks: [{ label: 'Home', url: '/' }, { label: 'Our Menu', url: '/menu' }, { label: 'Promotions', url: '/promotions' }],
    privacyPolicyUrl: '/privacy-policy', termsUrl: '/terms-and-conditions', refundPolicyUrl: '/refund-policy', deliveryPolicyUrl: '',
  },
  social: {
    facebook: { enabled: false, url: '' }, instagram: { enabled: false, url: '' },
    tiktok: { enabled: false, url: '' }, youtube: { enabled: false, url: '' },
    whatsapp: { enabled: false, url: '' }, linkedin: { enabled: false, url: '' },
  },
  store: {
    currency: 'LKR', currencySymbol: 'Rs.', symbolPosition: 'before', decimalPlaces: 2,
    taxPercentage: 0, pricesIncludeTax: false, minimumOrderAmount: 0, maximumOrderAmount: 0,
    guestCheckout: true, couponsEnabled: true, reviewsEnabled: true, wishlistEnabled: false,
    allowOutOfStockOrdering: false, lowStockThreshold: 5, defaultProductSorting: 'menu_order', productsPerPage: 12,
    bakeryMenuEnabled: true, foodMenuEnabled: true, comboMenuEnabled: true,
  },
  delivery: {
    enabled: false, storePickupEnabled: true, defaultFee: 0, freeDeliveryMinimum: 0, areas: [],
    estimatedTime: '45–90 minutes', instructions: '', maximumDistanceKm: 0, postalCodeCheckEnabled: false,
  },
  foodOrdering: {
    enabled: true, allowAsap: true, allowScheduled: true,
    openingDays: [0, 1, 2, 3, 4, 5, 6], openTime: '11:00', closeTime: '22:00', lastOrderTime: '21:30',
    defaultPreparationMinutes: 30, asapBufferMinutes: 30, scheduledSlotMinutes: 15,
    maximumOrdersPerSlot: 0, temporarilyClosed: false,
    closedMessage: 'Our kitchen is currently closed. Please schedule your food order for the next available time.',
  },
  orders: {
    numberPrefix: 'TBH-', defaultStatus: 'pending_payment',
    availableStatuses: ['pending_payment', 'processing', 'on_hold', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled', 'refunded', 'failed'],
    automaticallyReduceStock: true, cancellationTimeLimitMinutes: 15, customerNotesEnabled: true,
    adminNewOrderNotifications: true, customerConfirmationNotifications: true,
  },
  payments: {
    cashOnDeliveryEnabled: true, bankTransferEnabled: true, bankAccountInformation: '',
    payHereEnabled: false, payHereMerchantId: '', payHereEnvironment: 'sandbox',
    dialogGenieEnabled: false, dialogGenieMerchantId: '', dialogGenieEnvironment: 'sandbox', dialogGenieExchangeRate: 0,
    stripeEnabled: false, instructions: 'Payment availability is confirmed during checkout.',
  },
  contact: {
    pageHeading: 'Contact Thinesh Bake House', pageDescription: 'We are here to help with products, custom cakes and orders.',
    formRecipientEmail: 'info@tbh.lk', whatsappButtonEnabled: false,
    whatsappDefaultMessage: 'Hello Thinesh Bake House, I would like help with an order.', supportPhone: '077 725 9245',
    emailNotificationsEnabled: true, smsNotificationsEnabled: true,
  },
  seo: {
    defaultTitle: 'Thinesh Bake House - Your Favourite Baker Since 1982',
    metaDescription: 'Order freshly baked cakes, pastries, savouries and bakery favourites from Thinesh Bake House.',
    metaKeywords: 'bakery, cakes, pastries, Jaffna, Manipay, Thinesh Bake House', openGraphImageUrl: DEFAULT_LOGO_URL,
    canonicalUrl: 'https://tbh.lk', googleAnalyticsId: '', googleTagManagerId: '', metaPixelId: '', searchEngineIndexing: true,
  },
  homepage: {
    heroEnabled: true, categoryShowcaseEnabled: true,
    promotionalBannerEnabled: true, testimonialsEnabled: true, newsletterEnabled: false,
    bakeryCardImageUrl: '', foodCardImageUrl: '', comboCardImageUrl: '',
  },
  pages: {
    menuEnabled: true, promotionsEnabled: true, branchesEnabled: true, trackOrderEnabled: true,
    privacyPolicyEnabled: true, termsEnabled: true, refundPolicyEnabled: true,
  },
  assistant: {
    enabled: true, name: 'Baker Buddy',
    welcomeMessage: "Hi! I'm Baker Buddy from Thinesh Bake House. Ask me about our cakes, savouries, branches, opening hours or how to order.",
  },
  appearance: {
    primaryColor: '#0B1354', secondaryColor: '#1A278A', accentColor: '#E5A823', buttonColor: '#0B1354',
    headingFont: 'Outfit', bodyFont: 'Inter', borderRadius: 12, mode: 'light', customCss: '',
  },
  system: {
    maintenanceMode: false, maintenanceMessage: 'We are making something fresh. Please check back soon.',
    maintenanceImageUrl: '', allowAdminDuringMaintenance: true, timezone: 'Asia/Colombo',
    dateFormat: 'DD/MM/YYYY', timeFormat: '12-hour', defaultLanguage: 'en', lastUpdatedAt: '', lastUpdatedBy: '',
  },
};

export function mergeSiteSettings(input?: Partial<GeneralSettings> | null): GeneralSettings {
  const mergeKnown = (defaults: any, source: any): any => {
    if (Array.isArray(defaults)) return Array.isArray(source) ? structuredClone(source) : structuredClone(defaults);
    if (defaults && typeof defaults === 'object') {
      return Object.fromEntries(Object.keys(defaults).map(key => [key, mergeKnown(defaults[key], source?.[key])]));
    }
    return source === undefined || source === null ? defaults : source;
  };
  return mergeKnown(DEFAULT_SITE_SETTINGS, input || {}) as GeneralSettings;
}

export function formatMoney(value: number, settings: GeneralSettings): string {
  const amount = Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: settings.store.decimalPlaces,
    maximumFractionDigits: settings.store.decimalPlaces,
  });
  return settings.store.symbolPosition === 'after'
    ? `${amount} ${settings.store.currencySymbol}`
    : `${settings.store.currencySymbol} ${amount}`;
}
