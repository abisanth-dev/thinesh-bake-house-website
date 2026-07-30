import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { HeroSlide } from '../types';

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "1",
    sub: "Weddings & Birthdays",
    title: "CAKES THAT",
    highlight: "CAPTIVATE",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1600",
    btnText: "Explore Cakes",
    isActive: true,
    order: 1
  },
  {
    id: "2",
    sub: "Freshly Oven Baked",
    title: "SWEETNESS IN",
    highlight: "EVERY BITE",
    image: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&q=80&w=1600",
    btnText: "Order Online",
    isActive: true,
    order: 2
  },
  {
    id: "3",
    sub: "Flaky & Golden Pastries",
    title: "SAVOURY PUFFS",
    highlight: "AND BUNS",
    image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=1600",
    btnText: "Browse Savouries",
    isActive: true,
    order: 3
  }
];

interface HeroCarouselProps {
  onActionClick: (tabId: string) => void;
  slides?: HeroSlide[];
}

export default function HeroCarousel({ onActionClick, slides }: HeroCarouselProps) {
  const activeSlides = (slides && slides.length > 0) 
    ? slides.filter(s => s.isActive) 
    : DEFAULT_SLIDES;

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (activeSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  if (activeSlides.length === 0) return null;

  const activeIndex = current % activeSlides.length;
  const currentSlide = activeSlides[activeIndex] || activeSlides[0];

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % activeSlides.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  return (
    <div className="relative h-[500px] md:h-[600px] lg:h-[650px] w-full overflow-hidden bg-stone-950 text-white">
      {/* Slider Content Wrapper */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Full bleed slide image */}
          <motion.img
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6, ease: "easeOut" }}
            src={currentSlide.image}
            alt={currentSlide.highlight || currentSlide.title}
            className="absolute inset-0 w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />

          {/* Master high fidelity dark gradient overlays for extreme legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/40" />

          {/* Main content container */}
          <div className="relative mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center z-10">
            <div className="max-w-2xl text-left">
              
              {/* Category Subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex items-center gap-2 text-brand-gold font-bold text-sm md:text-base uppercase tracking-widest mb-3.5"
              >
                <Sparkles className="h-4.5 w-4.5 text-brand-gold animate-pulse" />
                <span>{currentSlide.sub}</span>
              </motion.div>
              
              {/* Main Title display */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight font-display text-white leading-none uppercase"
              >
                {currentSlide.title}{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-300 drop-shadow-md">
                  {currentSlide.highlight}
                </span>
              </motion.h2>

              {/* Decorative design line spacer */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "120px" }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="h-2 bg-brand-blue-light rounded-full mt-5 mb-8 border border-white/10 shadow-lg"
              />

              {/* Dynamic Call to Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <button
                  onClick={() => onActionClick('menu')}
                  className="bg-brand-gold hover:bg-[#cfa55b] text-white text-sm md:text-base font-bold py-3.5 px-8 rounded-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer inline-flex items-center gap-2 border border-brand-gold uppercase tracking-wider font-mono"
                >
                  {currentSlide.btnText || 'Explore Menu'}
                </button>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Navigation Indicators / Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {activeSlides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === idx ? 'w-8 bg-brand-gold' : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Left and Right Chevron Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white transition-all cursor-pointer hidden sm:flex items-center justify-center border border-white/10 hover:scale-105 active:scale-95 z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white transition-all cursor-pointer hidden sm:flex items-center justify-center border border-white/10 hover:scale-105 active:scale-95 z-20"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
