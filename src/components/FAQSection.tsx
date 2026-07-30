import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, BadgeInfo, CalendarClock, ShieldAlert, Sparkles } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

export default function FAQSection() {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      icon: <CalendarClock className="h-5 w-5 text-brand-gold flex-shrink-0" />,
      question: 'How far in advance should I pre-order custom celebration cakes?',
      answer: 'We recommend placing orders for custom, multi-tier, or fondant cakes at least 3 to 5 days in advance. This gives our master bakers enough time to handcraft details. If you pre-order at least 5 days in advance, you can enjoy a 10% discount on your cake using the promo code CELEBRATE10 during checkout!'
    },
    {
      id: 'faq-2',
      icon: <BadgeInfo className="h-5 w-5 text-brand-gold flex-shrink-0" />,
      question: 'When do you bake? How do I get hot, fresh bakes?',
      answer: 'Our ovens start at 5:00 AM daily, and the first batch of hot Ceylon spicy egg puffs, fresh premium butter buns, and sweet jam rolls hit the shelves by 7:00 AM across all branches. We bake fresh batches of savory pastries every single hour to ensure that whenever you step in, you experience the absolute best golden fluffiness.'
    },
    {
      id: 'faq-3',
      icon: <ShieldAlert className="h-5 w-5 text-brand-gold flex-shrink-0" />,
      question: 'What is your food safety and allergen policy?',
      answer: 'Our products contain premium ingredients including wheat gluten, dairy butter, fresh cream, eggs, and occasionally nuts (such as cashews and almonds). We maintain separate prep stations for specialized requests, but cross-contamination may occur since our main baking environment processes flour and peanuts daily. Please review the "Info" tab on any menu product or ask our branch staff if you have severe allergies.'
    },
    {
      id: 'faq-4',
      icon: <HelpCircle className="h-5 w-5 text-brand-gold flex-shrink-0" />,
      question: 'Do I have to pay online? How does branch pick-up work?',
      answer: 'No online payment is required! Our system allows you to build your basket, customize your dream birthday cakes, and choose your preferred pick-up branch. Once your reservation is placed, our kitchen schedules your baking. You simply walk into your chosen branch, verify your order reference code (#TBH-XXXX), and pay directly at the counter upon receiving your freshly-boxed treats!'
    },
    {
      id: 'faq-5',
      icon: <Sparkles className="h-5 w-5 text-brand-gold flex-shrink-0" />,
      question: 'Can I change or cancel my custom cake booking?',
      answer: 'Yes! You can modify or cancel your booking free of charge up to 48 hours before your specified delivery date. Because custom cakes require preparation of specific ingredients and edible figures, modifications requested within 48 hours are subject to approval. Please call your chosen pickup branch directly to make any urgent changes.'
    }
  ];

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-16 bg-white border-b border-gray-100">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center mb-12">
          <span className="text-[10px] font-mono font-bold text-[#343EAF] uppercase tracking-widest bg-[#343EAF]/5 px-3 py-1.5 rounded-full inline-block mb-3.5">
            Baking Guidelines & Support
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1354] font-display uppercase tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Everything you need to know about custom design orders, baking schedules, pickup locations, and ingredients.
          </p>
        </div>

        {/* Accordion Layout */}
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? 'border-[#0B1354] bg-[#0B1354]/[0.01] shadow-xs'
                    : 'border-gray-200 hover:border-brand-gold/40 hover:bg-gray-50/40'
                }`}
              >
                {/* Accordion Toggle Bar */}
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left focus:outline-none cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-4">
                    {/* SVG Icon Accent */}
                    <div className="mt-0.5">{faq.icon}</div>
                    
                    <span className={`font-bold text-sm md:text-base tracking-tight transition-colors ${
                      isOpen ? 'text-[#0B1354]' : 'text-gray-800 group-hover:text-[#0B1354]'
                    }`}>
                      {faq.question}
                    </span>
                  </div>
                  
                  {/* Rotating Chevron down indicator */}
                  <div className={`p-1.5 rounded-full bg-gray-50 text-gray-400 group-hover:text-[#0B1354] transition-all ${
                    isOpen ? 'rotate-180 bg-brand-gold/10 text-brand-gold' : ''
                  }`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {/* Animated content expansion */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-6 md:px-6 md:pb-7 pl-13 md:pl-15 text-xs md:text-sm text-gray-500 leading-relaxed border-t border-gray-100/50 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Mini CTA Footer */}
        <div className="mt-12 p-5 bg-[#FAF6F0] rounded-2xl border border-stone-250/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="text-xs text-stone-600">
            <strong>Still have questions about special catering?</strong> Contact your local master branch directly for custom wedding cakes or corporate sweet treat catering packages.
          </div>
          <a
            href="tel:0777259245"
            className="flex-shrink-0 px-4 py-2 bg-[#0B1354] hover:bg-brand-blue-light text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Direct Inquiry
          </a>
        </div>

      </div>
    </section>
  );
}
