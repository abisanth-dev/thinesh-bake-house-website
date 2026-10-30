import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import HeroCarousel from './components/HeroCarousel';
import Promotions from './components/Promotions';
import MenuSection from './components/MenuSection';
import BranchesSection from './components/BranchesSection';
import CustomerReviews from './components/CustomerReviews';
import FAQSection from './components/FAQSection';
import ChatAssistant from './components/ChatAssistant';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import OrderTrackingModal from './components/OrderTrackingModal';
import CustomerAccountModal from './components/CustomerAccountModal';
import AuthModal from './components/AuthModal';
import CategoryShowcase from './components/CategoryShowcase';
import HomeCategoryCarousel from './components/HomeCategoryCarousel';
import LegalPage, { LegalPageType } from './components/LegalPage';
import { SiteSettingsProvider } from './components/SiteSettingsContext';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from './siteSettings';

import { Product, CartItem, Category, User, Order, HeroSlide, Review, MenuGroup } from './types';
import { groupOf, isMenuGroupEnabled } from './menuGroups';
import { checkoutDisabledCategoryNames, isProductCheckoutDisabled } from './categoryCheckout';
import { isPageEnabled } from './sitePages';
import { hideBootLoader } from './bootLoader';
import { PRODUCTS } from './data';

export default function App() {
  const legalTabs: LegalPageType[] = ['privacy-policy', 'terms-and-conditions', 'refund-policy'];
  const tabPaths: Record<string, string> = {
    home: '/',
    menu: '/menu',
    promotions: '/promotions',
    branches: '/branches',
    'privacy-policy': '/privacy-policy',
    'terms-and-conditions': '/terms-and-conditions',
    'refund-policy': '/refund-policy',
  };
  const getTabFromPath = (path: string) => Object.entries(tabPaths).find(([, value]) => value === path)?.[0] || 'home';
  const [activeTab, setActiveTabState] = useState<string>(() => getTabFromPath(window.location.pathname));

  // Bumped on every page change to replay the progress bar at the top of the screen.
  const [pageLoadKey, setPageLoadKey] = useState(0);

  const setActiveTab = (tab: string) => {
    if (tab !== activeTab) {
      setPageLoadKey(key => key + 1);
      window.scrollTo({ top: 0 });
    }
    setActiveTabState(tab);
    const nextPath = tabPaths[tab] || '/';
    if (window.location.pathname !== nextPath) window.history.pushState({ tab }, '', nextPath);
  };
  const [menuCategory, setMenuCategory] = useState<string>('All');
  const [menuGroup, setMenuGroup] = useState<MenuGroup>('bakery');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Lightweight customer identity (email-based, no password) — separate from real admin auth at /admin
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Backend Dynamic Data States (all served from Supabase via the Express API)
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [backendCategories, setBackendCategories] = useState<Category[]>([]);
  const [sliders, setSliders] = useState<HeroSlide[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);

  // Modals visibility states
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [isCustomerAccountOpen, setIsCustomerAccountOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initial Load from Backend API. Resolves once the catalogue the first screen depends on has settled.
  const refreshBackendData = () => {
    const productsLoad = fetch('/api/products')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setBackendProducts(data); })
      .catch(err => console.warn('Could not load products API:', err));

    const categoriesLoad = fetch('/api/categories')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBackendCategories(data); })
      .catch(err => console.warn('Could not load categories API:', err));

    const slidersLoad = fetch('/api/sliders')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSliders(data); })
      .catch(err => console.warn('Could not load sliders API:', err));

    fetch('/api/reviews')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setReviews(data); })
      .catch(err => console.warn('Could not load reviews API:', err));

    if (currentUser?.email) {
      fetch(`/api/orders?email=${encodeURIComponent(currentUser.email)}`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setUserOrders(data); })
        .catch(err => console.warn('Could not load user orders API:', err));
    }

    return Promise.allSettled([productsLoad, categoriesLoad, slidersLoad]);
  };

  // The storefront is held back until settings and the catalogue arrive, so hidden sections, sample
  // products and placeholder slides never flash on screen before the real data replaces them.
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const initialCatalogLoad = useRef<Promise<unknown> | null>(null);

  useEffect(() => {
    const load = refreshBackendData();
    if (!initialCatalogLoad.current) initialCatalogLoad.current = load;
  }, [currentUser]);

  useEffect(() => {
    const settingsLoad = fetch('/api/public-settings').then(response => response.ok ? response.json() : Promise.reject(new Error('Settings request failed')))
      .then(data => setSiteSettings(mergeSiteSettings(data)))
      .catch(error => console.warn('Could not load public settings:', error));
    // A slow API should not leave visitors on a blank screen; after 8 seconds show the site anyway.
    const timeout = new Promise(resolve => setTimeout(resolve, 8000));
    Promise.race([Promise.allSettled([settingsLoad, initialCatalogLoad.current]), timeout]).then(() => setInitialLoadDone(true));
  }, []);

  useEffect(() => {
    if (initialLoadDone) hideBootLoader();
  }, [initialLoadDone]);

  // A page switched off in Admin > Settings > Pages opens the home page instead, including from a bookmarked URL.
  useEffect(() => {
    if (isPageEnabled(activeTab, siteSettings.pages)) return;
    setActiveTabState('home');
    window.history.replaceState({ tab: 'home' }, '', '/');
  }, [activeTab, siteSettings.pages]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand-blue', siteSettings.appearance.primaryColor);
    document.documentElement.style.setProperty('--color-brand-blue-light', siteSettings.appearance.secondaryColor);
    document.documentElement.style.setProperty('--color-brand-gold', siteSettings.appearance.accentColor);
    document.documentElement.style.setProperty('--site-radius', `${siteSettings.appearance.borderRadius}px`);
    document.documentElement.style.colorScheme = siteSettings.appearance.mode === 'system' ? 'light dark' : siteSettings.appearance.mode;
    document.body.style.fontFamily = `${siteSettings.appearance.bodyFont}, sans-serif`;
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]') || document.head.appendChild(document.createElement('meta'));
    theme.name = 'theme-color'; theme.content = siteSettings.identity.browserThemeColor;
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]') || document.head.appendChild(document.createElement('link'));
    favicon.rel = 'icon'; favicon.href = siteSettings.identity.faviconUrl;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]') || document.head.appendChild(document.createElement('meta'));
    description.name = 'description'; description.content = siteSettings.seo.metaDescription;
    const keywords = document.querySelector<HTMLMetaElement>('meta[name="keywords"]') || document.head.appendChild(document.createElement('meta'));
    keywords.name = 'keywords'; keywords.content = siteSettings.seo.metaKeywords;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]') || document.head.appendChild(document.createElement('link'));
    canonical.rel = 'canonical'; canonical.href = `${siteSettings.seo.canonicalUrl.replace(/\/$/, '')}${window.location.pathname}`;
    const setPropertyMeta = (property: string, content: string) => {
      const element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`) || document.head.appendChild(document.createElement('meta'));
      element.setAttribute('property', property); element.content = content;
    };
    setPropertyMeta('og:title', siteSettings.seo.defaultTitle);
    setPropertyMeta('og:description', siteSettings.seo.metaDescription);
    setPropertyMeta('og:image', siteSettings.seo.openGraphImageUrl);
    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]') || document.head.appendChild(document.createElement('meta'));
    robots.name = 'robots'; robots.content = siteSettings.seo.searchEngineIndexing ? 'index,follow' : 'noindex,nofollow';
    const customStyle = document.querySelector<HTMLStyleElement>('#admin-custom-site-css') || document.head.appendChild(document.createElement('style'));
    customStyle.id = 'admin-custom-site-css'; customStyle.textContent = siteSettings.appearance.customCss;
    const removeTracked = (name: string) => document.querySelectorAll(`[data-site-setting="${name}"]`).forEach(node => node.remove());
    removeTracked('analytics');
    if (/^G-[A-Z0-9]+$/i.test(siteSettings.seo.googleAnalyticsId)) {
      const external = document.createElement('script'); external.async = true; external.src = `https://www.googletagmanager.com/gtag/js?id=${siteSettings.seo.googleAnalyticsId}`; external.dataset.siteSetting = 'analytics'; document.head.appendChild(external);
      const config = document.createElement('script'); config.dataset.siteSetting = 'analytics'; config.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${siteSettings.seo.googleAnalyticsId}');`; document.head.appendChild(config);
    }
    if (/^GTM-[A-Z0-9]+$/i.test(siteSettings.seo.googleTagManagerId)) {
      const gtm = document.createElement('script'); gtm.dataset.siteSetting = 'analytics'; gtm.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${siteSettings.seo.googleTagManagerId}');`; document.head.appendChild(gtm);
    }
    if (/^\d{5,20}$/.test(siteSettings.seo.metaPixelId)) {
      const pixel = document.createElement('script'); pixel.dataset.siteSetting = 'analytics'; pixel.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${siteSettings.seo.metaPixelId}');fbq('track','PageView');`; document.head.appendChild(pixel);
    }
  }, [siteSettings]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromPath(window.location.pathname));
      setPageLoadKey(key => key + 1);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const pageNames: Record<string, string> = {
      home: siteSettings.seo.defaultTitle,
      menu: 'Our Menu | Thinesh Bake House',
      promotions: 'Promotions | Thinesh Bake House',
      branches: 'Our Branches | Thinesh Bake House',
      'privacy-policy': 'Privacy Policy | Thinesh Bake House',
      'terms-and-conditions': 'Terms & Conditions | Thinesh Bake House',
      'refund-policy': 'Refund Policy | Thinesh Bake House',
    };
    document.title = pageNames[activeTab] || pageNames.home;
  }, [activeTab, siteSettings.seo.defaultTitle]);

  useEffect(() => {
    if (!selectedProduct) return;
    document.title = selectedProduct.seo?.metaTitle || `${selectedProduct.name} | ${siteSettings.identity.siteTitle}`;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = selectedProduct.seo?.metaDescription || selectedProduct.shortDescription || selectedProduct.description || siteSettings.seo.metaDescription;
    const image = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    if (image) image.content = selectedProduct.seo?.ogImage || selectedProduct.image || siteSettings.seo.openGraphImageUrl;
    return () => {
      document.title = siteSettings.seo.defaultTitle;
      if (description) description.content = siteSettings.seo.metaDescription;
      if (image) image.content = siteSettings.seo.openGraphImageUrl;
    };
  }, [selectedProduct, siteSettings]);

  const productSource = backendProducts.length > 0 ? backendProducts : PRODUCTS;
  const checkoutDisabledNames = checkoutDisabledCategoryNames(backendCategories);
  const activeProducts = productSource.map(product => ({
    ...product,
    image: product.image || siteSettings.identity.placeholderProductImageUrl,
    checkoutDisabled: isProductCheckoutDisabled(product, checkoutDisabledNames) || !isMenuGroupEnabled(groupOf(product), siteSettings.store),
  }));
  const wishlistProducts = activeProducts.filter(p => wishlistProductIds.includes(p.id));
  // Categories an admin has featured on the home page, in the order they were switched on, each with
  // its products. Categories in a hidden menu tab or without products are left out.
  const homeCarousels = backendCategories
    .filter(category => category.homeFeaturedOrder != null && isMenuGroupEnabled(category.menuGroup || 'bakery', siteSettings.store))
    .sort((a, b) => (a.homeFeaturedOrder ?? 0) - (b.homeFeaturedOrder ?? 0))
    .map(category => ({
      category,
      products: activeProducts.filter(product => (product.category || '').trim().toLowerCase() === category.name.trim().toLowerCase()),
    }))
    .filter(carousel => carousel.products.length > 0);

  // Load cart & wishlist from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('tbh_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart from storage', e);
      }
    }
    const savedWishlist = localStorage.getItem('tbh_wishlist');
    if (savedWishlist) {
      try {
        setWishlistProductIds(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Error parsing wishlist from storage', e);
      }
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('tbh_cart', JSON.stringify(items));
  };

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Products in a category with checkout switched off cannot be opened or added to the cart.
  const handleOpenProduct = (product: Product) => {
    if (product.checkoutDisabled) return;
    setSelectedProduct(product);
  };

  const handleAddToCart = (newItem: Omit<CartItem, 'id'>) => {
    if (newItem.product.checkoutDisabled) {
      triggerToast(`${newItem.product.name} is not available to order right now.`, 'info');
      return;
    }
    const customKey = newItem.customizations
      ? `${newItem.product.id}-${newItem.customizations.variantId || ''}-${newItem.customizations.cakeType || ''}-${newItem.customizations.weight || ''}-${newItem.customizations.message || ''}`
      : newItem.product.id;

    const existingIndex = cartItems.findIndex((item) => item.id === customKey);

    let updatedCart: CartItem[];
    if (existingIndex > -1) {
      updatedCart = [...cartItems];
      updatedCart[existingIndex].quantity += newItem.quantity;
    } else {
      updatedCart = [...cartItems, { ...newItem, id: customKey }];
    }

    saveCart(updatedCart);
    triggerToast(`Added ${newItem.product.name} to your basket!`);
  };

  const handleAddToCartDirectly = (product: Product) => {
    if (product.checkoutDisabled) {
      triggerToast(`${product.name} is not available to order right now.`, 'info');
      return;
    }
    if (product.productType === 'food' || product.variants?.length || product.isCustomizable) {
      setSelectedProduct(product);
      return;
    }
    handleAddToCart({
      product,
      quantity: 1,
      selectedPrice: product.priceMin
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    saveCart(updated);
  };

  const handleRemoveItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    saveCart(updated);
    triggerToast('Item removed from your basket', 'info');
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  // Back from Dialog Genie's payment page: /?payment=paid|failed|pending&order=TBH-1234
  useEffect(() => {
    if (!initialLoadDone) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (!payment) return;
    const orderNumber = params.get('order') || '';
    window.history.replaceState(window.history.state, '', window.location.pathname);
    if (payment === 'paid') {
      saveCart([]);
      triggerToast('Payment received - thank you! Your order is confirmed.');
      if (orderNumber) handleOpenTrackingForOrder(orderNumber);
    } else if (payment === 'pending') {
      triggerToast('Waiting for Dialog Genie to confirm your payment. Check your order status shortly.', 'info');
      if (orderNumber) handleOpenTrackingForOrder(orderNumber);
    } else {
      triggerToast('Payment was not completed. Your cart is still here - try again or choose another payment method.', 'info');
    }
  }, [initialLoadDone]);

  const handleToggleWishlist = (productId: string) => {
    const updated = wishlistProductIds.includes(productId)
      ? wishlistProductIds.filter(id => id !== productId)
      : [...wishlistProductIds, productId];
    setWishlistProductIds(updated);
    localStorage.setItem('tbh_wishlist', JSON.stringify(updated));
    triggerToast(wishlistProductIds.includes(productId) ? 'Removed from saved wishlist' : 'Saved item to your wishlist!', wishlistProductIds.includes(productId) ? 'info' : 'success');
  };

  const handleAddReview = (newRev: Omit<Review, 'id' | 'date' | 'status'>) => {
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRev)
    })
      .then(r => r.json())
      .then(() => {
        triggerToast('Review submitted for moderation!');
        refreshBackendData();
      });
  };

  const handleOpenTrackingForOrder = (orderNum: string) => {
    setTrackingOrderNumber(orderNum);
    setIsTrackingModalOpen(true);
  };

  // Home page major-category cards open the menu on that group with no sub-category pre-selected.
  const handleGroupClick = (group: MenuGroup) => {
    setMenuGroup(group);
    setMenuCategory('All');
    setActiveTab('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // "View all" on a home carousel opens the menu filtered to that category.
  const handleCategoryViewAll = (category: Category) => {
    setMenuGroup(category.menuGroup || 'bakery');
    setMenuCategory(category.name);
    setActiveTab('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // The branded loading screen from index.html stays on top until this flips.
  if (!initialLoadDone) return <div className="min-h-screen bg-stone-50" />;

  if (siteSettings.system.maintenanceMode) {
    return <SiteSettingsProvider value={siteSettings}><main className="flex min-h-screen items-center justify-center bg-[#070d32] px-5 text-center text-white"><div className="max-w-xl">{siteSettings.system.maintenanceImageUrl && <img src={siteSettings.system.maintenanceImageUrl} alt="Maintenance" className="mx-auto mb-8 max-h-56 rounded-3xl object-contain" />}<h1 className="text-4xl font-black">{siteSettings.identity.siteTitle}</h1><p className="mt-5 text-lg leading-8 text-blue-100/70">{siteSettings.system.maintenanceMessage}</p><a href="mailto:info@tbh.lk" className="mt-8 inline-block rounded-xl bg-brand-gold px-6 py-3 font-extrabold text-stone-950">Contact support</a></div></main></SiteSettingsProvider>;
  }

  return (
    <SiteSettingsProvider value={siteSettings}>
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-brand-gold selection:text-white">
      {/* Toast Notification Popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 right-4 z-50 flex items-center gap-3 bg-brand-blue text-white px-5 py-3.5 rounded-xl shadow-2xl border border-brand-gold/30 text-sm font-semibold max-w-sm"
          >
            <div className="p-1 bg-brand-gold rounded-full text-white">
              <Check className="h-4 w-4" />
            </div>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Nav */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        user={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenCustomerAccount={() => setIsCustomerAccountOpen(true)}
        onOpenTrackingModal={() => handleOpenTrackingForOrder('')}
      />

      {pageLoadKey > 0 && <div key={pageLoadKey} className="tbh-page-progress" aria-hidden="true" />}

      {/* Content Rendering by Active Tab - re-keyed per page so each page fades in */}
      <main key={activeTab} className="flex-1" style={{ animation: 'tbh-fade-in 0.35s ease-out' }}>
        {activeTab === 'home' && (
          <>
            {siteSettings.homepage.heroEnabled && <HeroCarousel onActionClick={setActiveTab} slides={sliders} />}

            {siteSettings.homepage.categoryShowcaseEnabled && <CategoryShowcase
              categories={backendCategories}
              products={activeProducts}
              onGroupClick={handleGroupClick}
            />}

            {siteSettings.homepage.promotionalBannerEnabled && <Promotions
              onProductClick={handleOpenProduct}
              eggPuffProduct={activeProducts.find(p => p.tags?.some(t => t.toLowerCase().includes('spicy')) || p.name.toLowerCase().includes('puff'))}
              showCoupons={false}
            />}

            {/* One carousel per category featured in Admin > Category Tree */}
            {homeCarousels.map(({ category, products }, index) => (
              <div key={category.id}>
                <HomeCategoryCarousel
                  category={category}
                  products={products}
                  shaded={index % 2 === 1}
                  onProductClick={handleOpenProduct}
                  onAddToCartDirectly={handleAddToCartDirectly}
                  onViewAll={handleCategoryViewAll}
                />
              </div>
            ))}

            {siteSettings.homepage.testimonialsEnabled && <CustomerReviews />}
            {siteSettings.homepage.newsletterEnabled && <section className="bg-stone-100 px-4 py-14"><div className="mx-auto max-w-3xl rounded-3xl bg-brand-blue p-8 text-center text-white shadow-xl"><h2 className="text-2xl font-black">Fresh news from the bakery</h2><p className="mt-2 text-sm text-blue-100/70">Receive occasional product launches and promotion updates.</p><form onSubmit={event => event.preventDefault()} className="mx-auto mt-6 flex max-w-md gap-2"><input type="email" required placeholder="Email address" aria-label="Newsletter email" className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-sm text-stone-900 outline-none" /><button className="rounded-xl bg-brand-gold px-5 py-3 text-sm font-extrabold text-stone-950">Subscribe</button></form></div></section>}
            <FAQSection />
          </>
        )}

        {activeTab === 'menu' && (
          <div className="pt-8">
            <MenuSection
              products={activeProducts}
              categories={backendCategories}
              initialCategory={menuCategory}
              initialGroup={menuGroup}
              onProductClick={handleOpenProduct}
              onAddToCartDirectly={handleAddToCartDirectly}
            />
          </div>
        )}

        {activeTab === 'promotions' && (
          <div className="py-12">
            <Promotions
              onProductClick={handleOpenProduct}
              eggPuffProduct={activeProducts.find(p => p.tags?.some(t => t.toLowerCase().includes('spicy')) || p.name.toLowerCase().includes('puff'))}
            />
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="py-12">
            <BranchesSection />
          </div>
        )}

        {legalTabs.includes(activeTab as LegalPageType) && (
          <LegalPage type={activeTab as LegalPageType} onBack={() => setActiveTab('home')} />
        )}
      </main>

      {/* Chat assistant (Claude) - switch on/off in Admin > Settings > Chat assistant */}
      <ChatAssistant products={activeProducts} onProductClick={handleOpenProduct} />
      {siteSettings.contact.whatsappButtonEnabled && siteSettings.business.whatsappNumber && <a href={`https://wa.me/${siteSettings.business.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(siteSettings.contact.whatsappDefaultMessage)}`} target="_blank" rel="noreferrer" aria-label="Contact us on WhatsApp" className="fixed bottom-24 right-5 z-30 rounded-full bg-emerald-500 px-5 py-3 text-sm font-extrabold text-white shadow-xl transition hover:-translate-y-1">WhatsApp</a>}

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* --- ALL OVERLAY MODALS --- */}

      {/* 1. Product Detail & Reviews Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 2. Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        products={activeProducts}
        onAddSuggestedProduct={handleAddToCartDirectly}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderPlaced={() => {
          refreshBackendData();
          triggerToast('Order placed successfully! We sent an SMS alert.');
        }}
      />

      {/* 3. Public Visual Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        initialOrderNumber={trackingOrderNumber}
      />

      {/* 4. Customer Account & Wishlist Modal */}
      <CustomerAccountModal
        isOpen={isCustomerAccountOpen}
        onClose={() => setIsCustomerAccountOpen(false)}
        user={currentUser}
        onLogout={() => setCurrentUser(null)}
        orders={userOrders}
        wishlistProducts={wishlistProducts}
        onRemoveFromWishlist={(id) => handleToggleWishlist(id)}
        onAddToCartDirectly={handleAddToCartDirectly}
        onTrackOrderClick={(ordNum) => handleOpenTrackingForOrder(ordNum)}
      />

      {/* 5. Customer Auth Modal (email-based, no password — real admin login lives at /admin) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          triggerToast(`Welcome back, ${u.name}!`);
        }}
      />
    </div>
    </SiteSettingsProvider>
  );
}
