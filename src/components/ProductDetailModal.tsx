import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, MessageSquare, BadgeCheck, CircleHelp } from 'lucide-react';
import { Product, CartItem } from '../types';
import { useSiteSettings } from './SiteSettingsContext';
import { formatMoney } from '../siteSettings';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
}

export default function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  if (!product) return null;

  return <ProductDetailContent product={product} onClose={onClose} onAddToCart={onAddToCart} />;
}

function ProductDetailContent({ product, onClose, onAddToCart }: Omit<ProductDetailModalProps, 'product'> & { product: Product }) {
  const settings = useSiteSettings();

  const [selectedType, setSelectedType] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');

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
    const firstPackage = product.productType === 'food'
      ? product.variants?.find(variant => Number(variant.servesPersons) > 0 && Number(variant.price) > 0 && variant.stockStatus !== 'out_of_stock')
      : product.variants?.[0];
    setSelectedVariantId(firstPackage?.id || '');
  }, [product]);

  const selectedVariant = product.variants?.find(variant => variant.id === selectedVariantId);
  const isCombo = product.productType === 'combo';
  const comboItems = isCombo ? (product.comboItems || []) : [];
  const comboRegularPrice = Number(product.regularPrice ?? product.priceMin ?? 0);
  const comboSavings = isCombo ? Math.max(0, comboRegularPrice - Number(product.priceMin ?? 0)) : 0;
  const foodPackages = React.useMemo(() => product.productType === 'food'
    ? (product.variants || []).filter(variant => Number(variant.servesPersons) > 0 && Number(variant.price) > 0)
    : [], [product]);

  // Compute final price from a Woo/manual variant, or from legacy cake weight options.
  const currentPrice = React.useMemo(() => {
    let price = selectedVariant ? Number(selectedVariant.salePrice ?? selectedVariant.price) : product.priceMin;
    if (product.productType === 'food') return price;
    if (product.isCustomizable && product.weights && selectedWeight) {
      const idx = product.weights.indexOf(selectedWeight);
      if (idx > 0) {
        // Simple realistic formula for cake weight upcharges
        price += idx * 6.50;
      }
    }
    return price;
  }, [product, selectedWeight, selectedVariant]);

  const handleAddToCart = () => {
    if (product.productType === 'food' && (!selectedVariant || Number(selectedVariant.servesPersons) < 1 || selectedVariant.stockStatus === 'out_of_stock')) {
      setFormError(foodPackages.length ? 'Please choose a bulk order package.' : 'This food item does not have an available bulk order package yet.');
      return;
    }
    if (product.productType !== 'food' && product.variants?.length && !selectedVariant) {
      setFormError('Please choose a product option.');
      return;
    }
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
      customizations: product.isCustomizable || selectedVariant || product.productType === 'food' ? {
        cakeType: selectedType,
        weight: selectedWeight,
        deliveryDate,
        message: customMessage,
        variantId: selectedVariant?.id,
        variantLabel: product.productType === 'food' && selectedVariant ? `Serves ${selectedVariant.servesPersons} people` : selectedVariant?.attributes.map(attribute => `${attribute.name}: ${attribute.option}`).join(' · '),
        servesPersons: product.productType === 'food' ? selectedVariant?.servesPersons : undefined,
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
            <div className="flex flex-wrap items-baseline gap-2 mb-6">
              <span className="text-[#343EAF] font-bold font-mono text-xl md:text-2xl">
                {formatMoney(currentPrice, settings)}
              </span>
              {comboSavings > 0 && (
                <>
                  <span className="font-mono text-sm text-gray-400 line-through">{formatMoney(comboRegularPrice, settings)}</span>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-1 font-mono text-[11px] font-black text-white">
                    Save {formatMoney(comboSavings, settings)}
                  </span>
                </>
              )}
              {product.isCustomizable && product.priceMax && (
                <span className="text-xs text-gray-400 font-medium">
                  (Custom options range: {formatMoney(product.priceMin, settings)} - {formatMoney(product.priceMax, settings)})
                </span>
              )}
            </div>

            {/* Product details — the modal shows this alone now that Info and Reviews are gone */}
            <div className="min-h-[140px] mb-6">
              <div className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                  {isCombo && comboItems.length > 0 && (
                    <div className="rounded-2xl border border-brand-gold/35 bg-[#FFFCF5] p-4">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">Inside this combo</p>
                      <ul className="space-y-2">
                        {comboItems.map((item, itemIndex) => (
                          <li key={`${item.productId}-${itemIndex}`} className="flex items-center justify-between gap-3 text-xs text-stone-700">
                            <span className="flex min-w-0 items-center gap-2.5">
                              <span className="min-w-[34px] shrink-0 rounded-md bg-brand-blue/10 px-1.5 py-0.5 text-center font-mono text-[11px] font-bold text-brand-blue">{item.quantity}×</span>
                              <span className="truncate font-semibold">{item.name}</span>
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-stone-400">
                              {formatMoney(Number(item.quantity) * Number(item.unitPrice), settings)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center justify-between border-t border-dashed border-brand-gold/35 pt-3 text-xs">
                        <span className="font-semibold text-stone-500">Combined item value</span>
                        <span className="font-mono font-bold text-stone-500 line-through">{formatMoney(comboRegularPrice, settings)}</span>
                      </div>
                    </div>
                  )}
                  {product.productType !== 'food' && product.variants && product.variants.length > 0 && <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4"><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-blue">Choose an option *</label><select value={selectedVariantId} onChange={event => setSelectedVariantId(event.target.value)} className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2.5 text-sm font-semibold text-stone-700"><option value="">Choose an option</option>{product.variants.map(variant => <option key={variant.id} value={variant.id} disabled={variant.stockStatus === 'out_of_stock'}>{variant.attributes.map(attribute => `${attribute.name}: ${attribute.option}`).join(' · ') || variant.sku || 'Variant'} — {formatMoney(Number(variant.salePrice ?? variant.price), settings)}{variant.stockStatus === 'out_of_stock' ? ' (Out of stock)' : ''}</option>)}</select></div>}
                  {product.productType === 'food' && <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-amber-900">Bulk food order</p><p className="mt-1 text-[10px] text-amber-800">Choose the package for your group. Preparation time is approximately {product.preparationMinutes || settings.foodOrdering.defaultPreparationMinutes} minutes.</p></div><span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-amber-800">ASAP / Schedule</span></div>{foodPackages.length ? <fieldset><legend className="mb-2 text-xs font-bold text-stone-700">How many people? *</legend><div className="grid grid-cols-2 gap-2">{foodPackages.map(variant => { const checked = selectedVariantId === variant.id; return <label key={variant.id} className={`cursor-pointer rounded-xl border p-3 text-center ${checked ? 'border-brand-gold bg-white font-bold text-amber-900 shadow-sm' : 'border-amber-100 bg-white/70 text-stone-600'} ${variant.stockStatus === 'out_of_stock' ? 'cursor-not-allowed opacity-50' : ''}`}><input type="radio" name="bulk-package" value={variant.id} checked={checked} disabled={variant.stockStatus === 'out_of_stock'} onChange={() => setSelectedVariantId(variant.id)} className="sr-only" /><span className="block text-sm font-black">{variant.servesPersons} people</span><span className="mt-1 block text-xs text-brand-blue">{formatMoney(Number(variant.price), settings)}</span></label>; })}</div></fieldset> : <p className="rounded-xl border border-dashed border-amber-300 bg-white p-3 text-xs font-semibold text-amber-900">Bulk packages are not configured for this item yet.</p>}</div>}
                  
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
                        {product.productType === 'food'
                          ? 'Bulk food orders are prepared for the selected number of people. Choose a package above, then select ASAP or a scheduled time during checkout.'
                          : isCombo
                          ? 'Every item listed above is included in this combo and packed together at the single combo price.'
                          : 'This item is freshly baked daily. No pre-ordering or customization required! It will be prepared and packed for immediate checkout.'}
                      </div>
                    </div>
                  )}
              </div>
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
              disabled={product.productType === 'food' && !foodPackages.some(variant => variant.stockStatus !== 'out_of_stock')}
              className="w-full py-3.5 bg-[#343EAF] hover:bg-[#252E90] text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Add to Cart</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-40" />
              <span>{formatMoney(currentPrice, settings)}</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
