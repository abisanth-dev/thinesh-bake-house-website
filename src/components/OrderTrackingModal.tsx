import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Package, Clock, CheckCircle2, MapPin, Truck, AlertCircle, ShoppingBag, PhoneCall } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useSiteSettings } from './SiteSettingsContext';
import { formatMoney } from '../siteSettings';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
}

export default function OrderTrackingModal({ isOpen, onClose, initialOrderNumber = '' }: OrderTrackingModalProps) {
  const settings = useSiteSettings();
  const money = (value: number) => formatMoney(value, settings);
  const [orderQuery, setOrderQuery] = useState(initialOrderNumber);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearchOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderQuery.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(orderQuery.trim())}`);
      const data = await res.json();
      if (res.ok && data.orderNumber) {
        setOrder(data);
      } else {
        setError(data.error || 'Order not found. Please verify your order number (e.g. TBH-1001).');
      }
    } catch (err) {
      setError('Could not connect to order tracking service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Order Completed</span>;
      case 'ready_for_pickup':
        return <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> Ready for Pickup</span>;
      case 'out_for_delivery':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Out for Delivery</span>;
      case 'processing':
        return <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5 animate-spin" /> {order?.orderType === 'food' ? 'Preparing Food' : order?.orderType === 'mixed' ? 'Preparing Full Order' : 'Baking & Preparing'}</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">Order Received</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-amber-100"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-brand-blue to-indigo-950 px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-gold/20 rounded-xl border border-brand-gold/30">
                <Package className="w-6 h-6 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display tracking-tight">Track Your Oven Order</h3>
                <p className="text-xs text-indigo-200">One timeline for bakery, cakes and freshly prepared food</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-indigo-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Order Search Bar */}
            <form onSubmit={handleSearchOrder} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter Order # (e.g. TBH-1001)"
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold font-mono font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !orderQuery.trim()}
                className="bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Searching...' : 'Track'}
              </button>
            </form>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {order && (
              <div className="space-y-6 animate-fadeIn">
                {/* Order Meta Header */}
                <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono uppercase text-gray-500 block">Order Reference</span>
                    <span className="text-lg font-bold font-mono text-brand-blue">{order.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase text-gray-500 block">Pickup Branch</span>
                    <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                      {order.pickupBranch}
                    </span>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="w-full border-t border-amber-100 pt-3 text-xs text-amber-950 sm:w-auto sm:border-0 sm:pt-0"><span className="font-bold uppercase">{order.orderType || 'bakery'} order</span><span className="ml-2 text-amber-800">{order.orderMode === 'asap' ? 'ASAP' : 'Scheduled'}{order.requestedFulfillmentAt ? ` · ${new Date(order.requestedFulfillmentAt).toLocaleString('en-LK', { timeZone: 'Asia/Colombo', dateStyle: 'medium', timeStyle: 'short' })}` : ''}</span></div>
                </div>

                {/* Progress Steps Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Kitchen Progress Timeline</h4>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    {(order.trackingHistory || []).map((step, idx) => (
                      <div key={idx} className="relative flex items-start gap-4">
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${step.completed
                          ? 'bg-brand-gold border-brand-gold text-white'
                          : 'bg-white border-gray-300'
                          }`}>
                          {step.completed && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </span>
                            <span className="text-[11px] font-mono text-gray-400">
                              {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {step.note && (
                            <p className="text-xs text-gray-600 mt-1 italic">{step.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ordered Items Summary */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Order Items</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/80 border border-gray-100 text-sm">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-gray-900 truncate">{item.name}</h5>
                          <span className="text-xs text-gray-500">Qty: {item.quantity} × {money(item.price)}</span>
                          {item.customizations?.variantLabel && <span className="block text-[10px] text-stone-500">{item.customizations.variantLabel}</span>}
                          {item.customizations?.foodModifiers?.map(modifier => <span key={`${modifier.groupId}-${modifier.optionId}`} className="block text-[10px] text-stone-500">{modifier.groupName}: {modifier.optionName}</span>)}
                        </div>
                        <span className="font-bold font-mono text-brand-blue">{money(item.quantity * item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Branch Contact Quick Call */}
                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-brand-gold" />
                    <span>Questions about your order? Call Branch counter directly</span>
                  </div>
                  <span className="font-bold font-mono text-brand-blue">021 221 2525</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
