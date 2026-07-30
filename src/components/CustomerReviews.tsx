import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronLeft, ChevronRight, Quote, MessageSquareHeart } from 'lucide-react';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll positions to show/hide/disable controls dynamically
  const checkScrollPosition = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(
        el.scrollLeft < el.scrollWidth - el.clientWidth - 5
      );
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollPosition);
      // Run once on load/resize
      checkScrollPosition();
      window.addEventListener('resize', checkScrollPosition);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.75;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-16 bg-[#FDFBF7] border-b border-gray-100 relative overflow-hidden">
      {/* Decorative background vectors */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#343EAF] flex items-center gap-1.5 mb-2">
              <MessageSquareHeart className="h-4 w-4 text-brand-gold" />
              Real Love from Real Patrons
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1354] font-display uppercase tracking-tight">
              Loved By The Community
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-lg leading-relaxed">
              We are honored to have been serving sweet joy and crisp Ceylon baked treats for generations. Here is what our customers say.
            </p>
          </div>

          {/* Slider controls */}
          <div className="flex items-center gap-2.5 self-start md:self-end">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-2.5 rounded-full border-2 transition-all ${
                canScrollLeft
                  ? 'border-[#0B1354] text-[#0B1354] hover:bg-[#0B1354] hover:text-white cursor-pointer active:scale-95'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-2.5 rounded-full border-2 transition-all ${
                canScrollRight
                  ? 'border-[#0B1354] text-[#0B1354] hover:bg-[#0B1354] hover:text-white cursor-pointer active:scale-95'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel View Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {REVIEWS.map((review) => (
            <div
              key={review.id}
              className="w-[300px] sm:w-[350px] md:w-[380px] flex-shrink-0 snap-start"
            >
              <div className="bg-white rounded-2xl border border-gray-150/80 p-6 md:p-8 h-full flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow duration-300 relative group">
                
                {/* Floating quote indicator */}
                <div className="absolute top-6 right-6 text-[#0B1354]/5 group-hover:text-[#0B1354]/10 transition-colors pointer-events-none">
                  <Quote className="h-12 w-12 transform rotate-180" />
                </div>

                {/* Stars and date */}
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-4 w-4 ${
                          idx < review.rating
                            ? 'text-brand-gold fill-brand-gold'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-gray-400 font-mono ml-2">
                      {review.date}
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-gray-600 text-sm leading-relaxed italic line-clamp-4">
                    "{review.comment}"
                  </p>
                </div>

                {/* Customer bio & product tag */}
                <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Initials Avatar */}
                    <div className={`h-10 w-10 rounded-full font-black text-sm flex items-center justify-center ${review.avatarBg}`}>
                      {review.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#0B1354] text-xs uppercase tracking-tight">
                        {review.name}
                      </h4>
                      <span className="text-[10px] text-gray-400 block font-medium">
                        {review.location}
                      </span>
                    </div>
                  </div>

                  {/* High fidelity dynamic product tag tagger */}
                  <span className="bg-[#343EAF]/5 text-[#343EAF] text-[9px] font-bold font-mono tracking-wider uppercase px-2.5 py-1 rounded-sm">
                    {review.productTag}
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Mini Trust Signal Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            4.9/5 Average Rating
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            12,500+ Happy Jaffna & Colombo Families
          </div>
        </div>

      </div>
    </section>
  );
}
