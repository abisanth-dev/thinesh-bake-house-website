import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Tag } from 'lucide-react';
import { Product } from '../types';
import { useSiteSettings } from './SiteSettingsContext';
import { formatMoney } from '../siteSettings';

interface ComboCardProps {
  product: Product;
  index: number;
  onView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const MAX_VISIBLE_ITEMS = 5;

/**
 * Classic combo card: cream paper, gold hairline frame, a struck-through combined value
 * next to the combo price, and a savings ribbon. Designed for a three-per-row grid.
 */
export default function ComboCard({ product, index, onView, onAddToCart }: ComboCardProps) {
  const settings = useSiteSettings();

  const comboItems = product.comboItems || [];
  const salePrice = Number(product.salePrice ?? product.priceMin ?? 0);
  const regularPrice = Number(product.regularPrice ?? salePrice);
  const savings = Math.max(0, regularPrice - salePrice);
  const savingsPercent = regularPrice > 0 ? Math.round((savings / regularPrice) * 100) : 0;
  const isSoldOut = product.stockStatus === 'out_of_stock';
  const isCheckoutDisabled = Boolean(product.checkoutDisabled);

  const visibleItems = comboItems.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenItemCount = comboItems.length - visibleItems.length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: Math.min(index, 5) * 0.06 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-brand-gold/35 bg-[#FFFCF5] shadow-[0_14px_40px_rgba(11,19,84,0.08)] transition-shadow duration-300 hover:shadow-[0_22px_55px_rgba(11,19,84,0.16)]"
    >
      {/* Inner hairline, the classic double-rule frame */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-[6px] z-10 rounded-[20px] border border-brand-gold/25" />

      {/* Cover image */}
      <button
        type="button"
        onClick={() => onView(product)}
        disabled={isCheckoutDisabled}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-stone-100 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold/50 disabled:cursor-default"
        aria-label={`View ${product.name} combo details`}
      >
        <img
          src={product.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/10 to-transparent" />

        <span className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-blue shadow-sm">
          <Tag className="h-3 w-3 text-brand-gold" /> Combo
        </span>

        {savings > 0 && !isCheckoutDisabled && (
          <span className="absolute right-4 top-4 z-20 flex flex-col items-center rounded-xl bg-emerald-600 px-3 py-1.5 text-white shadow-lg">
            <span className="font-mono text-sm font-black leading-none">Save {formatMoney(savings, settings)}</span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-50">{savingsPercent}% off</span>
          </span>
        )}

        {isSoldOut && (
          <span className="absolute inset-x-0 bottom-0 z-20 bg-stone-900/85 py-2 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white">
            Sold out
          </span>
        )}
      </button>

      {/* Body */}
      <div className="relative z-20 flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-lg font-extrabold uppercase leading-snug tracking-tight text-brand-blue">
          {product.name}
        </h3>
        {product.shortDescription || product.description ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-stone-500">
            {product.shortDescription || product.description}
          </p>
        ) : null}

        {/* Ornamental rule */}
        <div aria-hidden="true" className="my-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-brand-gold/30" />
          <span className="h-1.5 w-1.5 rotate-45 bg-brand-gold/60" />
          <span className="h-px flex-1 bg-brand-gold/30" />
        </div>

        {comboItems.length > 0 && (
          <>
            <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">Inside this combo</p>
            <ul className="mb-5 space-y-2">
              {visibleItems.map((item, itemIndex) => (
                <li key={`${item.productId}-${itemIndex}`} className="flex items-center gap-2.5 text-xs text-stone-700">
                  <span className="min-w-[34px] shrink-0 rounded-md bg-brand-blue/10 px-1.5 py-0.5 text-center font-mono text-[11px] font-bold text-brand-blue">
                    {item.quantity}×
                  </span>
                  <span className="truncate font-semibold">{item.name}</span>
                </li>
              ))}
              {hiddenItemCount > 0 && (
                <li className="pl-[44px] text-[11px] font-semibold italic text-stone-400">
                  + {hiddenItemCount} more item{hiddenItemCount > 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </>
        )}

        {/* Pricing — mt-auto keeps the price and CTA aligned across a row of cards */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-brand-gold/35 pt-4">
          {isCheckoutDisabled ? (
            <span className="block pb-1 text-sm font-semibold italic text-amber-700">Price updating soon</span>
          ) : (
            <div>
              {savings > 0 && (
                <span className="block font-mono text-xs text-stone-400 line-through">
                  {formatMoney(regularPrice, settings)}
                </span>
              )}
              <span className="block font-mono text-2xl font-black leading-tight text-brand-blue">
                {formatMoney(salePrice, settings)}
              </span>
            </div>
          )}
          {!isCheckoutDisabled && (
            <button
              type="button"
              onClick={() => onView(product)}
              className="pb-1 text-[11px] font-bold uppercase tracking-wider text-brand-blue/70 underline-offset-4 transition-colors hover:text-brand-blue hover:underline cursor-pointer"
            >
              View details
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAddToCart(product)}
          disabled={isSoldOut || isCheckoutDisabled}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3 text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:bg-brand-blue-light hover:shadow-md active:scale-98 cursor-pointer disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600 disabled:shadow-none"
        >
          <ShoppingBag className="h-4 w-4" />
          {isCheckoutDisabled ? 'Not available' : isSoldOut ? 'Unavailable' : 'Add combo to cart'}
        </button>
      </div>
    </motion.article>
  );
}
