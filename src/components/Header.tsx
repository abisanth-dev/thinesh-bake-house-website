import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Phone, User as UserIcon, Shield, PackageSearch, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { User } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onCartClick: () => void;
  user: User | null;
  onOpenAuthModal: () => void;
  onOpenCustomerAccount: () => void;
  onOpenTrackingModal: () => void;
  wishlistCount: number;
}

export default function Header({
  activeTab,
  setActiveTab,
  cartCount,
  onCartClick,
  user,
  onOpenAuthModal,
  onOpenCustomerAccount,
  onOpenTrackingModal,
  wishlistCount,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'promotions', label: 'Promotions' },
    { id: 'branches', label: 'Our Branches' }
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white shadow-xs backdrop-blur-md bg-white/95">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div onClick={() => setActiveTab('home')} className="cursor-pointer">
          <Logo />
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`relative py-2 text-[14px] font-medium transition-colors cursor-pointer ${
                activeTab === item.id ? 'text-brand-blue font-bold' : 'text-gray-600 hover:text-brand-blue'
              }`}
            >
              {item.label}
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-gold rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}

          {/* Track Order Direct Navigation Link */}
          <button
            onClick={onOpenTrackingModal}
            className="flex items-center gap-1.5 py-2 text-[14px] font-semibold text-amber-700 hover:text-brand-gold transition-colors cursor-pointer"
          >
            <PackageSearch className="w-4 h-4 text-brand-gold" />
            <span>Track Order</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Customer Account / Sign In */}
          <button
            onClick={user ? onOpenCustomerAccount : onOpenAuthModal}
            className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/60 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5 text-brand-gold" />
            <span>{user ? user.name.split(' ')[0] : 'Sign In'}</span>
          </button>

          {/* Admin Panel Link (full page, real Supabase Auth login) */}
          <a
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 bg-stone-900 text-amber-300 border border-stone-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-stone-800 transition-all cursor-pointer"
            title="Admin Login"
          >
            <Shield className="w-3.5 h-3.5 text-brand-gold" />
            <span>Admin</span>
          </a>

          {/* Saved Wishlist Button */}
          {user && (
            <button
              onClick={onOpenCustomerAccount}
              className="relative p-2 rounded-full hover:bg-rose-50 transition-colors cursor-pointer text-rose-500"
              title="View Wishlist"
            >
              <Heart className="h-5.5 w-5.5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Cart Icon */}
          <button
            onClick={onCartClick}
            className="relative p-2.5 rounded-full hover:bg-gray-50 transition-colors group cursor-pointer"
            id="header-cart-btn"
            aria-label="Open Cart"
          >
            <ShoppingBag className="h-6 w-6 text-brand-gold group-hover:scale-105 transition-transform" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-[10px] font-bold text-white shadow-xs"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-brand-blue transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="lg:hidden border-t border-gray-100 bg-white"
          >
            <div className="space-y-1 px-4 pt-3 pb-6 shadow-lg">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex w-full items-center py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-brand-blue/5 text-brand-blue font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand-blue'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => { onOpenTrackingModal(); setIsMobileMenuOpen(false); }}
                className="flex w-full items-center py-3 px-4 rounded-lg text-base font-semibold text-amber-800 bg-amber-50"
              >
                <PackageSearch className="w-5 h-5 text-brand-gold mr-2" />
                Track Order Status
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
