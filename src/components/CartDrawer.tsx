import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingCart, ShoppingBag, MapPin, Sparkles, CheckCircle, CreditCard, Landmark, Banknote } from 'lucide-react';
import { CartItem, Order, PaymentMethod } from '../types';
import { BRANCHES } from '../data';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOrderPlaced?: (order: Order) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  
  // Checkout flow state
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(BRANCHES[0].id);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [orderNotes, setOrderNotes] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute Subtotal
  const subtotal = React.useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0);
  }, [cartItems]);

  const tax = React.useMemo(() => Math.round(subtotal * 0.05), [subtotal]);

  // Compute final discounted total
  const finalTotal = React.useMemo(() => {
    const total = subtotal + tax - appliedDiscount;
    return Math.max(0, total);
  }, [subtotal, tax, appliedDiscount]);

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
        setPromoSuccess(`Coupon ${data.coupon.code} applied! (-Rs. ${data.discountAmount})`);
      } else {
        setPromoError(data.error || 'Invalid or expired coupon code.');
      }
    } catch (err) {
      setPromoError('Could not validate coupon.');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('Please fill in your name and telephone number.');
      return;
    }

    setIsSubmitting(true);
    const selectedBranch = BRANCHES.find(b => b.id === selectedBranchId)?.name || BRANCHES[0].name;

    const orderPayload = {
      customerName,
      customerEmail: customerEmail || 'guest@thineshbakehouse.lk',
      customerPhone,
      pickupBranch: selectedBranch,
      items: cartItems.map(item => ({
        id: item.id,
        productId: item.product.id,
        name: item.product.name,
        price: item.selectedPrice,
        quantity: item.quantity,
        image: item.product.image,
        customizations: item.customizations
      })),
      subtotal,
      tax,
      shippingFee: 0,
      discountAmount: appliedDiscount,
      couponCode: appliedCouponCode,
      total: finalTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'paid',
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
    setAppliedDiscount(0);
    setPromoCode('');
    setAppliedCouponCode('');
    setPromoSuccess('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setPlacedOrder(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
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
                    {checkoutStep === 'cart' && 'Your Bakery Basket'}
                    {checkoutStep === 'form' && 'Checkout & Branch Pickup'}
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
              <div className="flex-1 overflow-y-auto px-6 py-4">
                
                {/* STEP 1: Main Cart List View */}
                {checkoutStep === 'cart' && (
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
                                    {item.customizations.message && <span className="block italic text-brand-blue font-semibold">"{item.customizations.message}"</span>}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-2">
                                <span className="text-brand-blue font-bold font-mono text-xs">
                                  Rs. {item.selectedPrice * item.quantity}
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
                      </div>
                    )}
                  </>
                )}

                {/* STEP 2: Collection Contact Form & Payment Selector */}
                {checkoutStep === 'form' && (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-2">
                    <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs flex gap-2">
                      <MapPin className="h-5 w-5 text-brand-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Pickup & Order Info:</strong> Freshly prepared for pick-up at your selected branch.
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Your Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sivanathan K."
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-white text-gray-800 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Telephone Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 0771234567"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-white text-gray-800 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Pick-up Branch *</label>
                        <select
                          value={selectedBranchId}
                          onChange={(e) => setSelectedBranchId(e.target.value)}
                          className="w-full bg-white text-gray-800 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-gold font-semibold"
                        >
                          {BRANCHES.map((b) => (
                            <option key={b.id} value={b.id}>{b.name} ({b.address})</option>
                          ))}
                        </select>
                      </div>

                      {/* Multi Payment Selector */}
                      <div>
                        <label className="block font-bold text-gray-800 mb-1.5 uppercase text-[10px] tracking-wider">
                          Select Payment Gateway / Method
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cod')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'cod' ? 'border-brand-gold bg-amber-50/80 font-bold text-amber-900' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <Banknote className="w-4 h-4 text-brand-gold" /> Pay at Branch / COD
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'bank_transfer' ? 'border-brand-gold bg-amber-50/80 font-bold text-amber-900' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <Landmark className="w-4 h-4 text-brand-blue" /> Bank Transfer
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod('stripe')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'stripe' ? 'border-brand-gold bg-amber-50/80 font-bold text-amber-900' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <CreditCard className="w-4 h-4 text-indigo-600" /> Stripe Card
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod('payhere')}
                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                              paymentMethod === 'payhere' ? 'border-brand-gold bg-amber-50/80 font-bold text-amber-900' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <Sparkles className="w-4 h-4 text-emerald-600" /> Payhere / Genie
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Order Notes (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Please include candle set and birthday card"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          className="w-full bg-white text-gray-800 p-2 border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCheckoutStep('cart')}
                      className="text-xs font-bold text-gray-500 uppercase tracking-wider block hover:underline"
                    >
                      ← Back to Basket
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white text-sm font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'Submitting Order...' : 'Place Order & Send SMS Alert'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
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
                        <span className="font-bold text-brand-blue font-mono">Rs. {placedOrder.total}</span>
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

              {/* Drawer Footer (Shown only in STEP 1 when basket has items) */}
              {checkoutStep === 'cart' && cartItems.length > 0 && (
                <div className="px-6 py-5 border-t border-gray-150 bg-gray-50/80 space-y-4">
                  {/* Coupon Input */}
                  <div className="flex gap-2">
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
                  </div>

                  {promoError && <p className="text-[10px] font-bold text-red-600">{promoError}</p>}
                  {promoSuccess && <p className="text-[10px] font-bold text-emerald-600">{promoSuccess}</p>}

                  {/* Calculations breakdown */}
                  <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-bold font-mono">Rs. {subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (5%):</span>
                      <span className="font-bold font-mono">Rs. {tax}</span>
                    </div>
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Coupon Discount:</span>
                        <span className="font-bold font-mono">-Rs. {appliedDiscount}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
                      <span className="font-bold text-brand-blue">Total Due:</span>
                      <span className="font-bold text-brand-blue font-mono">Rs. {finalTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCheckoutStep('form')}
                    className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Collection Details</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
