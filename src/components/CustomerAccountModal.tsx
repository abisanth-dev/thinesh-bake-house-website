import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon, MapPin, Heart, ShoppingBag, LogOut, Check, ExternalLink } from 'lucide-react';
import { User, Order, Product } from '../types';
import { useSiteSettings } from './SiteSettingsContext';
import { formatMoney } from '../siteSettings';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  orders: Order[];
  wishlistProducts: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCartDirectly: (product: Product) => void;
  onTrackOrderClick: (orderNumber: string) => void;
}

export default function CustomerAccountModal({
  isOpen,
  onClose,
  user,
  onLogout,
  orders,
  wishlistProducts,
  onRemoveFromWishlist,
  onAddToCartDirectly,
  onTrackOrderClick
}: CustomerAccountModalProps) {
  const settings = useSiteSettings();
  const money = (value: number) => formatMoney(value, settings);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist'>('orders');

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="bg-stone-900 px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center font-bold text-white shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold font-display">{user.name}</h3>
                <span className="text-xs text-amber-200 uppercase tracking-widest font-mono">
                  {user.role === 'administrator' ? 'Administrator' : 'Customer Account'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 px-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-brand-gold text-brand-blue font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> My Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`py-3.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'border-brand-gold text-brand-blue font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Heart className="w-4 h-4" /> Saved Wishlist ({wishlistProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-brand-gold text-brand-blue font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <UserIcon className="w-4 h-4" /> Profile & Address
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="font-semibold text-gray-700">No orders placed yet.</p>
                    <p className="text-xs text-gray-400">Explore our delicious oven menu and order your favourite treats!</p>
                  </div>
                ) : (
                  orders.map((ord) => (
                    <div key={ord.id} className="border border-gray-100 rounded-xl p-4 hover:border-amber-200 transition-all bg-gray-50/50">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                        <div>
                          <span className="font-mono font-bold text-brand-blue text-base">{ord.orderNumber}</span>
                          <span className="text-xs text-gray-400 block font-mono">
                            {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                            {ord.status.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => onTrackOrderClick(ord.orderNumber)}
                            className="bg-brand-gold text-white text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 hover:bg-brand-gold-dark transition-all"
                          >
                            <ExternalLink className="w-3 h-3" /> Track Status
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div className="flex-1 text-xs">
                              <span className="font-semibold text-gray-800">{item.name}</span>
                              <span className="text-gray-400 block">Qty: {item.quantity} × {money(item.price)}</span>
                            </div>
                            <span className="font-bold text-xs font-mono">{money(item.quantity * item.price)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-700">
                        <span>Pickup: {ord.pickupBranch}</span>
                        <span className="text-sm font-bold font-mono text-brand-blue">Total: {money(ord.total)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlistProducts.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-gray-500 space-y-3">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="font-semibold text-gray-700">Your wishlist is empty.</p>
                    <p className="text-xs text-gray-400">Click the heart icon on any product to save it here!</p>
                  </div>
                ) : (
                  wishlistProducts.map((p) => (
                    <div key={p.id} className="border border-gray-100 rounded-xl p-3 flex gap-3 items-center bg-white shadow-xs">
                      <img src={p.image} alt={p.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{p.name}</h4>
                        {p.checkoutDisabled
                          ? <span className="text-xs font-semibold italic text-amber-700 block">Price updating soon</span>
                          : <span className="font-bold font-mono text-brand-blue text-xs block">{money(p.priceMin)}</span>}
                        <button
                          onClick={() => onAddToCartDirectly(p)}
                          className="mt-1.5 text-xs bg-brand-gold text-white px-2.5 py-1 rounded-md font-semibold hover:bg-brand-gold-dark transition-all"
                        >
                          + Add to Basket
                        </button>
                      </div>
                      <button
                        onClick={() => onRemoveFromWishlist(p.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Remove from wishlist"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-brand-gold" /> Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">Full Name</span>
                      <span className="font-semibold text-gray-800">{user.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Email Address</span>
                      <span className="font-semibold text-gray-800">{user.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Phone Number</span>
                      <span className="font-semibold text-gray-800">{user.phone || '+94 77 123 4567'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Role</span>
                      <span className="font-semibold text-brand-blue uppercase">{user.role}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-gold" /> Preferred Shipping / Billing Address
                  </h4>
                  <div className="text-xs space-y-1 text-gray-700 font-medium">
                    <p>{user.shippingAddress?.fullName || user.name}</p>
                    <p>{user.shippingAddress?.street || '45 Ramakrishna Road, Wellawatte'}</p>
                    <p>{user.shippingAddress?.city || 'Colombo 06'}, Sri Lanka</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
