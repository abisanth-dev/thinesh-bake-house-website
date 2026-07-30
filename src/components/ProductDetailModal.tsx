import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Star, Calendar, MessageSquare, ShieldAlert, BadgeCheck, CircleHelp } from 'lucide-react';
import { Product, CartItem } from '../types';
import { MOCK_REVIEWS } from '../data';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
}

type TabType = 'details' | 'reviews' | 'additional';

export default function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  if (!product) return null;

  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [selectedType, setSelectedType] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [formError, setFormError] = useState('');

  // Auto-select first options if available
  useEffect(() => {
    if (product.cakeTypes && product.cakeTypes.length > 0) {
      setSelectedType(product.cakeTypes[0]);
    }
    if (product.weights && product.weights.length > 0) {
      setSelectedWeight(product.weights[0]);
    }
    setDeliveryDate('');
    setCustomMessage('');
    setFormError('');
    setActiveTab('details');
  }, [product]);

  // Compute final price based on selected weight
  const currentPrice = React.useMemo(() => {
    let price = product.priceMin;
    if (product.isCustomizable && product.weights && selectedWeight) {
      const idx = product.weights.indexOf(selectedWeight);
      if (idx > 0) {
        // Simple realistic formula for cake weight upcharges
        price += idx * 6.50;
      }
    }
    return price;
  }, [product, selectedWeight]);

  const handleAddToCart = () => {
    if (product.isCustomizable) {
      if (!selectedType) {
        setFormError('Please choose a Cake Type.');
        return;
      }
      if (!selectedWeight) {
        setFormError('Please choose a Weight.');
        return;
      }
      if (!deliveryDate) {
        setFormError('Please specify a Delivery Date.');
        return;
      }
    }

    onAddToCart({
      product,
      quantity: 1,
      selectedPrice: currentPrice,
      customizations: product.isCustomizable ? {
        cakeType: selectedType,
        weight: selectedWeight,
        deliveryDate,
        message: customMessage
      } : undefined
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Modal Main Panel */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-black hover:rotate-90 transition-all duration-300 shadow-sm cursor-pointer"
          aria-label="Close details"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Product Image Display */}
        <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center relative p-6 border-b md:border-b-0 md:border-r border-gray-100 min-h-[280px]">
          <div className="absolute inset-0 bg-radial from-brand-blue/5 via-transparent to-transparent opacity-60" />
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full max-h-[380px] object-cover rounded-xl shadow-md border border-gray-200"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Right Side: Product Customization Panel */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header / Title */}
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-blue font-display tracking-tight leading-none uppercase mb-1">
              {product.name}
            </h2>
            
            {/* Price section */}
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-[#343EAF] font-bold font-mono text-xl md:text-2xl">
                {product.isCustomizable 
                  ? `$${currentPrice.toFixed(2)}` 
                  : `$${product.priceMin.toFixed(2)}`
                }
              </span>
              {product.isCustomizable && product.priceMax && (
                <span className="text-xs text-gray-400 font-medium">
                  (Custom options range: ${product.priceMin.toFixed(2)} - ${product.priceMax.toFixed(2)})
                </span>
              )}
            </div>

            {/* Custom Interactive Tabs selector */}
            <div className="flex border-b border-gray-150 mb-6 bg-gray-50 p-1 rounded-lg">
              {(['details', 'reviews', 'additional'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#343EAF] text-white shadow-xs'
                      : 'text-gray-500 hover:text-brand-blue hover:bg-gray-200/50'
                  }`}
                >
                  {tab === 'additional' ? 'Info' : tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="min-h-[140px] mb-6">
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                  
                  {/* Customization Fields Form (Show only if customizable cake) */}
                  {product.isCustomizable ? (
                    <div className="space-y-4 mt-6 border-t border-gray-100 pt-4">
                      {/* Cake Type Dropdown */}
                      {product.cakeTypes && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span>Cake Type:</span>
                            <span className="text-red-500 font-bold">*</span>
                          </label>
                          <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full bg-white text-gray-800 text-sm py-2 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#343EAF] focus:ring-1 focus:ring-[#343EAF]/20"
                          >
                            <option value="">Choose an option</option>
                            {product.cakeTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Weight Dropdown */}
                      {product.weights && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span>Weight / Size:</span>
                            <span className="text-red-500 font-bold">*</span>
                          </label>
                          <select
                            value={selectedWeight}
                            onChange={(e) => setSelectedWeight(e.target.value)}
                            className="w-full bg-white text-gray-800 text-sm py-2 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#343EAF] focus:ring-1 focus:ring-[#343EAF]/20"
                          >
                            <option value="">Choose an option</option>
                            {product.weights.map((wt) => (
                              <option key={wt} value={wt}>{wt}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Delivery Date Picker */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>Delivery Date:</span>
                          <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          type="date"
                          value={deliveryDate}
                          min={new Date().toISOString().split('T')[0]} // prevent past dates
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full bg-white text-gray-800 text-sm py-2 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#343EAF]"
                        />
                      </div>

                      {/* Custom Message input */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                          <span>Message on Cake:</span>
                          <span className="text-gray-400 text-[10px] lowercase italic">(Optional)</span>
                        </label>
                        <textarea
                          placeholder="E.g., Happy 25th Birthday Amanda!"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          rows={2}
                          maxLength={60}
                          className="w-full bg-white text-gray-800 text-sm py-2.5 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#343EAF] focus:ring-1 focus:ring-[#343EAF]/20 resize-none"
                        />
                        <div className="flex justify-end text-[10px] text-gray-400 font-mono mt-0.5">
                          {customMessage.length}/60 characters
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 p-4 rounded-xl bg-gray-50 border border-gray-150 flex items-center gap-3">
                      <BadgeCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <div className="text-xs text-gray-500 leading-snug">
                        This item is freshly baked daily. No pre-ordering or customization required! It will be prepared and packed for immediate checkout.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                  <div className="flex items-center gap-2 mb-2 bg-brand-blue/5 p-3 rounded-lg border border-brand-blue/5">
                    <span className="text-xl font-bold text-brand-blue">4.8</span>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 font-medium ml-auto">Based on 12 reviews</span>
                  </div>

                  {MOCK_REVIEWS.map((review, idx) => (
                    <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800">{review.author}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{review.date}</span>
                      </div>
                      <div className="flex text-amber-400 mb-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 italic leading-snug">
                        "{review.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'additional' && (
                <div className="space-y-4 text-xs text-gray-500 leading-relaxed">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                      <span className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Allergens</span>
                      Contains wheat gluten, dairy, butter, eggs. May contain traces of cashews and peanuts.
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                      <span className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Storage</span>
                      Keep refrigerated between 2°C and 4°C. Best consumed within 48 hours of purchase.
                    </div>
                  </div>

                  <div className="p-3 bg-[#FCF8E3] rounded-lg border border-[#FBEED5] text-[#8A6D3B] flex items-start gap-2.5">
                    <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Custom Cake Notice</span>
                      Custom icing and details are handcrafted by our master bakers. Slight variations in color shade or decoration layout may occur as part of the authentic artisanal baking process.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer of panel: error message & Add To Cart action */}
          <div className="mt-auto border-t border-gray-150 pt-4">
            {formError && (
              <div className="mb-3 px-3 py-2 bg-red-50 text-red-600 text-xs font-semibold rounded-md flex items-center gap-1.5 border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                {formError}
              </div>
            )}
            
            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 bg-[#343EAF] hover:bg-[#252E90] text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Add to Cart</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-40" />
              <span>${product.isCustomizable ? currentPrice.toFixed(2) : product.priceMin.toFixed(2)}</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
