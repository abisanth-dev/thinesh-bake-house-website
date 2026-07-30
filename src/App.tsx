import React, { useState, useEffect } from 'react';
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
import AIChatBot from './components/AIChatBot';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import OrderTrackingModal from './components/OrderTrackingModal';
import CustomerAccountModal from './components/CustomerAccountModal';
import AuthModal from './components/AuthModal';

import { Product, CartItem, User, Order, HeroSlide, Review } from './types';
import { PRODUCTS } from './data';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Lightweight customer identity (email-based, no password) — separate from real admin auth at /admin
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Backend Dynamic Data States (all served from Supabase via the Express API)
  const [backendProducts, setBackendProducts] = useState<Product[]>([]);
  const [backendCategories, setBackendCategories] = useState<any[]>([]);
  const [sliders, setSliders] = useState<HeroSlide[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Modals visibility states
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [isCustomerAccountOpen, setIsCustomerAccountOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initial Load from Backend API
  const refreshBackendData = () => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setBackendProducts(data); })
      .catch(err => console.warn('Could not load products API:', err));

    fetch('/api/categories')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBackendCategories(data); })
      .catch(err => console.warn('Could not load categories API:', err));

    fetch('/api/sliders')
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
  };

  useEffect(() => {
    refreshBackendData();
  }, [currentUser]);

  const activeProducts = backendProducts.length > 0 ? backendProducts : PRODUCTS;
  const wishlistProducts = activeProducts.filter(p => wishlistProductIds.includes(p.id));

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

  const handleAddToCart = (newItem: Omit<CartItem, 'id'>) => {
    const customKey = newItem.customizations
      ? `${newItem.product.id}-${newItem.customizations.cakeType || ''}-${newItem.customizations.weight || ''}-${newItem.customizations.message || ''}`
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

  return (
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
        wishlistCount={wishlistProductIds.length}
      />

      {/* Content Rendering by Active Tab */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <HeroCarousel onActionClick={setActiveTab} slides={sliders} />

            <Promotions
              onProductClick={(product) => setSelectedProduct(product)}
              eggPuffProduct={activeProducts.find(p => p.tags?.some(t => t.toLowerCase().includes('spicy')) || p.name.toLowerCase().includes('puff'))}
            />

            <MenuSection
              products={activeProducts}
              onProductClick={(product) => setSelectedProduct(product)}
              onAddToCartDirectly={handleAddToCartDirectly}
            />

            <BranchesSection />
            <CustomerReviews />
            <FAQSection />
          </>
        )}

        {activeTab === 'menu' && (
          <div className="pt-8">
            <MenuSection
              products={activeProducts}
              onProductClick={(product) => setSelectedProduct(product)}
              onAddToCartDirectly={handleAddToCartDirectly}
            />
          </div>
        )}

        {activeTab === 'promotions' && (
          <div className="py-12">
            <Promotions
              onProductClick={(product) => setSelectedProduct(product)}
              eggPuffProduct={activeProducts.find(p => p.tags?.some(t => t.toLowerCase().includes('spicy')) || p.name.toLowerCase().includes('puff'))}
            />
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="py-12">
            <BranchesSection />
          </div>
        )}
      </main>

      {/* AI Chatbot Assistant */}
      <AIChatBot products={activeProducts} onProductClick={(product) => setSelectedProduct(product)} />

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
  );
}
