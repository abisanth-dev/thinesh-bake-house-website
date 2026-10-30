import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, ArrowLeft, ArrowRight } from 'lucide-react';
import { Category, MenuGroup, Product } from '../types';
import { PRODUCTS } from '../data';
import { useSiteSettings } from './SiteSettingsContext';
import { MENU_GROUPS, enabledMenuGroups, groupOf } from '../menuGroups';
import ComboCard from './ComboCard';
import ProductCard from './ProductCard';

interface MenuSectionProps {
  onProductClick: (product: Product) => void;
  onAddToCartDirectly: (product: Product) => void;
  products?: Product[];
  categories?: Category[];
  isLiveSyncActive?: boolean;
  onOpenWooCommerceModal?: () => void;
  initialCategory?: string;
  initialGroup?: MenuGroup;
}

const DEFAULT_CATEGORIES = ['Cakes', 'Buns', 'Doughnuts', 'Piece Cake', 'Savories', 'Sweets'];

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-150/80 p-5 shadow-xs flex flex-col justify-between h-full animate-pulse">
      {/* Card Thumbnail Container Placeholder */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100 mb-4 flex items-center justify-center">
        {/* Floating Heart Button placeholder */}
        <div className="absolute top-2.5 right-2.5 h-8.5 w-8.5 rounded-full bg-gray-200/80" />
        {/* Category label placeholder */}
        <div className="absolute bottom-2.5 left-2.5 w-16 h-4 bg-gray-200/80 rounded-sm" />
      </div>

      {/* Product Details Section Placeholder */}
      <div className="flex flex-col items-center text-center flex-grow space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4 mt-1" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        
        {/* Optional small description placeholders */}
        <div className="w-full flex flex-col items-center space-y-1.5 pt-2">
          <div className="h-3 bg-gray-100 rounded w-5/6" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
        
        {/* Price placeholder */}
        <div className="h-4 bg-gray-250 rounded w-1/3 mt-auto pt-2" />
      </div>

      {/* Add To Cart button placeholder */}
      <div className="mt-4 w-full h-10 bg-gray-200 rounded-lg" />
    </div>
  );
}

export default function MenuSection({
  onProductClick,
  onAddToCartDirectly,
  products: propProducts,
  categories: propCategories,
  isLiveSyncActive,
  onOpenWooCommerceModal,
  initialCategory,
  initialGroup,
}: MenuSectionProps) {
  const settings = useSiteSettings();
  const itemsPerPage = Math.max(1, settings.store.productsPerPage);
  const activeProducts = propProducts && propProducts.length > 0 ? propProducts : PRODUCTS;

  const [requestedGroup, setSelectedGroup] = useState<MenuGroup>(initialGroup || 'bakery');
  // Tabs switched off in admin are skipped; a request for one lands on the first tab still on.
  const visibleGroups = enabledMenuGroups(settings.store);
  const selectedGroup = visibleGroups.some(group => group.id === requestedGroup) ? requestedGroup : (visibleGroups[0]?.id ?? requestedGroup);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const activeGroup = MENU_GROUPS.find(group => group.id === selectedGroup) || MENU_GROUPS[0];

  const groupProducts = useMemo(
    () => visibleGroups.length === 0 ? [] : activeProducts.filter(product => groupOf(product) === selectedGroup),
    [activeProducts, selectedGroup, visibleGroups.length]
  );

  // Sub-category tabs come from the admin categories assigned to this group, and fall back
  // to whatever categories the group's products actually use.
  const categoriesList = useMemo(() => {
    const assigned = (propCategories || [])
      .filter(category => (category.menuGroup || 'bakery') === selectedGroup)
      .map(category => category.name);
    const used = Array.from(new Set(groupProducts.map(product => product.category).filter(Boolean)));
    const merged = Array.from(new Set([...assigned.filter(name => used.includes(name)), ...used]));
    if (merged.length > 0) return merged;
    return selectedGroup === 'bakery' && !propProducts?.length ? DEFAULT_CATEGORIES : assigned;
  }, [propCategories, propProducts, groupProducts, selectedGroup]);

  React.useEffect(() => {
    if (!initialCategory) return;
    setSelectedCategory(initialCategory);
    // Jump to the tab that owns the requested category so deep links from the home page land correctly.
    const owningCategory = (propCategories || []).find(category => category.name === initialCategory);
    const owningProduct = activeProducts.find(product => product.category === initialCategory);
    const targetGroup = (owningCategory?.menuGroup || (owningProduct && groupOf(owningProduct))) as MenuGroup | undefined;
    if (targetGroup) setSelectedGroup(targetGroup);
  }, [initialCategory, propCategories?.length, activeProducts.length]);

  // Major-category cards on the home page open the menu straight on their group.
  React.useEffect(() => {
    if (initialGroup) setSelectedGroup(initialGroup);
  }, [initialGroup]);

  // Reset the sub tab whenever the main tab changes and the old category no longer applies.
  React.useEffect(() => {
    setSelectedCategory(current => (current === 'All' || categoriesList.includes(current)) ? current : 'All');
  }, [categoriesList]);

  // Filter products based on group, category and search query
  const filteredProducts = useMemo(() => {
    return groupProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [groupProducts, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  
  // Reset page and simulate a loading skeleton when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 550); // 550ms delay for high-fidelity loading effect
    return () => clearTimeout(timer);
  }, [selectedGroup, selectedCategory, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const displayedProducts = paginatedProducts;

  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Search & Header Control Area */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-brand-blue tracking-tight font-display text-center md:text-left">
                Our Fresh Menu
              </h2>
              {isLiveSyncActive && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live WooCommerce Sync
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1 text-center md:text-left">
              Browse our diverse selection of fresh bakes, sweet confections, and savouries.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* WooCommerce Sync Connect Button */}
            {onOpenWooCommerceModal && (
              <button
                onClick={onOpenWooCommerceModal}
                className="px-3.5 py-2.5 bg-brand-gold/10 hover:bg-brand-gold/20 text-[#0B1354] border border-brand-gold/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-xs"
                title="Connect WooCommerce API to fetch products, categories, and prices"
              >
                <span className="text-brand-gold font-mono font-black">Woo</span>
                Sync API
              </button>
            )}

            {/* Search Input Box */}
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search cakes, buns, puffs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 text-gray-800 placeholder-gray-400 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/20 transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Main menu tabs — Bakery / Food / Combo. Hidden when admin leaves only one switched on. */}
        <div className="mb-7" role="tablist" aria-label="Main menu">
          {visibleGroups.length > 1 && <div className="mx-auto flex max-w-2xl flex-col gap-2 rounded-2xl border border-gray-150 bg-gray-50 p-1.5 sm:flex-row">
            {visibleGroups.map((group) => {
              const Icon = group.icon;
              const isActive = selectedGroup === group.id;
              return (
                <button
                  key={group.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => { setSelectedGroup(group.id); setSelectedCategory('All'); }}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors duration-200 cursor-pointer ${
                    isActive ? 'text-white' : 'text-brand-blue/70 hover:text-brand-blue hover:bg-white/70'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="menu-group-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-brand-blue shadow-md"
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-brand-gold' : ''}`} />
                    {group.label}
                  </span>
                </button>
              );
            })}
          </div>}
        </div>

        {/* Sub category pills for the selected main tab */}
        {categoriesList.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3.5 mb-12">
            {/* "All" button for easier exploration */}
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                selectedCategory === 'All'
                  ? 'bg-[#343EAF] text-white border-[#343EAF] shadow-xs scale-102'
                  : 'bg-white text-[#343EAF] border-gray-200 hover:border-[#343EAF] hover:bg-gray-50'
              }`}
            >
              All {activeGroup.label.split(' ')[0]}
            </button>

            {categoriesList.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                  selectedCategory === category
                    ? 'bg-[#343EAF] text-white border-[#343EAF] shadow-xs scale-102'
                    : 'bg-white text-[#343EAF] border-gray-200 hover:border-[#343EAF] hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              key="loading-skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={selectedGroup === 'combo' ? 'grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8'}
            >
              {Array.from({ length: selectedGroup === 'combo' ? 3 : 10 }).map((_, idx) => (
                <ProductSkeleton key={`skeleton-${idx}`} />
              ))}
            </motion.div>
          ) : displayedProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200"
            >
              <p className="text-gray-500 font-medium">
                {groupProducts.length === 0
                  ? `No ${activeGroup.label.toLowerCase()} are available right now. Please check back soon.`
                  : 'No products found matching your criteria.'}
              </p>
              {groupProducts.length > 0 && (
                <button
                  onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                  className="mt-4 text-brand-blue font-bold hover:underline text-sm cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          ) : selectedGroup === 'combo' ? (
            <motion.div layout className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {displayedProducts.map((product, index) => (
                // Keyed on a wrapper because this project builds without @types/react, so `key`
                // cannot be passed to a typed component directly. `contents` keeps the card
                // itself as the grid item so every card stretches to the row height.
                <div key={product.id} className="contents">
                  <ComboCard
                    product={product}
                    index={index}
                    onView={onProductClick}
                    onAddToCart={onAddToCartDirectly}
                  />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8"
            >
              {displayedProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard product={product} onProductClick={onProductClick} onAddToCartDirectly={onAddToCartDirectly} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination at bottom - styled exactly like screenshot */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-16">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-lg border border-gray-200 text-gray-400 hover:text-[#343EAF] hover:border-[#343EAF] disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx + 1}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-10 h-10 rounded-lg font-bold text-sm transition-all duration-150 cursor-pointer ${
                  currentPage === idx + 1
                    ? 'bg-[#343EAF] text-white border border-[#343EAF] shadow-xs scale-105'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-[#343EAF] hover:text-[#343EAF]'
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-lg border border-gray-200 text-gray-400 hover:text-[#343EAF] hover:border-[#343EAF] disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
