import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS } from '../data';

interface PromotionsProps {
  onProductClick: (product: Product) => void;
  eggPuffProduct: Product | undefined;
}

export default function Promotions({ onProductClick, eggPuffProduct }: PromotionsProps) {
  const customCakeProduct = PRODUCTS.find((p) => p.id === 'romance-pink-heart');
  
  // List of extra promotional campaigns for the dedicated Promotions page
  const extraPromotions = [
    {
      id: 'promo-1',
      tag: 'Weekend Special',
      title: 'Family Feast Pack',
      desc: 'Buy any 1.5kg Customizable Cake and get 4 Cinnamon Rolls & 4 Ceylon Spicy Egg Puffs absolutely FREE!',
      code: 'FAMFEAST82',
      expiry: 'Valid every Friday - Sunday',
      color: 'bg-emerald-50 border-emerald-100 text-emerald-800'
    },
    {
      id: 'promo-2',
      tag: 'Tea Time Bundle',
      title: 'Savouries Combo',
      desc: 'Get 2 Ceylon Spicy Egg Puffs, 2 Fish Patties, and 2 Chicken Samosas + 2 Tea/Coffee for just $4.99.',
      code: 'TEATIME99',
      expiry: 'Daily from 3:00 PM to 6:00 PM',
      color: 'bg-amber-50 border-amber-100 text-amber-800'
    },
    {
      id: 'promo-3',
      tag: 'Birthday Special',
      title: '10% Off Birthday Cakes',
      desc: 'Pre-order any Birthday or Wedding cake at least 5 days in advance and enjoy a 10% discount on the final price.',
      code: 'CELEBRATE10',
      expiry: 'Ongoing Promotion',
      color: 'bg-indigo-50 border-indigo-100 text-indigo-800'
    }
  ];

  return (
    <div className="py-16 bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main Section Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-brand-gold uppercase tracking-widest bg-brand-gold/10 px-3 py-1.5 rounded-full inline-block mb-3">
            Special Deals
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-blue tracking-tight">
            PROMOTIONS & COMBOS
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">
            Freshly prepared treats with incredible value. Tap on an offer to explore more details or place an order.
          </p>
        </div>

        {/* The Three Main Image Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          
          {/* Promotion Card 1: Egg Puff */}
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative rounded-2xl overflow-hidden bg-[#FAF6F0] border border-stone-200/50 shadow-md flex flex-col justify-between h-[420px] p-8 group cursor-pointer"
            onClick={() => {
              if (eggPuffProduct) {
                onProductClick(eggPuffProduct);
              }
            }}
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-stone-100/50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-4 left-4 text-[13px] font-semibold text-stone-400 font-serif">
              Thinesh Bake House Since 1982
            </div>

            {/* Typography Content */}
            <div className="z-10">
              <span className="text-stone-500 text-xs font-bold tracking-wider font-mono uppercase block mb-1">
                Local Favourite
              </span>
              <h3 className="text-4xl font-extrabold text-[#5C4033] font-display tracking-tight leading-none mb-1">
                Egg Puff
              </h3>
              <p className="text-stone-600 text-sm font-medium tracking-wide italic">
                Flaky. Golden. Irresistible.
              </p>

              {/* Price Tag Badge exactly like screenshot: "130/=" */}
              <div className="mt-4 inline-flex items-center justify-center bg-[#8B5A2B] text-white font-extrabold text-lg px-4 py-2 rounded-lg shadow-md border border-amber-950/20">
                130/=
              </div>
            </div>

            {/* Delicious image of puff pastry on slate at bottom/right */}
            <div className="absolute bottom-0 right-0 w-3/4 h-1/2 overflow-hidden rounded-tl-3xl shadow-2xl border-t border-l border-white/20">
              <img
                src="https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=600"
                alt="Golden Egg Puff"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              {/* Overlay shadow */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            {/* Hover arrow indicator */}
            <div className="absolute top-8 right-8 bg-white/80 hover:bg-white text-[#5C4033] p-2 rounded-full shadow-sm hover:scale-110 transition-transform">
              <ArrowRight className="h-5 w-5" />
            </div>
          </motion.div>

          {/* Promotion Card 2: Muffins - Fluffy. Fresh. Fantastic */}
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative rounded-2xl overflow-hidden bg-[#0A195C] text-white shadow-md flex flex-col justify-between h-[420px] p-8 group"
          >
            {/* Background elements */}
            <div className="absolute inset-0 bg-radial from-[#1A31A0] via-transparent to-transparent opacity-70 pointer-events-none" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

            {/* Typography Content */}
            <div className="z-10">
              <span className="text-blue-300 text-xs font-bold tracking-widest font-mono uppercase block mb-1">
                Daily Treats
              </span>
              <h3 className="text-3xl font-extrabold text-white font-display tracking-tight leading-tight">
                Fluffy. Fresh.<br />Fantastic.
              </h3>
              <p className="text-blue-200 text-sm font-light mt-1">
                Perfect with your morning coffee.
              </p>
            </div>

            {/* Muffins in wood tray image at bottom/right */}
            <div className="absolute bottom-16 right-0 w-3/4 h-1/2 overflow-hidden rounded-tl-3xl shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=80&w=600"
                alt="Fluffy Muffins"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Bottom contact ribbon from screenshot: "Ready for a bite? Visit our site to order now! www.tbh.lk" */}
            <div className="absolute bottom-0 inset-x-0 bg-blue-700/80 backdrop-blur-xs px-6 py-3 text-[11px] sm:text-xs text-center border-t border-blue-500/30 flex items-center justify-between gap-2">
              <span className="font-medium text-blue-100">Ready for a bite? Visit our site to order now!</span>
              <a href="https://tbh.lk" target="_blank" rel="noreferrer" className="font-bold text-white hover:text-brand-gold underline tracking-wide">
                www.tbh.lk
              </a>
            </div>
          </motion.div>

          {/* Promotion Card 3: Celebration Cakes - Elegant. Exquisite. Enchanting. */}
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative rounded-2xl overflow-hidden bg-[#4E1119] text-white shadow-md flex flex-col justify-between h-[420px] p-8 group cursor-pointer"
            onClick={() => {
              if (customCakeProduct) {
                onProductClick(customCakeProduct);
              }
            }}
          >
            {/* Background elements */}
            <div className="absolute inset-0 bg-radial from-[#7C1E2B] via-transparent to-transparent opacity-70 pointer-events-none" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-400/10 rounded-full blur-xl pointer-events-none" />

            {/* Typography Content */}
            <div className="z-10">
              <span className="text-red-300 text-xs font-bold tracking-widest font-mono uppercase block mb-1">
                Signature Cakes
              </span>
              <h3 className="text-3xl font-extrabold text-white font-display tracking-tight leading-tight">
                Elegant. Exquisite.<br />Enchanting.
              </h3>
              <p className="text-red-200 text-sm font-light mt-1">
                Custom masterpieces for your special events.
              </p>
            </div>

            {/* Cake image at bottom/right */}
            <div className="absolute bottom-16 right-0 w-3/4 h-1/2 overflow-hidden rounded-tl-3xl shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600"
                alt="Celebration Cakes"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Bottom contact ribbon */}
            <div className="absolute bottom-0 inset-x-0 bg-[#7B1E29] backdrop-blur-xs px-6 py-3 text-[11px] sm:text-xs text-center border-t border-red-500/20 flex items-center justify-between gap-2">
              <span className="font-medium text-red-100">Planning an event? Custom order now!</span>
              <span className="font-bold text-brand-gold tracking-wide">
                021 221 2525
              </span>
            </div>
            
            {/* Hover arrow indicator */}
            <div className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full shadow-sm hover:scale-110 transition-transform">
              <ArrowRight className="h-5 w-5" />
            </div>
          </motion.div>

        </div>

        {/* Extra Campaign Grid for the Promotion Page */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <Tag className="h-5 w-5 text-brand-gold" />
            <h3 className="text-xl font-bold text-brand-blue font-display">
              Exclusive Coupon Codes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {extraPromotions.map((promo) => (
              <div key={promo.id} className="border border-gray-150 rounded-xl p-5 flex flex-col justify-between hover:border-brand-gold/30 hover:shadow-xs transition-all bg-gray-50/30">
                <div>
                  <span className="text-[10px] font-bold tracking-wider font-mono uppercase bg-gray-200/60 text-gray-700 px-2 py-1 rounded-sm">
                    {promo.tag}
                  </span>
                  <h4 className="font-bold text-base text-brand-blue font-display mt-2.5 mb-1.5">
                    {promo.title}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {promo.desc}
                  </p>
                </div>
                
                <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Coupon Code:</span>
                    <span className="font-mono font-bold bg-brand-blue/5 text-brand-blue border border-brand-blue/10 px-2.5 py-1 rounded-md text-[11px] tracking-wide select-all">
                      {promo.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{promo.expiry}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
