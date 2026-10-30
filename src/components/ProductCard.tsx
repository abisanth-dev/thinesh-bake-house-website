import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Product } from '../types';
import { useSiteSettings } from './SiteSettingsContext';
import { formatMoney } from '../siteSettings';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onAddToCartDirectly: (product: Product) => void;
}

// Standard product card shared by the menu grid and the home page category carousels.
export default function ProductCard({ product, onProductClick, onAddToCartDirectly }: ProductCardProps) {
  const settings = useSiteSettings();
  const [isFavorite, setIsFavorite] = useState(false);

  const price = product.priceMax
    ? `${formatMoney(product.priceMin, settings)} – ${formatMoney(product.priceMax, settings)}`
    : formatMoney(product.priceMin, settings);

  return (
    <div
      className={`group bg-white rounded-2xl border border-gray-150/80 p-5 shadow-xs transition-all duration-300 flex h-full flex-col justify-between ${product.checkoutDisabled ? 'cursor-default' : 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'}`}
      onClick={() => { if (!product.checkoutDisabled) onProductClick(product); }}
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
        {(settings.header.wishlistEnabled || settings.store.wishlistEnabled) && <button
          onClick={(e) => { e.stopPropagation(); setIsFavorite(current => !current); }}
          className="absolute top-2.5 right-2.5 h-8.5 w-8.5 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-xs hover:bg-white text-gray-400 hover:text-rose-500 hover:scale-110 shadow-xs transition-all cursor-pointer"
          aria-label="Add to wishlist"
        >
          <Heart className={`h-4.5 w-4.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
        </button>}

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
        {product.checkoutDisabled ? (
          <p className="mt-auto text-[13px] font-semibold italic text-amber-700">Price updating soon</p>
        ) : (
          <p className="text-[#343EAF] font-bold text-[14px] mt-auto font-mono">
            {price}
          </p>
        )}
      </div>

      {/* Add To Cart button */}
      <div className="mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (product.stockStatus === 'out_of_stock' || product.checkoutDisabled) return;
            if (product.isCustomizable) {
              onProductClick(product); // Open customization modal
            } else {
              onAddToCartDirectly(product);
            }
          }}
          disabled={product.stockStatus === 'out_of_stock' || product.checkoutDisabled}
          className="w-full py-2.5 bg-[#343EAF] hover:bg-[#252E90] text-white text-[13px] font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer uppercase tracking-wider disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600 disabled:shadow-none"
        >
          {product.checkoutDisabled ? 'Not Available' : product.stockStatus === 'out_of_stock' ? 'Unavailable' : 'Add To Cart'}
        </button>
      </div>
    </div>
  );
}
