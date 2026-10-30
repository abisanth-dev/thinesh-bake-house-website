import React, { useState } from 'react';
import { ShoppingBag, Menu, X, User as UserIcon, Search, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { User } from '../types';
import { useSiteSettings } from './SiteSettingsContext';
import { isPageEnabled } from '../sitePages';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onCartClick: () => void;
  user: User | null;
  onOpenAuthModal: () => void;
  onOpenCustomerAccount: () => void;
  onOpenTrackingModal: () => void;
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
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const settings = useSiteSettings();

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'promotions', label: 'Promotions' },
    { id: 'branches', label: 'Our Branches' }
  ].filter(item => isPageEnabled(item.id, settings.pages));
  const trackOrderEnabled = settings.pages.trackOrderEnabled;

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`${settings.header.sticky ? 'sticky top-0' : 'relative'} z-40 w-full border-b border-gray-100 bg-white shadow-xs backdrop-blur-md bg-white/95`}>
      {settings.header.announcementEnabled && settings.header.announcementText && <div className="bg-brand-blue px-4 py-2 text-center text-xs font-bold tracking-wide text-white">{settings.header.announcementText}</div>}
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div onClick={() => setActiveTab('home')} className="cursor-pointer">
          <Logo className="h-auto" size={settings.header.logoSize} />
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
          {trackOrderEnabled && <button
            onClick={onOpenTrackingModal}
            className="relative py-2 text-[14px] font-medium text-gray-600 hover:text-brand-blue transition-colors cursor-pointer"
          >
            <span>Track Order</span>
          </button>}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {settings.header.searchEnabled && <form onSubmit={e => { e.preventDefault(); if (searchQuery.trim()) setActiveTab('menu'); }} className="hidden items-center rounded-xl border border-stone-200 bg-stone-50 px-2 lg:flex"><Search className="h-4 w-4 text-stone-400" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products" className="w-32 bg-transparent px-2 py-2 text-xs outline-none xl:w-44" /></form>}
          
          {/* Customer Account / Sign In */}
          {settings.header.accountEnabled && <button
            onClick={user ? onOpenCustomerAccount : onOpenAuthModal}
            className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/60 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all cursor-pointer"
          >
            <UserIcon className="w-3.5 h-3.5 text-brand-gold" />
            <span>{user ? user.name.split(' ')[0] : 'Sign In'}</span>
          </button>}

          {settings.header.wishlistEnabled && <button type="button" onClick={user ? onOpenCustomerAccount : onOpenAuthModal} aria-label="Open wishlist" className="rounded-full p-2.5 text-brand-gold transition hover:bg-amber-50"><Heart className="h-5 w-5" /></button>}

          {/* Cart Icon */}
          {settings.header.cartEnabled && <button
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
          </button>}

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

              {trackOrderEnabled && <button
                onClick={() => { onOpenTrackingModal(); setIsMobileMenuOpen(false); }}
                className="flex w-full items-center py-3 px-4 rounded-lg text-left text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-brand-blue transition-colors"
              >
                Track Order Status
              </button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
