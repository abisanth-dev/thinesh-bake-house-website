import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category, Product } from '../types';
import { MENU_GROUPS } from '../menuGroups';
import ProductCard from './ProductCard';
import ComboCard from './ComboCard';

const AUTO_SLIDE_MS = 4000;

interface HomeCategoryCarouselProps {
  category: Category;
  products: Product[];
  /** Alternate section backgrounds so consecutive carousels read as separate blocks. */
  shaded?: boolean;
  onProductClick: (product: Product) => void;
  onAddToCartDirectly: (product: Product) => void;
  onViewAll: (category: Category) => void;
}

// One home page section per category an admin features: heading, short description and a
// horizontally scrolling row of that category's products.
export default function HomeCategoryCarousel({ category, products, shaded, onProductClick, onAddToCartDirectly, onViewAll }: HomeCategoryCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const [inView, setInView] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [focused, setFocused] = useState(false);
  // Bumped on manual navigation so the auto-slide timer restarts instead of jumping right after a click.
  const [manualNavCount, setManualNavCount] = useState(0);

  const group = MENU_GROUPS.find(item => item.id === (category.menuGroup || 'bakery')) || MENU_GROUPS[0];
  const isCombo = group.id === 'combo';
  const title = category.homeTitle?.trim() || category.name;
  const description = category.homeDescription?.trim();

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollBack(track.scrollLeft > 4);
    setCanScrollForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState, products.length]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Auto-advance one card at a time, looping back to the start; pauses while the visitor is
  // hovering, touching or tabbing through it, when it is off-screen, and for reduced motion.
  useEffect(() => {
    if (!inView || interacting || focused || products.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || document.hidden) return;
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      const card = track.firstElementChild as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: (card?.offsetWidth || track.clientWidth) + gap, behavior: 'smooth' });
    }, AUTO_SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [inView, interacting, focused, products.length, manualNavCount]);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
    setManualNavCount(count => count + 1);
  };

  // Five cards per view on desktop (three for the wider combo cards), with a peek of the next card on phones.
  const slideWidth = isCombo
    ? 'w-[85%] sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]'
    : 'w-[70%] sm:w-[calc((100%-1.5rem)/2)] md:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-6rem)/5)]';

  const arrowClass = 'flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-brand-blue shadow-sm transition hover:border-brand-blue hover:shadow disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-stone-200';

  return (
    <section
      ref={sectionRef}
      className={`py-12 sm:py-14 ${shaded ? 'bg-stone-50' : 'bg-white'}`}
      aria-labelledby={`home-category-${category.id}`}
      onPointerEnter={event => { if (event.pointerType === 'mouse') setInteracting(true); }}
      onPointerLeave={event => { if (event.pointerType === 'mouse') setInteracting(false); }}
      onFocus={() => setFocused(true)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">{group.eyebrow}</span>
            <h2 id={`home-category-${category.id}`} className="text-3xl font-extrabold tracking-tight text-brand-blue md:text-4xl">{title}</h2>
            {description && <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => onViewAll(category)} className="mr-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue transition hover:text-brand-gold">
              View all <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => scrollByPage(-1)} disabled={!canScrollBack} className={arrowClass} aria-label={`Previous ${title}`}><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => scrollByPage(1)} disabled={!canScrollForward} className={arrowClass} aria-label={`More ${title}`}><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={updateScrollState}
          onTouchStart={() => setInteracting(true)}
          onTouchEnd={() => setInteracting(false)}
          className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
        >
          {products.map((product, index) => (
            <div key={product.id} className={`shrink-0 snap-start ${slideWidth}`}>
              {isCombo
                ? <ComboCard product={product} index={index} onView={onProductClick} onAddToCart={onAddToCartDirectly} />
                : <ProductCard product={product} onProductClick={onProductClick} onAddToCartDirectly={onAddToCartDirectly} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
