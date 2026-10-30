import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  BadgeInfo,
  CalendarClock,
  ChevronDown,
  CircleHelp,
  Headphones,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

type FAQCategory = 'All' | 'Orders' | 'Freshness' | 'Safety' | 'Pickup';

interface FAQItem {
  id: string;
  category: Exclude<FAQCategory, 'All'>;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const CATEGORIES: FAQCategory[] = ['All', 'Orders', 'Freshness', 'Safety', 'Pickup'];

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Orders',
    icon: <CalendarClock className="h-5 w-5" aria-hidden="true" />,
    question: 'How far in advance should I pre-order a celebration cake?',
    answer: 'We recommend placing custom, multi-tier or fondant cake orders at least 3 to 5 days in advance. This gives our bakers enough time to prepare every handcrafted detail. Orders placed at least 5 days ahead can use CELEBRATE10 at checkout for a 10% discount.',
  },
  {
    id: 'faq-2',
    category: 'Freshness',
    icon: <BadgeInfo className="h-5 w-5" aria-hidden="true" />,
    question: 'When do you bake, and how can I get the freshest bakes?',
    answer: 'Our ovens start at 5:00 AM daily, with the first hot egg puffs, butter buns and sweet rolls available from 7:00 AM. We bake fresh batches of savoury pastries throughout the day so you can collect them warm and at their best.',
  },
  {
    id: 'faq-3',
    category: 'Safety',
    icon: <ShieldAlert className="h-5 w-5" aria-hidden="true" />,
    question: 'What is your food safety and allergen policy?',
    answer: 'Our products may contain wheat, gluten, dairy, eggs and nuts. Although we use careful preparation practices, cross-contamination may occur because our kitchens handle flour, peanuts and other allergens daily. Please review the product information or speak with branch staff before ordering if you have a severe allergy.',
  },
  {
    id: 'faq-4',
    category: 'Pickup',
    icon: <CircleHelp className="h-5 w-5" aria-hidden="true" />,
    question: 'Do I have to pay online, and how does branch pickup work?',
    answer: 'Online payment is not required. Build your basket, choose a pickup branch and place your reservation. When it is ready, visit the selected branch, show your TBH order reference and pay at the counter when collecting your freshly packed order.',
  },
  {
    id: 'faq-5',
    category: 'Orders',
    icon: <Sparkles className="h-5 w-5" aria-hidden="true" />,
    question: 'Can I change or cancel my custom cake booking?',
    answer: 'You can modify or cancel a booking free of charge up to 48 hours before the requested date. Changes inside 48 hours are subject to approval because custom ingredients and decorations may already be in preparation. Please call your pickup branch for urgent changes.',
  },
];

export default function FAQSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('All');
  const [query, setQuery] = useState('');
  const reduceMotion = useReducedMotion();

  const filteredFAQs = useMemo(() => {
    const search = query.trim().toLowerCase();
    return FAQS.filter(faq => {
      const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
      const matchesSearch = !search || `${faq.question} ${faq.answer}`.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, query]);

  return (
    <section className="relative overflow-hidden border-y border-stone-200 bg-[#faf9f7] py-16 sm:py-24" aria-labelledby="faq-title">
      <div className="pointer-events-none absolute -right-24 top-12 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-36 bottom-0 h-80 w-80 rounded-full bg-brand-blue/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-gold-dark shadow-sm">
              <CircleHelp className="h-4 w-4" aria-hidden="true" /> Help centre
            </span>
            <h2 id="faq-title" className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-blue sm:text-5xl lg:text-6xl">
              Questions, answered <span className="text-brand-gold-dark">fresh.</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-stone-600">
              Find quick answers about ordering, freshness, allergens and branch collection—before your next bake leaves the oven.
            </p>

            <div className="mt-8 rounded-3xl bg-brand-blue p-6 text-white shadow-[0_24px_60px_-30px_rgba(11,19,84,0.65)] sm:p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-brand-gold">
                <Headphones className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Need a human touch?</h3>
              <p className="mt-2 text-sm leading-6 text-blue-100/75">
                Our branch team can help with custom cakes, catering packages and time-sensitive changes.
              </p>
              <a
                href="tel:0777259245"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-extrabold text-brand-blue transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue"
              >
                Call 077 725 9245 <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <div className="rounded-3xl border border-stone-200 bg-white p-3 shadow-[0_20px_60px_-42px_rgba(28,25,23,0.45)] sm:p-4">
              <label htmlFor="faq-search" className="sr-only">Search frequently asked questions</label>
              <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-stone-100 px-4 focus-within:ring-2 focus-within:ring-brand-gold/70">
                <Search className="h-5 w-5 shrink-0 text-stone-500" aria-hidden="true" />
                <input
                  id="faq-search"
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search orders, allergens, pickup…"
                  className="min-w-0 flex-1 bg-transparent py-3 text-base text-stone-900 outline-none placeholder:text-stone-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 transition hover:bg-white hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                    aria-label="Clear FAQ search"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="FAQ categories">
              {CATEGORIES.map(category => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    aria-pressed={isActive}
                    className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 ${
                      isActive
                        ? 'border-brand-blue bg-brand-blue text-white shadow-sm'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-brand-gold/60 hover:text-brand-blue'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              {filteredFAQs.map((faq, index) => {
                const isOpen = openId === faq.id;
                const panelId = `${faq.id}-panel`;
                const buttonId = `${faq.id}-button`;
                return (
                  <motion.article
                    key={faq.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: reduceMotion ? 0 : index * 0.035 }}
                    className={`overflow-hidden rounded-2xl border bg-white transition-colors duration-200 ${
                      isOpen ? 'border-brand-gold/70 shadow-[0_16px_40px_-30px_rgba(161,98,7,0.65)]' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                        className="group flex min-h-20 w-full items-center gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue sm:p-6"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                      >
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${isOpen ? 'bg-brand-gold text-brand-blue' : 'bg-stone-100 text-stone-600 group-hover:bg-brand-gold/15 group-hover:text-brand-gold-dark'}`}>
                          {faq.icon}
                        </span>
                        <span className="flex-1">
                          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-gold-dark">{faq.category}</span>
                          <span className="block text-base font-extrabold leading-6 text-brand-blue sm:text-lg">{faq.question}</span>
                        </span>
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${isOpen ? 'rotate-180 border-brand-gold bg-brand-gold/10 text-brand-gold-dark' : 'border-stone-200 text-stone-500 group-hover:border-brand-blue/20 group-hover:text-brand-blue'}`}>
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </button>
                    </h3>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          animate={reduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                          exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <p className="border-t border-stone-100 px-5 pb-6 pt-5 text-base leading-7 text-stone-600 sm:ml-[84px] sm:px-6 sm:pt-5">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}

              {filteredFAQs.length === 0 && (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
                  <Search className="mx-auto h-7 w-7 text-stone-400" aria-hidden="true" />
                  <h3 className="mt-3 text-lg font-extrabold text-brand-blue">No matching answers</h3>
                  <p className="mt-2 text-sm text-stone-600">Try another phrase or view all questions.</p>
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setActiveCategory('All'); }}
                    className="mt-5 min-h-11 rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-blue-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
