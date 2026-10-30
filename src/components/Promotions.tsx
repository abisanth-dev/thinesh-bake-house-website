import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, BadgePercent, Clock3, Gift, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS } from '../data';

interface PromotionsProps {
  onProductClick: (product: Product) => void;
  eggPuffProduct: Product | undefined;
  showCoupons?: boolean;
}

const extraPromotions = [
  {
    id: 'promo-1',
    tag: 'Weekend Special',
    title: 'Family Feast Pack',
    desc: 'Buy any 1.5kg customizable cake and receive cinnamon rolls and spicy egg puffs free.',
    code: 'FAMFEAST82',
    expiry: 'Friday to Sunday',
  },
  {
    id: 'promo-2',
    tag: 'Tea Time Bundle',
    title: 'Savouries Combo',
    desc: 'A delicious mix of egg puffs, fish patties, chicken samosas and two hot drinks.',
    code: 'TEATIME99',
    expiry: 'Daily, 3:00 PM–6:00 PM',
  },
  {
    id: 'promo-3',
    tag: 'Birthday Special',
    title: '10% Off Celebration Cakes',
    desc: 'Pre-order a birthday or wedding cake five days ahead and save on the final price.',
    code: 'CELEBRATE10',
    expiry: 'Ongoing promotion',
  },
];

function CouponCards() {
  return (
    <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-5 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-xl bg-brand-blue p-2.5 text-brand-gold"><Gift className="h-5 w-5" /></span>
        <div>
          <h3 className="text-xl font-extrabold text-brand-blue">Exclusive coupon codes</h3>
          <p className="text-xs text-stone-500">Use a code at checkout to claim your offer.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {extraPromotions.map((promo, index) => (
          <motion.article
            key={promo.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-brand-gold/50 hover:shadow-lg"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-gold-dark">{promo.tag}</span>
              <BadgePercent className="h-5 w-5 text-brand-gold" />
            </div>
            <h4 className="mt-3 text-lg font-extrabold text-brand-blue">{promo.title}</h4>
            <p className="mt-2 flex-1 text-xs leading-5 text-stone-500">{promo.desc}</p>
            <div className="mt-5 border-t border-dashed border-stone-200 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Use code</span>
                <code className="rounded-lg border border-brand-blue/10 bg-brand-blue/5 px-3 py-1.5 text-xs font-extrabold tracking-wider text-brand-blue selection:bg-brand-gold">
                  {promo.code}
                </code>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-stone-400">
                <Clock3 className="h-3.5 w-3.5 text-emerald-500" /> {promo.expiry}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

export function CouponOffers() {
  return (
    <section className="bg-white pb-14 sm:pb-20" aria-label="Exclusive coupon offers">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CouponCards />
      </div>
    </section>
  );
}

export default function Promotions({ onProductClick, eggPuffProduct, showCoupons = true }: PromotionsProps) {
  const customCakeProduct = PRODUCTS.find(product => product.id === 'romance-pink-heart');

  return (
    <section className="overflow-hidden bg-white py-14 sm:py-20" aria-labelledby="promotions-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-gold/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-gold-dark">
              <Sparkles className="h-3.5 w-3.5" /> Fresh offers
            </div>
            <h2 id="promotions-title" className="text-3xl font-extrabold tracking-tight text-brand-blue sm:text-4xl lg:text-5xl">
              Promotions <span className="text-brand-gold">& Combos</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500 sm:text-base">
              More reasons to share something delicious—limited-time favourites and bundles made for every occasion.
            </p>
          </div>
          <p className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-400 sm:flex">
            <Clock3 className="h-4 w-4 text-brand-gold" /> Available for a limited time
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <motion.button
            type="button"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.25 }}
            onClick={() => eggPuffProduct && onProductClick(eggPuffProduct)}
            className="group relative min-h-[440px] overflow-hidden rounded-[2rem] bg-stone-950 text-left shadow-[0_24px_70px_rgba(11,19,84,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold/50 sm:min-h-[510px]"
            aria-label="View the egg puff promotion"
          >
            <img
              src={eggPuffProduct?.image || 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=85&w=1200'}
              alt="Golden egg puff promotion"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/75 to-stone-950/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

            <div className="relative flex h-full min-h-[440px] max-w-md flex-col justify-between p-7 sm:min-h-[510px] sm:p-10">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                  Local favourite
                </span>
                <span className="rounded-full bg-white p-2.5 text-brand-blue shadow-xl transition-transform group-hover:rotate-6 group-hover:scale-110">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">Flaky · Golden · Irresistible</p>
                <h3 className="text-5xl font-black leading-none tracking-tight text-white sm:text-7xl">Egg Puff</h3>
                <div className="mt-6 flex items-center gap-4">
                  <span className="rounded-xl bg-brand-gold px-5 py-3 text-2xl font-black text-brand-blue shadow-lg">130/=</span>
                  <span className="max-w-[150px] text-xs font-medium leading-5 text-white/70">Baked fresh throughout the day.</span>
                </div>
              </div>
            </div>
          </motion.button>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <motion.article
              whileHover={{ y: -4 }}
              className="group relative min-h-[242px] overflow-hidden rounded-[2rem] bg-brand-blue shadow-[0_18px_50px_rgba(11,19,84,0.14)]"
            >
              <img
                src="https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=85&w=900"
                alt="Freshly baked muffins"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-blue via-brand-blue/85 to-brand-blue/10" />
              <div className="relative flex min-h-[242px] max-w-xs flex-col justify-end p-7">
                <span className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-gold">Daily treats</span>
                <h3 className="text-3xl font-extrabold leading-none text-white">Fresh Muffins</h3>
                <p className="mt-2 text-sm text-blue-100/80">Soft, fluffy and perfect with your morning coffee.</p>
              </div>
            </motion.article>

            <motion.button
              type="button"
              whileHover={{ y: -4 }}
              onClick={() => customCakeProduct && onProductClick(customCakeProduct)}
              className="group relative min-h-[242px] overflow-hidden rounded-[2rem] bg-[#50141d] text-left shadow-[0_18px_50px_rgba(80,20,29,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold/50"
              aria-label="View custom celebration cakes"
            >
              <img
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=85&w=900"
                alt="Custom celebration cake"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#50141d] via-[#50141d]/85 to-transparent" />
              <div className="relative flex min-h-[242px] max-w-xs flex-col justify-end p-7">
                <span className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-gold">Made for your moment</span>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-3xl font-extrabold leading-none text-white">Custom Cakes</h3>
                    <p className="mt-2 text-sm text-red-100/80">Designed beautifully for every celebration.</p>
                  </div>
                  <ArrowUpRight className="mb-1 h-5 w-5 shrink-0 text-white" />
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {showCoupons && <div className="mt-8 sm:mt-10"><CouponCards /></div>}
      </div>
    </section>
  );
}
