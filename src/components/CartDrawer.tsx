import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingCart, ShoppingBag, MapPin, Sparkles, CheckCircle, CreditCard, Landmark, Banknote } from 'lucide-react';
import { CartItem, Order, PaymentMethod, Product } from '../types';
import { BRANCHES } from '../data';
import { useSiteSettings } from './SiteSettingsContext';
import { formatMoney } from '../siteSettings';
import { availablePaymentMethods, genieChargeInLkr, isPaymentMethodAvailable } from '../paymentMethods';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOrderPlaced?: (order: Order) => void;
  products: Product[];
  onAddSuggestedProduct: (product: Product) => void;
}

const COUNTRIES = ['Sri Lanka', 'India', 'United Kingdom', 'Australia', 'Canada', 'United States', 'Germany', 'France', 'Italy', 'Switzerland', 'United Arab Emirates', 'Qatar', 'Saudi Arabia', 'Singapore', 'Malaysia', 'New Zealand', 'Japan', 'South Korea'];
const isSriLankanPhone = (value: string) => /^(?:0\d{9}|94\d{9}|\+94\d{9})$/.test(value.replace(/[\s()-]/g, ''));
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
const colomboClock = () => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find(part => part.type === 'weekday')?.value || '');
  return { weekday, time: `${parts.find(part => part.type === 'hour')?.value}:${parts.find(part => part.type === 'minute')?.value}` };
};

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  products,
  onAddSuggestedProduct,
}: CartDrawerProps) {
  const settings = useSiteSettings();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  
  // Checkout flow state
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'success'>('cart');
  const [checkoutFormStep, setCheckoutFormStep] = useState<0 | 1 | 2 | 3>(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCountry, setBillingCountry] = useState('Sri Lanka');
  const [selectedBranchId, setSelectedBranchId] = useState(BRANCHES[0].id);
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>(settings.delivery.storePickupEnabled ? 'pickup' : 'delivery');
  const [pickupPersonName, setPickupPersonName] = useState('');
  const [pickupPersonPhone, setPickupPersonPhone] = useState('');
  const [billingPersonIsPickupPerson, setBillingPersonIsPickupPerson] = useState(false);
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryCountry, setDeliveryCountry] = useState('Sri Lanka');
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('11:00');
  const [orderMode, setOrderMode] = useState<'asap' | 'scheduled'>('scheduled');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  // Keep the selection on a method the shop currently offers (e.g. when cash on delivery is switched off).
  const paymentOptions = availablePaymentMethods(settings.payments);
  React.useEffect(() => {
    if (paymentOptions.length && !paymentOptions.includes(paymentMethod)) setPaymentMethod(paymentOptions[0]);
  }, [paymentOptions.join(','), paymentMethod]);
  const [orderNotes, setOrderNotes] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);

  // Compute Subtotal
  const subtotal = React.useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0);
  }, [cartItems]);

  const tax = React.useMemo(() => settings.store.pricesIncludeTax ? 0 : subtotal * (settings.store.taxPercentage / 100), [subtotal, settings.store.pricesIncludeTax, settings.store.taxPercentage]);
  const money = (value: number) => formatMoney(value, settings);
  const matchedDeliveryArea = React.useMemo(() => settings.delivery.areas.find(area => area.name.toLowerCase() === deliveryCity.trim().toLowerCase() || (deliveryPostalCode && area.postalCodes.includes(deliveryPostalCode.trim()))), [deliveryCity, deliveryPostalCode, settings.delivery.areas]);
  const shippingFee = React.useMemo(() => fulfillment === 'delivery' && settings.delivery.enabled && !(settings.delivery.freeDeliveryMinimum > 0 && subtotal >= settings.delivery.freeDeliveryMinimum) ? (matchedDeliveryArea?.charge ?? settings.delivery.defaultFee) : 0, [fulfillment, settings.delivery.enabled, settings.delivery.freeDeliveryMinimum, settings.delivery.defaultFee, subtotal, matchedDeliveryArea]);
  const containsFood = cartItems.some(item => item.product.productType === 'food');
  const containsBakery = cartItems.some(item => item.product.productType !== 'food');
  const orderType: Order['orderType'] = containsFood && containsBakery ? 'mixed' : containsFood ? 'food' : 'bakery';
  const maximumPreparationMinutes = Math.max(settings.foodOrdering.asapBufferMinutes, ...cartItems.filter(item => item.product.productType === 'food').map(item => item.product.preparationMinutes || settings.foodOrdering.defaultPreparationMinutes));
  const currentKitchenClock = colomboClock();
  const kitchenOpenNow = settings.foodOrdering.enabled && !settings.foodOrdering.temporarilyClosed && settings.foodOrdering.openingDays.includes(currentKitchenClock.weekday) && currentKitchenClock.time >= settings.foodOrdering.openTime && currentKitchenClock.time <= settings.foodOrdering.lastOrderTime;
  const allFoodAllowsAsap = cartItems.filter(item => item.product.productType === 'food').every(item => item.product.allowAsap !== false);
  const allFoodAllowsScheduled = cartItems.filter(item => item.product.productType === 'food').every(item => item.product.allowScheduled !== false);
  const asapAvailable = containsFood && !containsBakery && settings.foodOrdering.allowAsap && allFoodAllowsAsap && kitchenOpenNow;
  const earliestAsapAt = new Date(Date.now() + maximumPreparationMinutes * 60_000);
  const latestItemDate = cartItems.reduce((latest, item) => item.customizations?.deliveryDate && item.customizations.deliveryDate > latest ? item.customizations.deliveryDate : latest, '');
  const earliestScheduledDate = latestItemDate > today() ? latestItemDate : today();
  const suggestedProducts = React.useMemo(() => {
    const selectedIds = new Set(cartItems.map(item => item.product.id));
    const categories = new Set(cartItems.flatMap(item => [item.product.category, ...(item.product.categories || [])]).map(value => value.toLowerCase()));
    const related = products.filter(product => !selectedIds.has(product.id) && !product.checkoutDisabled && [product.category, ...(product.categories || [])].some(category => categories.has(category.toLowerCase())));
    const fallback = products.filter(product => !selectedIds.has(product.id) && !product.checkoutDisabled && !related.some(item => item.id === product.id));
    return [...related, ...fallback].slice(0, 3);
  }, [cartItems, products]);
  // Cart items are saved in the browser, so re-check them against the live catalogue in case an
  // admin switched checkout off for their category after they were added.
  const unavailableItems = cartItems.filter(item => products.find(product => product.id === item.product.id)?.checkoutDisabled);

  React.useEffect(() => {
    if (!sameAsBilling) return;
    setDeliveryName(customerName);
    setDeliveryPhone(customerPhone);
    setDeliveryStreet(billingAddress);
    setDeliveryCountry(billingCountry);
  }, [sameAsBilling, customerName, customerPhone, billingAddress, billingCountry]);

  React.useEffect(() => {
    if (!billingPersonIsPickupPerson) return;
    setPickupPersonName(customerName);
    setPickupPersonPhone(customerPhone);
  }, [billingPersonIsPickupPerson, customerName, customerPhone]);

  React.useEffect(() => {
    if (!isOpen) setCheckoutFormStep(0);
  }, [isOpen]);

  React.useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [checkoutFormStep]);

  // Compute final discounted total
  const finalTotal = React.useMemo(() => {
    const total = subtotal + tax + shippingFee - appliedDiscount;
    return Math.max(0, total);
  }, [subtotal, tax, shippingFee, appliedDiscount]);
  // Genie charges in rupees, so a non-LKR store shows the converted amount before the customer pays.
  const genieChargeLkr = paymentMethod === 'dialog_genie' && settings.store.currency.trim().toUpperCase() !== 'LKR' ? genieChargeInLkr(finalTotal, settings) : null;

  const handleApplyPromo = async () => {
    setPromoError('');
    setPromoSuccess('');
    const code = promoCode.trim().toUpperCase();

    if (!code) {
      setPromoError('Please enter a coupon code.');
      return;
    }

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartSubtotal: subtotal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedDiscount(data.discountAmount);
        setAppliedCouponCode(data.coupon.code);
        setPromoSuccess(`Coupon ${data.coupon.code} applied! (-${money(data.discountAmount)})`);
      } else {
        setPromoError(data.error || 'Invalid or expired coupon code.');
      }
    } catch (err) {
      setPromoError('Could not validate coupon.');
    }
  };

  const billingError = () => !customerName.trim() || !customerPhone.trim() || !billingAddress.trim() || !billingCountry
    ? 'Please complete all required billing details.'
    : null;

  const fulfillmentError = () => {
    if (fulfillment === 'pickup') return !pickupPersonName.trim() || !pickupPersonPhone.trim() ? 'Please enter the pickup person’s name and contact number.' : null;
    if (!deliveryName.trim() || !deliveryPhone.trim() || !deliveryStreet.trim() || !deliveryCity.trim() || !deliveryCountry) return 'Please complete all required delivery details.';
    if (!isSriLankanPhone(deliveryPhone)) return 'The delivery contact must be a valid Sri Lankan number.';
    return null;
  };

  const continueCheckout = () => {
    if (unavailableItems.length > 0) return;
    if (checkoutFormStep === 0) return setCheckoutFormStep(1);
    const error = checkoutFormStep === 1 ? billingError() : fulfillmentError();
    if (error) return alert(error);
    setCheckoutFormStep(current => Math.min(3, current + 1) as 1 | 2 | 3);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unavailableItems.length > 0) return;
    const detailsError = billingError() || fulfillmentError();
    if (detailsError) { alert(detailsError); return; }
    if (subtotal < settings.store.minimumOrderAmount) {
      alert(`The minimum order amount is ${money(settings.store.minimumOrderAmount)}.`); return;
    }
    if (settings.store.maximumOrderAmount > 0 && subtotal > settings.store.maximumOrderAmount) {
      alert(`The maximum online order amount is ${money(settings.store.maximumOrderAmount)}.`); return;
    }
    if (fulfillment === 'delivery' && (!deliveryName || !deliveryPhone || !deliveryStreet || !deliveryCity || !deliveryCountry)) {
      alert('Please complete all required delivery details.'); return;
    }
    if (fulfillment === 'delivery' && !isSriLankanPhone(deliveryPhone)) {
      alert('The delivery contact must be a valid Sri Lankan number.'); return;
    }
    if (fulfillment === 'pickup' && (!pickupPersonName || !pickupPersonPhone)) {
      alert('Please enter the pickup person’s name and contact number.'); return;
    }
    if (containsFood && (!settings.foodOrdering.enabled || settings.foodOrdering.temporarilyClosed)) {
      alert(settings.foodOrdering.closedMessage); return;
    }
    if (containsFood && orderMode === 'asap' && !asapAvailable) {
      alert('ASAP is not available for this cart. Please schedule the order.'); return;
    }
    if ((orderMode === 'scheduled' || !containsFood) && (!deliveryDate || !deliveryTime || deliveryDate < earliestScheduledDate)) {
      alert('Select a valid order date and time.'); return;
    }
    if (containsFood && orderMode === 'scheduled') {
      const scheduledDay = new Date(`${deliveryDate}T12:00:00+05:30`).getDay();
      if (!settings.foodOrdering.allowScheduled || !allFoodAllowsScheduled || !settings.foodOrdering.openingDays.includes(scheduledDay) || deliveryTime < settings.foodOrdering.openTime || deliveryTime > settings.foodOrdering.lastOrderTime) {
        alert(`Food orders must be scheduled on an open day between ${settings.foodOrdering.openTime} and ${settings.foodOrdering.lastOrderTime}.`); return;
      }
      if (new Date(`${deliveryDate}T${deliveryTime}:00+05:30`).getTime() < earliestAsapAt.getTime()) {
        alert(`Please allow at least ${maximumPreparationMinutes} minutes for kitchen preparation.`); return;
      }
    } else if (!containsFood && deliveryTime < '11:00') {
      alert('Select a time from 11:00 AM onward.'); return;
    }
    if (fulfillment === 'delivery' && settings.delivery.postalCodeCheckEnabled && !matchedDeliveryArea) {
      alert('Delivery is not currently available for that city or postal code.'); return;
    }

    setIsSubmitting(true);
    const selectedBranch = fulfillment === 'delivery' ? 'Home Delivery' : (BRANCHES.find(b => b.id === selectedBranchId)?.name || BRANCHES[0].name);

    const asapDate = earliestAsapAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
    const asapTimeParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(earliestAsapAt);
    const asapTime = `${asapTimeParts.find(part => part.type === 'hour')?.value}:${asapTimeParts.find(part => part.type === 'minute')?.value}`;
    const fulfillmentDate = orderMode === 'asap' && containsFood ? asapDate : deliveryDate;
    const fulfillmentTime = orderMode === 'asap' && containsFood ? asapTime : deliveryTime;
    const requestedFulfillmentAt = orderMode === 'asap' && containsFood ? earliestAsapAt.toISOString() : `${fulfillmentDate}T${fulfillmentTime}:00+05:30`;
    const orderPayload = {
      customerName,
      customerEmail: customerEmail || 'guest@thineshbakehouse.lk',
      customerPhone,
      pickupBranch: selectedBranch,
      pickupPerson: fulfillment === 'pickup' ? { fullName: pickupPersonName, phone: pickupPersonPhone } : undefined,
      billingAddress: { fullName: customerName, phone: customerPhone, street: billingAddress, city: '', country: billingCountry },
      shippingAddress: fulfillment === 'delivery' ? { fullName: deliveryName, phone: deliveryPhone, street: deliveryStreet, city: deliveryCity, postalCode: deliveryPostalCode || undefined, country: deliveryCountry } : undefined,
      deliveryDate: fulfillmentDate,
      deliveryTime: fulfillmentTime,
      orderMode: containsFood ? orderMode : 'scheduled',
      requestedFulfillmentAt,
      orderType,
      items: cartItems.map(item => ({
        id: item.id,
        productId: item.product.id,
        name: item.product.name,
        price: item.selectedPrice,
        quantity: item.quantity,
        image: item.product.image,
        productType: item.product.productType || 'bakery',
        comboItems: item.product.productType === 'combo' ? item.product.comboItems : undefined,
        customizations: item.customizations
      })),
      subtotal,
      tax,
      shippingFee,
      discountAmount: appliedDiscount,
      couponCode: appliedCouponCode,
      total: finalTotal,
      paymentMethod,
      paymentStatus: 'unpaid',
      status: 'pending_payment' as const,
      orderNotes
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (res.ok && data.paymentUrl) {
        // Card payment: continue on Genie's secure page. The cart is kept until Genie confirms the
        // payment, so a cancelled payment can simply be tried again.
        setIsRedirectingToPayment(true);
        window.location.href = data.paymentUrl;
        return;
      }
      if (res.ok && data.order) {
        setPlacedOrder(data.order);
        if (onOrderPlaced) onOrderPlaced(data.order);
        setCheckoutStep('success');
      } else {
        alert(data.error || 'Order submission failed.');
      }
    } catch (err) {
      alert('Could not submit order to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrderCompleted = () => {
    onClearCart();
    setCheckoutStep('cart');
    setCheckoutFormStep(0);
    setAppliedDiscount(0);
    setPromoCode('');
    setAppliedCouponCode('');
    setPromoSuccess('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setBillingAddress('');
    setBillingCountry('Sri Lanka');
    setPickupPersonName('');
    setPickupPersonPhone('');
    setBillingPersonIsPickupPerson(false);
    setDeliveryName('');
    setDeliveryPhone('');
    setDeliveryStreet('');
    setDeliveryCity('');
    setDeliveryPostalCode('');
    setDeliveryCountry('Sri Lanka');
    setSameAsBilling(false);
    setDeliveryDate('');
    setDeliveryTime('11:00');
    setOrderMode('scheduled');
    setPlacedOrder(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {isRedirectingToPayment && (
            <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-white/90 text-center backdrop-blur-sm" role="status">
              <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-blue/15 border-t-brand-gold" />
              <p className="text-sm font-bold text-brand-blue">Taking you to Dialog Genie secure payment…</p>
              <p className="text-xs text-stone-500">Enter your card details on the next page.</p>
            </div>
          )}
          {/* Backdrop Mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Sliding Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-gray-150 flex items-center justify-between bg-stone-900 text-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-brand-gold" />
                  <h2 className="text-lg font-bold font-display uppercase tracking-wider">
                    {checkoutStep === 'cart' && (checkoutFormStep === 0 ? 'Your Basket' : checkoutFormStep === 1 ? 'Billing Details' : checkoutFormStep === 2 ? 'Order Fulfilment' : 'Schedule & Payment')}
                    {checkoutStep === 'success' && 'Order Placed!'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart Drawer Content Area */}
              <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-4">
                
                {/* STEP 1: Main Cart List View */}
                {checkoutStep === 'cart' && checkoutFormStep === 0 && (
                  <>
                    {cartItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                        <ShoppingCart className="h-16 w-16 text-gray-200 mb-4 animate-bounce" />
                        <p className="font-bold text-gray-500 text-base">Your basket is currently empty.</p>
                        <p className="text-xs text-gray-400 max-w-xs mt-1">Explore our fresh menu to add custom cakes, hot savouries, or sweets!</p>
                        <button
                          onClick={onClose}
                          className="mt-6 px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold rounded-lg text-xs uppercase tracking-wider cursor-pointer"
                        >
                          Browse Menu
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-gray-150 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            {/* Product Image */}
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-gray-150">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <h3 className="font-bold text-xs uppercase text-brand-blue font-display tracking-tight leading-none mb-1">
                                  {item.product.name}
                                </h3>

                                {item.customizations && (
                                  <div className="space-y-0.5 my-1.5 text-[10px] text-gray-600">
                                    {item.customizations.cakeType && <span>Type: {item.customizations.cakeType}</span>}
                                    {item.customizations.weight && <span className="block">Weight: {item.customizations.weight}</span>}
                                    {item.customizations.variantLabel && <span className="block">{item.customizations.variantLabel}</span>}
                                    {item.customizations.preparationNotes && <span className="block italic text-amber-800">Note: {item.customizations.preparationNotes}</span>}
                                    {item.customizations.message && <span className="block italic text-brand-blue font-semibold">"{item.customizations.message}"</span>}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-2">
                                <span className="text-brand-blue font-bold font-mono text-xs">
                                  {money(item.selectedPrice * item.quantity)}
                                </span>

                                <div className="flex items-center gap-2">
                                  <div className="flex items-center border border-gray-250 bg-white rounded-md overflow-hidden">
                                    <button
                                      onClick={() => onUpdateQuantity(item.id, -1)}
                                      className="p-1 hover:bg-gray-100 text-gray-500 cursor-pointer"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="px-2 text-xs font-bold text-gray-800 font-mono">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => onUpdateQuantity(item.id, 1)}
                                      className="p-1 hover:bg-gray-100 text-gray-500 cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => onRemoveItem(item.id)}
                                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {suggestedProducts.length > 0 && <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-gold" /><div><h3 className="font-display text-sm font-bold text-brand-blue">Complete your order</h3><p className="text-[10px] text-stone-500">Customers also enjoy these with your selection.</p></div></div><div className="grid gap-2">{suggestedProducts.map(product => <div key={product.id} className="flex items-center gap-3 rounded-xl border border-white bg-white p-2 shadow-sm"><img src={product.image} alt="" className="h-12 w-12 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold text-brand-blue">{product.name}</p><p className="text-[10px] font-semibold text-stone-500">{money(product.priceMin)}</p></div><button type="button" onClick={() => onAddSuggestedProduct(product)} className="rounded-lg bg-brand-blue px-3 py-1.5 text-[10px] font-bold text-white">Add</button></div>)}</div></section>}
                      </div>
                    )}
                  </>
                )}

                {/* Compact checkout wizard: billing, fulfilment, then schedule/payment */}
                {checkoutStep === 'cart' && checkoutFormStep > 0 && cartItems.length > 0 && (
                  <form id="checkout-wizard-form" onSubmit={handleCheckoutSubmit} className="space-y-4 pt-1">
                    <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"><div className="grid grid-cols-3 gap-2">{['Billing', 'Fulfilment', 'Payment'].map((label, index) => { const step = index + 1; const active = checkoutFormStep === step; const complete = checkoutFormStep > step; return <div key={label} className="text-center"><div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${active ? 'bg-brand-blue text-white' : complete ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'}`}>{complete ? '✓' : step}</div><p className={`mt-1 text-[9px] font-bold ${active ? 'text-brand-blue' : 'text-stone-400'}`}>{label}</p></div>; })}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${(checkoutFormStep / 3) * 100}%` }} /></div></div>
                    {checkoutFormStep === 2 && <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs flex gap-2">
                      <MapPin className="h-5 w-5 text-brand-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>{fulfillment === 'delivery' ? 'Delivery' : 'Pickup'} & Order Info:</strong> {fulfillment === 'delivery' ? settings.delivery.instructions || `Estimated delivery: ${settings.delivery.estimatedTime}` : 'Freshly prepared for pick-up at your selected branch.'}
                      </div>
                    </div>}

                    <div className="space-y-3 text-xs">
                      <section className={`rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3 ${checkoutFormStep === 1 ? '' : 'hidden'}`}><div><p className="font-display text-sm font-bold text-brand-blue">Billing details</p><p className="text-[10px] text-stone-500">Billing contact numbers may be local or international.</p></div><div><label className="block font-semibold text-gray-700 mb-1">Full name *</label><input type="text" required placeholder="e.g. Sivanathan K." value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5" /></div><div><label className="block font-semibold text-gray-700 mb-1">Address *</label><textarea rows={2} required value={billingAddress} onChange={e => setBillingAddress(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5" /></div><div className="grid grid-cols-2 gap-2"><div><label className="block font-semibold text-gray-700 mb-1">Country *</label><select required value={billingCountry} onChange={e => setBillingCountry(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5">{COUNTRIES.map(country => <option key={country}>{country}</option>)}</select></div><div><label className="block font-semibold text-gray-700 mb-1">Contact number *</label><input type="tel" required placeholder="Local or international number" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5" /></div></div><div><label className="block font-semibold text-gray-700 mb-1">Email (optional)</label><input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5" /></div></section>

                      <section className={`rounded-2xl border border-stone-200 bg-white p-4 ${checkoutFormStep === 2 ? '' : 'hidden'}`}><p className="mb-3 font-display text-sm font-bold text-brand-blue">Choose fulfilment</p><div className="grid grid-cols-2 gap-2">{settings.delivery.storePickupEnabled && <button type="button" onClick={() => setFulfillment('pickup')} className={`rounded-xl border p-3 font-bold ${fulfillment === 'pickup' ? 'border-brand-gold bg-amber-50 text-amber-900' : 'border-stone-200'}`}>Store pickup</button>}{settings.delivery.enabled && <button type="button" onClick={() => setFulfillment('delivery')} className={`rounded-xl border p-3 font-bold ${fulfillment === 'delivery' ? 'border-brand-gold bg-amber-50 text-amber-900' : 'border-stone-200'}`}>Home delivery</button>}</div></section>

                      {fulfillment === 'pickup' ? <section className={`rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-3 ${checkoutFormStep === 2 ? '' : 'hidden'}`}>
                        <div><p className="font-display text-sm font-bold text-brand-blue">3. Pickup details</p><label className="mt-2 flex items-center gap-2 font-semibold text-stone-600"><input type="checkbox" checked={billingPersonIsPickupPerson} onChange={e => setBillingPersonIsPickupPerson(e.target.checked)} className="h-4 w-4 accent-blue-700" /> Billing person is the pickup person</label></div>
                        <div><label className="block font-semibold text-gray-700 mb-1">Pickup location *</label>
                        <select
                          value={selectedBranchId}
                          onChange={(e) => setSelectedBranchId(e.target.value)}
                          className="w-full bg-white text-gray-800 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-gold font-semibold"
                        >
                          {BRANCHES.map((b) => (
                            <option key={b.id} value={b.id}>{b.name} ({b.address})</option>
                          ))}
                        </select></div>
                        <div className="grid grid-cols-2 gap-2"><div><label className="block font-semibold text-gray-700 mb-1">Pickup person name *</label><input required disabled={billingPersonIsPickupPerson} value={pickupPersonName} onChange={e => setPickupPersonName(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5 disabled:bg-stone-100" /></div><div><label className="block font-semibold text-gray-700 mb-1">Pickup contact number *</label><input type="tel" required disabled={billingPersonIsPickupPerson} value={pickupPersonPhone} onChange={e => setPickupPersonPhone(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5 disabled:bg-stone-100" /></div></div>
                      </section> : <section className={`rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-3 ${checkoutFormStep === 2 ? '' : 'hidden'}`}><div><p className="font-display text-sm font-bold text-brand-blue">Delivery details</p><label className="mt-2 flex items-center gap-2 font-semibold text-stone-600"><input type="checkbox" checked={sameAsBilling} onChange={e => setSameAsBilling(e.target.checked)} className="h-4 w-4 accent-blue-700" /> Delivery details are the same as billing</label></div><div><label className="block font-semibold text-gray-700 mb-1">Full name *</label><input required disabled={sameAsBilling} value={deliveryName} onChange={e => setDeliveryName(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5 disabled:bg-stone-100" /></div><div><label className="block font-semibold text-gray-700 mb-1">Street address *</label><textarea rows={2} required disabled={sameAsBilling} value={deliveryStreet} onChange={e => setDeliveryStreet(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5 disabled:bg-stone-100" /></div><div className="grid grid-cols-2 gap-2"><div><label className="block font-semibold text-gray-700 mb-1">Country *</label><select required disabled={sameAsBilling} value={deliveryCountry} onChange={e => setDeliveryCountry(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5 disabled:bg-stone-100">{COUNTRIES.map(country => <option key={country}>{country}</option>)}</select></div><div><label className="block font-semibold text-gray-700 mb-1">Sri Lankan contact number *</label><input type="tel" required disabled={sameAsBilling} placeholder="0771234567 or +94771234567" value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} className={`w-full rounded-lg border bg-white p-2.5 disabled:bg-stone-100 ${deliveryPhone && !isSriLankanPhone(deliveryPhone) ? 'border-rose-400' : 'border-gray-200'}`} />{deliveryPhone && !isSriLankanPhone(deliveryPhone) && <p className="mt-1 text-[9px] text-rose-600">A valid Sri Lankan number is required.</p>}</div></div><div className="grid grid-cols-2 gap-2"><div><label className="block font-semibold text-gray-700 mb-1">City *</label><input required value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5" /></div><div><label className="block font-semibold text-gray-700 mb-1">Postal code</label><input value={deliveryPostalCode} onChange={e => setDeliveryPostalCode(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white p-2.5" /></div></div></section>}

                      {containsFood && <section className={`rounded-2xl border border-orange-200 bg-orange-50 p-4 ${checkoutFormStep === 3 ? '' : 'hidden'}`}><div className="mb-3"><p className="font-display text-sm font-bold text-orange-950">Preparation time</p><p className="mt-1 text-[10px] leading-4 text-orange-800">{orderType === 'mixed' ? 'Mixed bakery and food orders use one scheduled time so everything is ready together.' : `Kitchen hours: ${settings.foodOrdering.openTime}–${settings.foodOrdering.closeTime}. Last order ${settings.foodOrdering.lastOrderTime}.`}</p></div><div className="grid grid-cols-2 gap-2"><button type="button" disabled={!asapAvailable} onClick={() => setOrderMode('asap')} className={`rounded-xl border p-3 text-left ${orderMode === 'asap' ? 'border-orange-500 bg-white font-bold text-orange-950' : 'border-orange-200 bg-orange-50 text-orange-800'} disabled:cursor-not-allowed disabled:opacity-45`}><span className="block font-bold">ASAP</span><span className="mt-1 block text-[9px]">Ready around {earliestAsapAt.toLocaleTimeString('en-LK', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit' })}</span></button><button type="button" disabled={!settings.foodOrdering.allowScheduled || !allFoodAllowsScheduled} onClick={() => setOrderMode('scheduled')} className={`rounded-xl border p-3 text-left ${orderMode === 'scheduled' ? 'border-orange-500 bg-white font-bold text-orange-950' : 'border-orange-200 bg-orange-50 text-orange-800'} disabled:cursor-not-allowed disabled:opacity-45`}><span className="block font-bold">Schedule</span><span className="mt-1 block text-[9px]">Choose an available date and time</span></button></div>{!kitchenOpenNow && orderType !== 'mixed' && <p className="mt-2 rounded-lg bg-white p-2 text-[10px] text-orange-800">{settings.foodOrdering.closedMessage}</p>}</section>}

                      {(orderMode === 'scheduled' || !containsFood) && <section className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 ${checkoutFormStep === 3 ? '' : 'hidden'}`}><p className="mb-3 font-display text-sm font-bold text-amber-950">{fulfillment === 'pickup' ? 'Pickup' : 'Delivery'} date & time</p>{latestItemDate && <p className="mb-2 text-[10px] text-amber-800">This cart contains an item requiring {latestItemDate} or later.</p>}<div className="grid grid-cols-2 gap-2"><div><label className="block font-semibold text-amber-950 mb-1">Date *</label><input type="date" required min={earliestScheduledDate} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full rounded-lg border border-amber-200 bg-white p-2.5" /></div><div><label className="block font-semibold text-amber-950 mb-1">Time *</label><input type="time" required min={containsFood ? settings.foodOrdering.openTime : '11:00'} max={containsFood ? settings.foodOrdering.lastOrderTime : undefined} step={containsFood ? settings.foodOrdering.scheduledSlotMinutes * 60 : 60} value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="w-full rounded-lg border border-amber-200 bg-white p-2.5" /></div></div></section>}

                      {/* Multi Payment Selector */}
                      <div className={checkoutFormStep === 3 ? '' : 'hidden'}>
                        <label className="block font-bold text-gray-800 mb-1.5 uppercase text-[10px] tracking-wider">
                          Select Payment Gateway / Method
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {isPaymentMethodAvailable('cod', settings.payments) && <button
                            type="button"
                            onClick={() => setPaymentMethod('cod')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'cod' ? 'border-brand-gold bg-amber-50/80 font-bold text-amber-900' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <Banknote className="w-4 h-4 text-brand-gold" /> Pay at Branch / COD
                          </button>}

                          {isPaymentMethodAvailable('bank_transfer', settings.payments) && <button
                            type="button"
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'bank_transfer' ? 'border-brand-gold bg-amber-50/80 font-bold text-amber-900' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <Landmark className="w-4 h-4 text-brand-blue" /> Bank Transfer
                          </button>}

                          {isPaymentMethodAvailable('stripe', settings.payments) && <button
                            type="button"
                            onClick={() => setPaymentMethod('stripe')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'stripe' ? 'border-brand-gold bg-amber-50/80 font-bold text-amber-900' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <CreditCard className="w-4 h-4 text-indigo-600" /> Stripe Card
                          </button>}

                          {isPaymentMethodAvailable('payhere', settings.payments) && <button
                            type="button"
                            onClick={() => setPaymentMethod('payhere')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'payhere' ? 'border-brand-gold bg-amber-50/80 font-bold text-amber-900' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <Sparkles className="w-4 h-4 text-emerald-600" /> PayHere
                          </button>}

                          {isPaymentMethodAvailable('dialog_genie', settings.payments) && <button type="button" onClick={() => setPaymentMethod('dialog_genie')} className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${paymentMethod === 'dialog_genie' ? 'border-brand-gold bg-amber-50/80 font-bold text-amber-900' : 'border-gray-200 bg-white'}`}><CreditCard className="w-4 h-4 text-fuchsia-600" /> Dialog Genie</button>}
                        </div>
                        {paymentMethod === 'bank_transfer' && settings.payments.bankAccountInformation && <div className="mt-2 whitespace-pre-line rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-5 text-blue-900">{settings.payments.bankAccountInformation}</div>}
                        {settings.payments.instructions && <p className="mt-2 text-[10px] leading-4 text-stone-500">{settings.payments.instructions}</p>}
                      </div>

                      {settings.orders.customerNotesEnabled && <div className={checkoutFormStep === 3 ? '' : 'hidden'}>
                        <label className="block font-semibold text-gray-700 mb-1">Order Notes (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Please include candle set and birthday card"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          className="w-full bg-white text-gray-800 p-2 border border-gray-200 rounded-lg"
                        />
                      </div>}
                    </div>

                  </form>
                )}

                {/* STEP 3: Order Success Screen */}
                {checkoutStep === 'success' && placedOrder && (
                  <div className="text-center py-8 space-y-6">
                    <div className="flex justify-center">
                      <motion.div
                        initial={{ scale: 0.5, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle className="h-10 w-10" />
                      </motion.div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-brand-blue font-display uppercase tracking-tight">
                        Order Confirmed!
                      </h3>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto">
                        Thank you, <strong>{customerName}</strong>! Your order reference is{' '}
                        <span className="font-mono font-bold text-brand-gold">{placedOrder.orderNumber}</span>.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-left text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Branch:</span>
                        <span className="font-bold text-gray-800">{placedOrder.pickupBranch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Payable:</span>
                        <span className="font-bold text-brand-blue font-mono">{money(placedOrder.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment:</span>
                        <span className="font-bold text-amber-800 uppercase">{placedOrder.paymentMethod}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleOrderCompleted}
                      className="w-full py-3 bg-brand-blue text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                    >
                      Back to Bakery Home
                    </button>
                  </div>
                )}

              </div>

              {/* Compact persistent totals and wizard actions */}
              {checkoutStep === 'cart' && cartItems.length > 0 && (
                <div className="space-y-3 border-t border-gray-150 bg-gray-50/95 px-6 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
                  {checkoutFormStep === 0 && settings.store.couponsEnabled && <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. CELEBRATE10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 bg-white text-gray-800 text-xs px-3 py-2 rounded-lg border border-gray-200 uppercase font-mono"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>}

                  {checkoutFormStep === 0 && promoError && <p className="text-[10px] font-bold text-red-600">{promoError}</p>}
                  {checkoutFormStep === 0 && promoSuccess && <p className="text-[10px] font-bold text-emerald-600">{promoSuccess}</p>}

                  <div className="space-y-1 text-xs text-gray-600">
                    {checkoutFormStep === 0 && <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-bold font-mono">{money(subtotal)}</span>
                    </div>}
                    {checkoutFormStep === 0 && <div className="flex justify-between">
                      <span>Tax ({settings.store.taxPercentage}%):</span>
                      <span className="font-bold font-mono">{money(tax)}</span>
                    </div>}
                    {fulfillment === 'delivery' && <div className="flex justify-between"><span>Delivery:</span><span className="font-bold font-mono">{shippingFee === 0 ? 'Free' : money(shippingFee)}</span></div>}
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Coupon Discount:</span>
                        <span className="font-bold font-mono">-{money(appliedDiscount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between border-t border-gray-200 pt-2 text-sm">
                      <span className="font-bold text-brand-blue">Total Due:</span>
                      <span className="font-bold text-brand-blue font-mono">{money(finalTotal)}</span>
                    </div>
                    {genieChargeLkr !== null && <div className="flex justify-between rounded-lg bg-fuchsia-50 px-2 py-1.5 text-[11px] text-fuchsia-900">
                      <span>Charged by card in rupees:</span>
                      <span className="font-bold font-mono">LKR {genieChargeLkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>}
                  </div>

                  {unavailableItems.length > 0 && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] leading-4 text-rose-800"><p className="font-bold">Some items can't be ordered right now</p><p className="mt-1">Remove {unavailableItems.map(item => item.product.name).join(', ')} to continue.</p></div>}
                  {checkoutFormStep === 0 ? <button type="button" onClick={continueCheckout} disabled={unavailableItems.length > 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gold py-3 text-xs font-black uppercase tracking-wider text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50">Continue to checkout <ArrowRight className="h-4 w-4" /></button> : <div className="grid grid-cols-[110px_1fr] gap-2"><button type="button" onClick={() => setCheckoutFormStep(current => Math.max(0, current - 1) as 0 | 1 | 2)} className="rounded-xl border border-stone-200 bg-white py-3 text-xs font-bold text-stone-600">Back</button>{checkoutFormStep < 3 ? <button type="button" onClick={continueCheckout} className="flex items-center justify-center gap-2 rounded-xl bg-brand-blue py-3 text-xs font-black uppercase tracking-wider text-white">Continue <ArrowRight className="h-4 w-4" /></button> : <button type="submit" form="checkout-wizard-form" disabled={isSubmitting || unavailableItems.length > 0} className="flex items-center justify-center gap-2 rounded-xl bg-brand-gold py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50">{isRedirectingToPayment ? 'Opening secure payment…' : isSubmitting ? 'Submitting…' : paymentMethod === 'dialog_genie' ? 'Pay by card' : 'Place Order'} <ArrowRight className="h-4 w-4" /></button>}</div>}
                </div>
              )}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
