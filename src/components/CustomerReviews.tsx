import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronLeft, ChevronRight, Quote, MessageSquareHeart, MapPin, ShieldCheck } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  productTag: string;
  avatarBg: string;
}

const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    name: 'Sinthujan K.',
    location: 'Jaffna Town',
    rating: 5,
    date: 'Yesterday',
    comment: 'The Ceylon Egg Puffs here are legendary! Crisp, flaky layers with the perfect balance of spices. They bake them fresh constantly. Absolutely a local treasure.',
    productTag: 'Egg Puff',
    avatarBg: 'bg-indigo-100 text-indigo-700'
  },
  {
    id: 'rev-2',
    name: 'Dilini Perera',
    location: 'Colombo 03',
    rating: 5,
    date: '3 days ago',
    comment: 'Ordered a customized 2-tier wedding anniversary cake. The buttercream was incredibly smooth, not overly sweet, and beautifully decorated. Thinesh Bake House has maintained their top-tier quality for years!',
    productTag: 'Custom Cakes',
    avatarBg: 'bg-rose-100 text-rose-700'
  },
  {
    id: 'rev-3',
    name: 'Abishek T.',
    location: 'Nallur, Jaffna',
    rating: 5,
    date: '1 week ago',
    comment: 'I can never get enough of their Milk Toffees and iced sweet buns. It takes me straight back to my childhood days in the 90s. Pure nostalgia and fantastic staff.',
    productTag: 'Milk Toffee',
    avatarBg: 'bg-amber-100 text-amber-700'
  },
  {
    id: 'rev-4',
    name: 'Fathima R.',
    location: 'Wellawatte',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Extremely clean and hygienic packing. Love the branch pickup feature because we can reserve the warm savories online and collect them exactly when they come out of the oven.',
    productTag: 'Savories',
    avatarBg: 'bg-emerald-100 text-emerald-700'
  },
  {
    id: 'rev-5',
    name: 'Mayurathan S.',
    location: 'Kokuvil',
    rating: 5,
    date: '3 weeks ago',
    comment: 'Best bake house in Jaffna hands down. The soft bread is like a cloud. Our family gatherings are incomplete without their assortment of pastries and cakes.',
    productTag: 'Buns & Pastries',
    avatarBg: 'bg-teal-100 text-teal-700'
  },
  {
    id: 'rev-6',
    name: 'Priyantha D.',
    location: 'Mount Lavinia',
    rating: 5,
    date: '1 month ago',
    comment: 'Whenever I visit Jaffna or Colombo branches, I always stock up on their doughnuts. The chocolate glaze is rich and the bread dough is soft and chewy.',
    productTag: 'Doughnuts',
    avatarBg: 'bg-sky-100 text-sky-700'
  }
];

export default function CustomerReviews() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeReview = REVIEWS[activeIndex];

  const showPrevious = () => setActiveIndex(index => (index - 1 + REVIEWS.length) % REVIEWS.length);
  const showNext = () => setActiveIndex(index => (index + 1) % REVIEWS.length);

  return (
    <section className="relative overflow-hidden bg-brand-blue py-16 text-white sm:py-24" aria-labelledby="testimonials-title">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <Quote className="pointer-events-none absolute -bottom-12 -left-8 h-64 w-64 rotate-180 text-white/[0.025]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16 lg:px-8">
        <div>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-gold backdrop-blur-sm">
            <MessageSquareHeart className="h-4 w-4" /> Customer stories
          </span>
          <h2 id="testimonials-title" className="max-w-lg text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Baked with love. <span className="text-brand-gold">Remembered</span> for generations.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-blue-100/70 sm:text-base">
            From everyday tea-time favourites to milestone celebrations, our customers have made us part of their sweetest memories.
          </p>

          <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-brand-gold">
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <p className="mt-2 text-2xl font-black">4.9/5</p>
              <p className="text-[10px] uppercase tracking-wider text-blue-100/50">Average rating</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <p className="mt-2 text-2xl font-black">12,500+</p>
              <p className="text-[10px] uppercase tracking-wider text-blue-100/50">Happy families</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.article
              key={activeReview.id}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative min-h-[390px] overflow-hidden rounded-[2rem] bg-white p-7 text-stone-900 shadow-[0_30px_90px_rgba(0,0,0,0.25)] sm:min-h-[420px] sm:p-10"
            >
              <div className="absolute right-7 top-6 text-brand-blue/[0.06] sm:right-10 sm:top-8">
                <Quote className="h-20 w-20 rotate-180 sm:h-24 sm:w-24" />
              </div>

              <div className="relative flex h-full min-h-[334px] flex-col justify-between sm:min-h-[340px]">
                <div>
                  <div className="flex items-center gap-1 text-brand-gold">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className={`h-4 w-4 ${index < activeReview.rating ? 'fill-current' : 'text-stone-200'}`} />
                    ))}
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">Verified customer</span>
                  </div>
                  <blockquote className="mt-8 max-w-2xl text-xl font-semibold leading-relaxed text-brand-blue sm:text-2xl sm:leading-relaxed">
                    “{activeReview.comment}”
                  </blockquote>
                </div>

                <footer className="mt-8 flex flex-col gap-5 border-t border-stone-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-black ${activeReview.avatarBg}`}>
                      {activeReview.name.split(' ').map(name => name[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-brand-blue">{activeReview.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-400">
                        <MapPin className="h-3 w-3" /> {activeReview.location} · {activeReview.date}
                      </p>
                    </div>
                  </div>
                  <span className="w-fit rounded-full bg-brand-gold/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-brand-gold-dark">
                    {activeReview.productTag}
                  </span>
                </footer>
              </div>
            </motion.article>
          </AnimatePresence>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2" aria-label={`Testimonial ${activeIndex + 1} of ${REVIEWS.length}`}>
              {REVIEWS.map((review, index) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all ${activeIndex === index ? 'w-8 bg-brand-gold' : 'w-2 bg-white/25 hover:bg-white/50'}`}
                  aria-label={`Show testimonial ${index + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={showPrevious} className="rounded-full border border-white/15 bg-white/5 p-3 text-white transition hover:border-brand-gold hover:bg-brand-gold hover:text-brand-blue" aria-label="Previous testimonial">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={showNext} className="rounded-full border border-white/15 bg-white/5 p-3 text-white transition hover:border-brand-gold hover:bg-brand-gold hover:text-brand-blue" aria-label="Next testimonial">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
