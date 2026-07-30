import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS } from '../data';

interface MenuSectionProps {
  onProductClick: (product: Product) => void;
  onAddToCartDirectly: (product: Product) => void;
  products?: Product[];
  categories?: string[];
  isLiveSyncActive?: boolean;
  onOpenWooCommerceModal?: () => void;
}

const DEFAULT_CATEGORIES = ['Cakes', 'Buns', 'Doughnuts', 'Piece Cake', 'Savories', 'Sweets'];
const ITEMS_PER_PAGE = 10;

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
}: MenuSectionProps) {
  const activeProducts = propProducts && propProducts.length > 0 ? propProducts : PRODUCTS;
  
  // Extract unique categories dynamically from products or propCategories
  const categoriesList = useMemo(() => {
    if (propCategories && propCategories.length > 0) {
      return propCategories;
    }
    if (propProducts && propProducts.length > 0) {
      const extracted = Array.from(new Set(propProducts.map(p => p.category))).filter(Boolean);
      if (extracted.length > 0) return extracted;
    }
    return DEFAULT_CATEGORIES;
  }, [propCategories, propProducts]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter products based on category and search query
  const filteredProducts = useMemo(() => {
    return activeProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeProducts, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  
  // Reset page and simulate a loading skeleton when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 550); // 550ms delay for high-fidelity loading effect
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const formatPrice = (min: number, max?: number) => {
    if (max) {
      return `$${min.toFixed(2)} – $${max.toFixed(2)}`;
    }
    return `$${min.toFixed(2)}`;
  };

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

        {/* Categories Pills - styled exactly like screenshot */}
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
            All Items
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

        {/* Product Grid */}
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              key="loading-skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8"
            >
              {Array.from({ length: 10 }).map((_, idx) => (
                <ProductSkeleton key={`skeleton-${idx}`} />
              ))}
            </motion.div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200"
            >
              <p className="text-gray-500 font-medium">No products found matching your criteria.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="mt-4 text-brand-blue font-bold hover:underline text-sm cursor-pointer"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8"
            >
              {paginatedProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-white rounded-2xl border border-gray-150/80 p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  onClick={() => onProductClick(product)}
                >
                  
                  {/* Card Thumbnail Container */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-4 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Floating Heart / Like Button */}
                    <button
                      onClick={(e) => toggleFavorite(product.id, e)}
                      className="absolute top-2.5 right-2.5 h-8.5 w-8.5 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-xs hover:bg-white text-gray-400 hover:text-rose-500 hover:scale-110 shadow-xs transition-all cursor-pointer"
                      aria-label="Add to wishlist"
                    >
                      <Heart className={`h-4.5 w-4.5 ${favorites.includes(product.id) ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
                    </button>

                    {/* Category Label */}
                    <span className="absolute bottom-2.5 left-2.5 bg-brand-blue/80 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                      {product.category}
                    </span>
                  </div>

                  {/* Product Details Section */}
                  <div className="flex flex-col items-center text-center flex-grow">
                    <h3 className="font-bold text-[15px] leading-snug text-gray-900 group-hover:text-[#343EAF] transition-colors font-display uppercase tracking-tight min-h-[44px] flex items-center justify-center">
                      {product.name}
                    </h3>
                    
                    {/* Optional small description */}
                    {product.description && (
                      <p className="text-xs text-gray-400 mt-1 mb-2.5 line-clamp-2 max-w-[180px]">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Price - bold style */}
                    <p className="text-[#343EAF] font-bold text-[14px] mt-auto font-mono">
                      {formatPrice(product.priceMin, product.priceMax)}
                    </p>
                  </div>

                  {/* Add To Cart button styled exactly like screenshot */}
                  <div className="mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.isCustomizable) {
                          onProductClick(product); // Open customization modal
                        } else {
                          onAddToCartDirectly(product);
                        }
                      }}
                      className="w-full py-2.5 bg-[#343EAF] hover:bg-[#252E90] text-white text-[13px] font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer uppercase tracking-wider"
                    >
                      Add To Cart
                    </button>
                  </div>

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
