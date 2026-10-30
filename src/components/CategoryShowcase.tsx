import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Category, GeneralSettings, MenuGroup, Product } from '../types';
import { enabledMenuGroups, groupOf } from '../menuGroups';
import { useSiteSettings } from './SiteSettingsContext';

const CARD_IMAGE_SETTING: Record<MenuGroup, keyof GeneralSettings['homepage']> = {
  bakery: 'bakeryCardImageUrl',
  food: 'foodCardImageUrl',
  combo: 'comboCardImageUrl',
};

interface CategoryShowcaseProps {
  categories?: Category[];
  products: Product[];
  onGroupClick: (group: MenuGroup) => void;
}

export default function CategoryShowcase({ categories, products, onGroupClick }: CategoryShowcaseProps) {
  const settings = useSiteSettings();

  // One card per major category. The artwork prefers the image set in Admin > Settings > General,
  // then a category image assigned to the group, then any product photo from the group, and only
  // then the curated fallback.
  const cards = useMemo(() => enabledMenuGroups(settings.store).map(group => {
    const groupProducts = products.filter(product => groupOf(product) === group.id);
    const configuredImage = String(settings.homepage[CARD_IMAGE_SETTING[group.id]] || '').trim();
    const assignedCategory = (categories || []).find(
      category => (category.menuGroup || 'bakery') === group.id && Boolean(category.image)
    );
    const productWithImage = groupProducts.find(product => Boolean(product.image));

    return {
      ...group,
      image: configuredImage || assignedCategory?.image || productWithImage?.image || group.fallbackImage,
      itemCount: groupProducts.length,
    };
  }), [categories, products, settings.homepage, settings.store]);

  return (
    <section className="bg-stone-50 py-12 sm:py-16" aria-labelledby="category-showcase-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-brand-gold">Made fresh for you</p>
          <h2 id="category-showcase-title" className="text-3xl font-extrabold tracking-tight text-brand-blue sm:text-4xl">
            Browse Our Categories
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-500 sm:text-base">
            {cards.length === 3 ? 'Three ways to order — everything from the bakery counter, meals from our kitchen, and bundles that save you more.' : 'Freshly made favourites, ready for you to order.'}
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-5 md:gap-6 ${cards.length === 3 ? 'md:grid-cols-3' : cards.length === 2 ? 'mx-auto max-w-4xl md:grid-cols-2' : 'mx-auto max-w-md'}`}>
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                type="button"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                onClick={() => onGroupClick(card.id)}
                className="group relative aspect-[16/9] overflow-hidden rounded-3xl bg-stone-900 text-left shadow-[0_12px_35px_rgba(11,19,84,0.12)] ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(11,19,84,0.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold/50"
                aria-label={`Browse ${card.label}`}
              >
                <img
                  src={card.image}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                {/* Horizontal wash keeps the landscape crop readable behind the left-aligned copy */}
                <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/55 to-stone-950/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 to-transparent" />

                <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-brand-blue">
                  {card.itemCount} {card.itemCount === 1 ? 'item' : 'items'}
                </span>

                <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-5 sm:p-6">
                  <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gold/95 text-stone-950 shadow-sm">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="text-xl font-extrabold leading-tight text-white drop-shadow sm:text-2xl">{card.label}</span>
                  <span className="mt-1.5 line-clamp-2 max-w-[92%] text-xs leading-5 text-white/70 sm:text-[13px]">{card.blurb}</span>
                  <span className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold opacity-90 transition-opacity group-hover:opacity-100 sm:text-xs">
                    View menu <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
