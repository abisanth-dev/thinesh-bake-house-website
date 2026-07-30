import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Percent, MessageSquare,
  Settings, Users, Sliders, MessageSquareText, Plus, Edit, Trash2,
  Upload, Image as ImageIcon, Search, RefreshCw, Printer, AlertTriangle, Send, TrendingUp,
  LogOut, X, ShoppingCart, Key, Link as LinkIcon, CheckCircle2, AlertCircle, Download, ExternalLink
} from 'lucide-react';
import {
  Product, Category, Order, Coupon, Review, User, GeneralSettings,
  EmailSettings, SmsSettings, HeroSlide, ActivityLog, AnalyticsOverview, OrderStatus
} from '../types';
import { adminFetch, adminFetchJson } from './adminApi';
import Logo from '../components/Logo';

interface AdminDashboardProps {
  profile: { id: string; name: string; email: string; role: string };
  onSignOut: () => void;
}

type Tab = 'analytics' | 'products' | 'categories' | 'orders' | 'coupons' | 'reviews' | 'sms' | 'settings' | 'sliders' | 'users' | 'woocommerce';

export default function AdminDashboard({ profile, onSignOut }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('analytics');

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sliders, setSliders] = useState<HeroSlide[]>([]);
  const [general, setGeneral] = useState<GeneralSettings | null>(null);
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [smsSettings, setSmsSettings] = useState<SmsSettings | null>(null);

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingSlider, setEditingSlider] = useState<Partial<HeroSlide>>({ title: '', sub: '', highlight: '', image: '', btnText: 'Explore', isActive: true, order: 1 });
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [customSms, setCustomSms] = useState({ phone: '', message: '' });

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // WooCommerce state
  const [wcSettings, setWcSettings] = useState<{ storeUrl: string; hasConsumerKey: boolean; hasConsumerSecret: boolean; isActive: boolean; lastSyncedAt: string | null } | null>(null);
  const [wcForm, setWcForm] = useState({ url: '', consumerKey: '', consumerSecret: '' });
  const [wcBusy, setWcBusy] = useState<'idle' | 'testing' | 'saving' | 'syncing' | 'migrating'>('idle');
  const [wcStatusMsg, setWcStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [wcPreview, setWcPreview] = useState<{ products: any[]; categories: any[] } | null>(null);

  useEffect(() => {
    loadAllBackendData();
  }, []);

  const loadAllBackendData = async () => {
    setLoading(true);
    try {
      const [anRes, logRes, prodRes, catRes, ordRes, coupRes, revRes, userRes, setRes, wcRes] = await Promise.all([
        adminFetchJson('/api/analytics'),
        adminFetchJson('/api/activity-log'),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        adminFetchJson('/api/orders'),
        adminFetchJson('/api/coupons'),
        fetch('/api/reviews').then(r => r.json()),
        adminFetchJson('/api/users'),
        adminFetchJson('/api/settings'),
        adminFetchJson('/api/woocommerce/settings'),
      ]);

      setAnalytics(anRes);
      setLogs(logRes || []);
      setProducts(prodRes || []);
      setCategories(catRes || []);
      setOrders(ordRes || []);
      setCoupons(coupRes || []);
      setReviews(revRes || []);
      setUsers(userRes || []);
      if (setRes) {
        setGeneral(setRes.general);
        setEmailSettings(setRes.email);
        setSmsSettings(setRes.sms);
        setSliders(setRes.sliders || []);
      }
      setWcSettings(wcRes);
      setWcForm((f) => ({ ...f, url: wcRes.storeUrl || f.url }));
    } catch (err) {
      console.error("Error loading backend data:", err);
      showToast('Failed to load some admin data.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleImageFileUpload = async (file: File, onSuccess: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const data = await adminFetchJson('/api/upload', {
          method: 'POST',
          body: JSON.stringify({ image: base64, fileName: file.name })
        });
        if (data.url) {
          onSuccess(data.url);
          showToast('Image uploaded to Supabase Storage!');
        }
      } catch (err: any) {
        showToast(err.message || 'Image upload failed.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.priceMin) return;

    try {
      const isNew = !editingProduct.id;
      const url = isNew ? '/api/products' : `/api/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';

      await adminFetchJson(url, {
        method,
        body: JSON.stringify({
          ...editingProduct,
          regularPrice: Number(editingProduct.priceMin),
          category: editingProduct.category || 'Cakes',
          stockQuantity: Number(editingProduct.stockQuantity || 20)
        })
      });

      showToast(`Product ${isNew ? 'created' : 'updated'} successfully!`);
      setEditingProduct(null);
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Could not save product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await adminFetchJson(`/api/products/${id}`, { method: 'DELETE' });
      showToast('Product deleted.');
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Could not delete product.');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    try {
      const isNew = !editingCategory.id;
      const url = isNew ? '/api/categories' : `/api/categories/${editingCategory.id}`;
      const method = isNew ? 'POST' : 'PUT';

      await adminFetchJson(url, {
        method,
        body: JSON.stringify({
          ...editingCategory,
          slug: (editingCategory.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-')
        })
      });

      showToast(`Category ${isNew ? 'created' : 'updated'}!`);
      setEditingCategory(null);
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await adminFetchJson(`/api/categories/${id}`, { method: 'DELETE' });
      showToast('Category deleted.');
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Could not delete category.');
    }
  };

  const handleSaveSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlider.title || !editingSlider.image) return;

    try {
      const isNew = !editingSlider.id;
      const url = isNew ? '/api/sliders' : `/api/sliders/${editingSlider.id}`;
      const method = isNew ? 'POST' : 'PUT';

      await adminFetchJson(url, { method, body: JSON.stringify(editingSlider) });

      showToast('Hero slide saved!');
      setEditingSlider({ title: '', sub: '', highlight: '', image: '', btnText: 'Explore', isActive: true, order: 1 });
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Could not save slide.');
    }
  };

  const handleDeleteSlider = async (id: string) => {
    if (!confirm('Delete this hero slide?')) return;
    try {
      await adminFetchJson(`/api/sliders/${id}`, { method: 'DELETE' });
      showToast('Slide deleted.');
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Could not delete slide.');
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.code) return;
    try {
      const isNew = !editingCoupon.id;
      const url = isNew ? '/api/coupons' : `/api/coupons/${editingCoupon.id}`;
      const method = isNew ? 'POST' : 'PUT';
      await adminFetchJson(url, { method, body: JSON.stringify(editingCoupon) });
      showToast(`Coupon ${isNew ? 'created' : 'updated'}!`);
      setEditingCoupon(null);
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Could not save coupon.');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await adminFetchJson(`/api/coupons/${id}`, { method: 'DELETE' });
      showToast('Coupon deleted.');
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Could not delete coupon.');
    }
  };

  const handleModerateReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminFetchJson(`/api/reviews/${id}/moderate`, { method: 'PUT', body: JSON.stringify({ status }) });
      showToast(`Review ${status}.`);
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Could not moderate review.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await adminFetchJson(`/api/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      showToast(`Order status updated to ${status.toUpperCase()}!`);
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Could not update order status.');
    }
  };

  const handleSendDirectSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSms.phone || !customSms.message) return;
    try {
      await adminFetchJson('/api/sms/send', { method: 'POST', body: JSON.stringify(customSms) });
      showToast('SMS dispatched successfully!');
      setCustomSms({ phone: '', message: '' });
    } catch (err: any) {
      showToast(err.message || 'SMS sending failed.');
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!general) return;
    try {
      await adminFetchJson('/api/settings/general', { method: 'PUT', body: JSON.stringify(general) });
      showToast('General Store Settings saved!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save general settings.');
    }
  };

  const handleUpdateUserRole = async (userId: string, role: User['role']) => {
    try {
      await adminFetchJson(`/api/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
      showToast('User role updated!');
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role.');
    }
  };

  // --- WooCommerce handlers ---
  const handleWcTest = async () => {
    setWcBusy('testing');
    setWcStatusMsg({ type: 'info', text: 'Testing connection...' });
    try {
      const data = await adminFetchJson('/api/woocommerce/test', { method: 'POST', body: JSON.stringify(wcForm) });
      setWcStatusMsg({ type: 'success', text: data.message });
    } catch (err: any) {
      setWcStatusMsg({ type: 'error', text: err.message || 'Connection failed.' });
    } finally {
      setWcBusy('idle');
    }
  };

  const handleWcSaveCredentials = async () => {
    setWcBusy('saving');
    try {
      await adminFetchJson('/api/woocommerce/settings', { method: 'PUT', body: JSON.stringify(wcForm) });
      showToast('WooCommerce credentials saved.');
      loadAllBackendData();
    } catch (err: any) {
      setWcStatusMsg({ type: 'error', text: err.message || 'Could not save credentials.' });
    } finally {
      setWcBusy('idle');
    }
  };

  const handleWcPreview = async () => {
    setWcBusy('syncing');
    setWcStatusMsg({ type: 'info', text: 'Fetching live products & categories from WooCommerce...' });
    try {
      const data = await adminFetchJson('/api/woocommerce/sync', { method: 'POST', body: JSON.stringify(wcForm) });
      setWcPreview({ products: data.products || [], categories: data.categories || [] });
      setWcStatusMsg({ type: 'success', text: `Fetched ${data.count} products from ${data.storeUrl}. Review below, then run the migration to download everything into Supabase.` });
    } catch (err: any) {
      setWcStatusMsg({ type: 'error', text: err.message || 'Could not fetch WooCommerce data.' });
    } finally {
      setWcBusy('idle');
    }
  };

  const handleWcMigrate = async () => {
    if (!confirm('This will download all WooCommerce products, categories, and images, and store them permanently in Supabase. Continue?')) return;
    setWcBusy('migrating');
    setWcStatusMsg({ type: 'info', text: 'Migrating products, categories, and images into Supabase... this can take a minute.' });
    try {
      const data = await adminFetchJson('/api/woocommerce/migrate', { method: 'POST', body: JSON.stringify(wcForm) });
      setWcStatusMsg({ type: 'success', text: data.message });
      setWcPreview(null);
      showToast(`Migrated ${data.productCount} products & ${data.imagesMigrated} images to Supabase!`);
      loadAllBackendData();
    } catch (err: any) {
      setWcStatusMsg({ type: 'error', text: err.message || 'Migration failed.' });
    } finally {
      setWcBusy('idle');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* Header Bar */}
      <div className="bg-stone-950 text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-gold/20 rounded-xl border border-brand-gold/30">
            <LayoutDashboard className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display tracking-tight flex items-center gap-2">
              Thinesh Bake House Control Suite
              <span className="bg-brand-gold text-stone-950 text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md">
                Admin
              </span>
            </h1>
            <p className="text-xs text-stone-400">Signed in as {profile.name} ({profile.role.replace('_', ' ')})</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {toastMsg && (
            <span className="hidden sm:inline bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-lg font-semibold animate-pulse">
              {toastMsg}
            </span>
          )}
          <button
            onClick={loadAllBackendData}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            title="Refresh Store Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Store
          </a>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Layout (Sidebar + Workspace) */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-stone-900 border-r border-stone-800 p-3 space-y-1 overflow-y-auto shrink-0 hidden md:block text-xs font-semibold">
          <div className="px-3 py-2 text-[10px] uppercase font-mono tracking-widest text-stone-400">Store Intelligence</div>
          <SidebarButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<TrendingUp className="w-4 h-4" />} label="Overview & Analytics" />

          <div className="px-3 py-2 mt-4 text-[10px] uppercase font-mono tracking-widest text-stone-400">Catalog & Commerce</div>
          <SidebarButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package className="w-4 h-4" />} label="Products & Gallery" />
          <SidebarButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} icon={<Tag className="w-4 h-4" />} label="Category Tree" />
          <SidebarButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ShoppingBag className="w-4 h-4" />} label="Orders & Invoicing" badge={orders.length} />
          <SidebarButton active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} icon={<Percent className="w-4 h-4" />} label="Discount Coupons" />
          <SidebarButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} icon={<MessageSquare className="w-4 h-4" />} label="Reviews & Moderation" />

          <div className="px-3 py-2 mt-4 text-[10px] uppercase font-mono tracking-widest text-stone-400">Integrations</div>
          <SidebarButton active={activeTab === 'woocommerce'} onClick={() => setActiveTab('woocommerce')} icon={<ShoppingCart className="w-4 h-4" />} label="WooCommerce Sync" />

          <div className="px-3 py-2 mt-4 text-[10px] uppercase font-mono tracking-widest text-stone-400">Settings & Admin</div>
          <SidebarButton active={activeTab === 'sliders'} onClick={() => setActiveTab('sliders')} icon={<Sliders className="w-4 h-4" />} label="Hero Carousel Sliders" />
          <SidebarButton active={activeTab === 'sms'} onClick={() => setActiveTab('sms')} icon={<MessageSquareText className="w-4 h-4" />} label="SMS Gateway & Alerts" />
          <SidebarButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-4 h-4" />} label="General & Email Settings" />
          <SidebarButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users className="w-4 h-4" />} label="User Accounts & Roles" />
        </aside>

        {/* Mobile Tab Nav Selector */}
        <div className="md:hidden w-full bg-stone-900 border-b border-stone-800 p-2 flex overflow-x-auto gap-2 shrink-0 fixed top-[76px] left-0 z-30">
          {(['analytics', 'products', 'categories', 'orders', 'coupons', 'reviews', 'woocommerce', 'sliders', 'sms', 'settings', 'users'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase whitespace-nowrap ${
                activeTab === tab ? 'bg-brand-gold text-stone-950 font-bold' : 'text-stone-300 bg-stone-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gray-50/50 space-y-6 md:mt-0 mt-12">

          {/* --- ANALYTICS --- */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-blue to-indigo-950 text-white shadow-lg space-y-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-indigo-200">Total Store Revenue</span>
                  <div className="text-2xl font-bold font-mono">Rs. {analytics.totalRevenue.toLocaleString()}</div>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-gray-400">Total Orders</span>
                  <div className="text-2xl font-bold font-mono text-gray-900">{analytics.totalOrders}</div>
                  <span className="text-[11px] text-gray-500 font-medium">Across Jaffna & Colombo branches</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-gray-400">Active Customers</span>
                  <div className="text-2xl font-bold font-mono text-gray-900">{analytics.activeCustomers}</div>
                </div>
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs space-y-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-amber-900">Low Stock Alerts</span>
                  <div className="text-2xl font-bold font-mono text-amber-900">{analytics.lowStockCount} Items</div>
                  <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Re-stock required
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 font-mono">Live Activity & System Log Stream</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start justify-between text-xs gap-3">
                      <div>
                        <span className="font-bold text-gray-900">{log.action}</span>
                        <span className="text-gray-500 block">{log.details}</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-1 block">By: {log.user}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- PRODUCTS --- */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white"
                  />
                </div>
                <button
                  onClick={() => setEditingProduct({ name: '', priceMin: 500, category: 'Cakes', stockQuantity: 25, stockStatus: 'in_stock' })}
                  className="bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Product
                </button>
              </div>

              {editingProduct && (
                <form onSubmit={handleSaveProduct} className="bg-white p-5 rounded-2xl border-2 border-brand-gold shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h4 className="font-bold text-sm text-gray-900 font-mono">
                      {editingProduct.id ? 'Edit Product Details' : 'Create New Product'}
                    </h4>
                    <button type="button" onClick={() => setEditingProduct(null)} className="p-1 text-gray-400 hover:text-gray-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Product Name</label>
                      <input type="text" required value={editingProduct.name || ''} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">SKU Code</label>
                      <input type="text" placeholder="e.g. TBH-CAKE-005" value={editingProduct.sku || ''} onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg font-mono" />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Category</label>
                      <select value={editingProduct.category || 'Cakes'} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg">
                        {categories.map((cat) => (<option key={cat.id} value={cat.name}>{cat.name}</option>))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1 text-xs">Description</label>
                    <textarea rows={2} value={editingProduct.description || ''} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-xs" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Regular Price (Rs.)</label>
                      <input type="number" required value={editingProduct.priceMin || 0} onChange={(e) => setEditingProduct({ ...editingProduct, priceMin: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg font-mono" />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Stock Quantity</label>
                      <input type="number" value={editingProduct.stockQuantity || 20} onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg font-mono" />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Stock Status</label>
                      <select value={editingProduct.stockStatus || 'in_stock'} onChange={(e) => setEditingProduct({ ...editingProduct, stockStatus: e.target.value as any })} className="w-full p-2 border border-gray-200 rounded-lg">
                        <option value="in_stock">In Stock</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3 text-xs">
                    <label className="block font-bold text-amber-900 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-brand-gold" /> Featured Image (stored in Supabase Storage)
                    </label>
                    <div className="flex flex-wrap items-center gap-4">
                      {editingProduct.image && (<img src={editingProduct.image} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-amber-300" />)}
                      <div className="flex-1 space-y-2">
                        <input type="text" placeholder="Paste Image URL (https://...)" value={editingProduct.image || ''} onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white" />
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-bold uppercase text-[10px]">OR Upload File:</span>
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageFileUpload(file, (url) => setEditingProduct({ ...editingProduct, image: url }));
                          }} className="text-xs text-gray-500 cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-brand-gold text-white font-bold text-xs rounded-lg shadow-sm">Save Product</button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-mono uppercase text-[10px] border-b border-gray-100">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">SKU</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products
                      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())))
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/80">
                          <td className="p-3.5 flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <span className="font-bold text-gray-900 block">{p.name}</span>
                              {p.isFeatured && <span className="text-[9px] bg-brand-gold/20 text-brand-gold font-bold px-1.5 py-0.5 rounded">Featured</span>}
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-gray-500">{p.sku || 'N/A'}</td>
                          <td className="p-3.5">{p.category}</td>
                          <td className="p-3.5 font-bold font-mono text-brand-blue">Rs. {p.priceMin}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.stockStatus === 'in_stock' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {p.stockQuantity} ({p.stockStatus})
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            <button onClick={() => setEditingProduct(p)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- CATEGORIES --- */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Category Management</h3>
                <button onClick={() => setEditingCategory({ name: '', description: '', isFeatured: true })} className="bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>

              {editingCategory && (
                <form onSubmit={handleSaveCategory} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 text-xs">
                  <input type="text" placeholder="Category Name (e.g. Pastries)" required value={editingCategory.name || ''} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="w-full p-2 border rounded-lg" />
                  <input type="text" placeholder="Image URL" value={editingCategory.image || ''} onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })} className="w-full p-2 border rounded-lg" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingCategory(null)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-brand-gold text-white font-bold rounded-lg">Save Category</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                    <img src={c.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=200'} alt={c.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{c.name}</h4>
                      <span className="text-xs text-gray-400">{c.count || 0} products</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingCategory(c)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- ORDERS --- */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 font-mono">Store Customer Orders</h3>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-mono uppercase text-[10px] border-b border-gray-100">
                    <tr>
                      <th className="p-3.5">Order Ref</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Pickup Branch</th>
                      <th className="p-3.5">Total</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50/80">
                        <td className="p-3.5 font-bold font-mono text-brand-blue">{ord.orderNumber}</td>
                        <td className="p-3.5">
                          <span className="font-semibold text-gray-900 block">{ord.customerName}</span>
                          <span className="text-gray-400 text-[10px] block">{ord.customerPhone}</span>
                        </td>
                        <td className="p-3.5">{ord.pickupBranch}</td>
                        <td className="p-3.5 font-bold font-mono">Rs. {ord.total}</td>
                        <td className="p-3.5">
                          <select value={ord.status} onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)} className="p-1 border rounded-md text-xs font-semibold bg-white">
                            <option value="pending_payment">Pending Payment</option>
                            <option value="processing">Processing</option>
                            <option value="ready_for_pickup">Ready for Pickup</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <button onClick={() => setSelectedOrderForInvoice(ord)} className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer">
                            <Printer className="w-3.5 h-3.5" /> Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedOrderForInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white p-6 rounded-2xl max-w-lg w-full space-y-4">
                <div className="flex justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-stone-900">THINESH BAKE HOUSE INVOICE</h3>
                    <span className="text-xs font-mono text-gray-400">Order: {selectedOrderForInvoice.orderNumber}</span>
                  </div>
                  <button onClick={() => setSelectedOrderForInvoice(null)}><X className="w-5 h-5" /></button>
                </div>
                <div className="text-xs space-y-1">
                  <p><strong>Customer:</strong> {selectedOrderForInvoice.customerName}</p>
                  <p><strong>Branch:</strong> {selectedOrderForInvoice.pickupBranch}</p>
                  <p><strong>Date:</strong> {new Date(selectedOrderForInvoice.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="border-t pt-2 space-y-1 text-xs">
                  {selectedOrderForInvoice.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{it.name} × {it.quantity}</span>
                      <span>Rs. {it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 text-right font-bold text-sm">
                  Total Payable: Rs. {selectedOrderForInvoice.total}
                </div>
                <button onClick={() => window.print()} className="w-full py-2 bg-brand-gold text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Print Tax Invoice
                </button>
              </div>
            </div>
          )}

          {/* --- COUPONS --- */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Discount Coupons</h3>
                <button onClick={() => setEditingCoupon({ code: '', type: 'percentage', value: 10, isActive: true })} className="bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Coupon
                </button>
              </div>

              {editingCoupon && (
                <form onSubmit={handleSaveCoupon} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Coupon Code" required value={editingCoupon.code || ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })} className="p-2 border rounded-lg font-mono" />
                  <select value={editingCoupon.type || 'percentage'} onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value as any })} className="p-2 border rounded-lg">
                    <option value="percentage">Percentage Off</option>
                    <option value="fixed_cart">Fixed Amount Off</option>
                  </select>
                  <input type="number" placeholder="Value" required value={editingCoupon.value ?? ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })} className="p-2 border rounded-lg" />
                  <input type="number" placeholder="Min Spend" value={editingCoupon.minSpend ?? ''} onChange={(e) => setEditingCoupon({ ...editingCoupon, minSpend: Number(e.target.value) })} className="p-2 border rounded-lg" />
                  <label className="flex items-center gap-2 sm:col-span-2">
                    <input type="checkbox" checked={editingCoupon.isActive ?? true} onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked })} /> Active
                  </label>
                  <div className="flex justify-end gap-2 sm:col-span-2">
                    <button type="button" onClick={() => setEditingCoupon(null)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-brand-gold text-white font-bold rounded-lg">Save Coupon</button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-mono uppercase text-[10px] border-b border-gray-100">
                    <tr>
                      <th className="p-3.5">Code</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Value</th>
                      <th className="p-3.5">Used</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/80">
                        <td className="p-3.5 font-bold font-mono">{c.code}</td>
                        <td className="p-3.5">{c.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                        <td className="p-3.5 font-mono">{c.type === 'percentage' ? `${c.value}%` : `Rs. ${c.value}`}</td>
                        <td className="p-3.5">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button onClick={() => setEditingCoupon(c)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteCoupon(c.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- REVIEWS --- */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Reviews & Moderation</h3>
              {reviews.map((r) => (
                <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-gray-900">{r.author}</span> — <span className="text-gray-500">{r.productName}</span>
                      <div className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : r.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{r.status}</span>
                  </div>
                  <p className="text-gray-700">{r.comment}</p>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleModerateReview(r.id, 'approved')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-semibold">Approve</button>
                      <button onClick={() => handleModerateReview(r.id, 'rejected')} className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold">Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* --- WOOCOMMERCE INTEGRATION --- */}
          {activeTab === 'woocommerce' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">WooCommerce Integration & Migration</h3>
                {wcSettings && (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${wcSettings.hasConsumerKey && wcSettings.hasConsumerSecret ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                    {wcSettings.hasConsumerKey && wcSettings.hasConsumerSecret ? 'Credentials Saved' : 'Not Configured'}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Enter your WordPress WooCommerce REST API details, then either run a live preview sync or a full one-click
                migration that downloads every product, category, and image permanently into Supabase.
              </p>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-[#0B1354]" /> Store URL
                  </label>
                  <input type="url" value={wcForm.url} onChange={(e) => setWcForm({ ...wcForm, url: e.target.value })} placeholder="https://yourwoocommercestore.com" className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B1354] font-mono" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-[#0B1354]" /> Consumer Key
                    </label>
                    <input type="text" value={wcForm.consumerKey} onChange={(e) => setWcForm({ ...wcForm, consumerKey: e.target.value })} placeholder={wcSettings?.hasConsumerKey ? '••••••••••• (saved)' : 'ck_xxxxxxxxxxxxxxxxxxxx'} className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B1354] font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-[#0B1354]" /> Consumer Secret
                    </label>
                    <input type="password" value={wcForm.consumerSecret} onChange={(e) => setWcForm({ ...wcForm, consumerSecret: e.target.value })} placeholder={wcSettings?.hasConsumerSecret ? '••••••••••• (saved)' : 'cs_xxxxxxxxxxxxxxxxxxxx'} className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B1354] font-mono" />
                  </div>
                </div>

                {wcStatusMsg && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${wcStatusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : wcStatusMsg.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
                    {wcStatusMsg.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
                    {wcStatusMsg.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />}
                    {wcStatusMsg.type === 'info' && <RefreshCw className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5 animate-spin" />}
                    <span className="leading-snug">{wcStatusMsg.text}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button onClick={handleWcTest} disabled={wcBusy !== 'idle'} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50">
                    {wcBusy === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Test Connection
                  </button>
                  <button onClick={handleWcSaveCredentials} disabled={wcBusy !== 'idle'} className="px-4 py-2.5 bg-[#0B1354] hover:bg-brand-blue-light text-white font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50">
                    {wcBusy === 'saving' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5 text-brand-gold" />} Save Credentials
                  </button>
                  <button onClick={handleWcPreview} disabled={wcBusy !== 'idle'} className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50">
                    {wcBusy === 'syncing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Preview Fetch
                  </button>
                  <button onClick={handleWcMigrate} disabled={wcBusy !== 'idle'} className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50 shadow-md">
                    {wcBusy === 'migrating' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Migrate to Supabase (Download Images & Content)
                  </button>
                </div>
              </div>

              {wcPreview && (
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Preview: {wcPreview.products.length} Products, {wcPreview.categories.length} Categories
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                    {wcPreview.products.slice(0, 12).map((p: any) => (
                      <div key={p.id} className="border border-gray-100 rounded-lg overflow-hidden">
                        <img src={p.image} alt={p.name} className="w-full h-16 object-cover" />
                        <div className="p-1.5 text-[10px] font-semibold truncate">{p.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
                <div className="font-extrabold uppercase tracking-wider text-[11px] text-amber-950">Where to find keys in WordPress:</div>
                <ol className="list-decimal list-inside space-y-1 text-amber-800 pl-1">
                  <li>Log into your WordPress Admin Dashboard.</li>
                  <li>Go to <strong>WooCommerce</strong> &gt; <strong>Settings</strong> &gt; <strong>Advanced</strong> &gt; <strong>REST API</strong>.</li>
                  <li>Click <strong>Add Key</strong>, set Permissions to <strong>Read</strong>, and generate keys.</li>
                  <li>Copy the <strong>Consumer Key</strong> and <strong>Consumer Secret</strong> into the fields above.</li>
                </ol>
              </div>
            </div>
          )}

          {/* --- HERO CAROUSEL SLIDERS --- */}
          {activeTab === 'sliders' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Homepage Hero Carousel Manager</h3>

              <form onSubmit={handleSaveSlider} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="text" placeholder="Title (e.g. CAKES THAT)" required value={editingSlider.title || ''} onChange={(e) => setEditingSlider({ ...editingSlider, title: e.target.value })} className="p-2 border rounded-lg" />
                  <input type="text" placeholder="Highlight Word (e.g. CAPTIVATE)" value={editingSlider.highlight || ''} onChange={(e) => setEditingSlider({ ...editingSlider, highlight: e.target.value })} className="p-2 border rounded-lg" />
                  <input type="text" placeholder="Subtitle" value={editingSlider.sub || ''} onChange={(e) => setEditingSlider({ ...editingSlider, sub: e.target.value })} className="p-2 border rounded-lg" />
                </div>
                <div className="flex gap-2 items-center">
                  <input type="text" placeholder="Image URL" required value={editingSlider.image || ''} onChange={(e) => setEditingSlider({ ...editingSlider, image: e.target.value })} className="flex-1 p-2 border rounded-lg" />
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileUpload(file, (url) => setEditingSlider({ ...editingSlider, image: url }));
                  }} className="text-xs" />
                </div>
                <button type="submit" className="px-4 py-2 bg-brand-gold text-white font-bold rounded-lg">Save Slide</button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sliders.map((s) => (
                  <div key={s.id} className="relative h-40 rounded-xl overflow-hidden shadow-md group">
                    <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 p-4 text-white flex flex-col justify-end">
                      <span className="text-[10px] uppercase font-bold text-amber-300">{s.sub}</span>
                      <h4 className="font-bold text-base uppercase">{s.title} {s.highlight}</h4>
                    </div>
                    <button onClick={() => handleDeleteSlider(s.id)} className="absolute top-2 right-2 p-1.5 bg-rose-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- SMS GATEWAY & ALERTS --- */}
          {activeTab === 'sms' && smsSettings && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">SMS Gateway Configuration</h3>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">SMS Provider Gateway</label>
                    <select value={smsSettings.provider} onChange={(e) => setSmsSettings({ ...smsSettings, provider: e.target.value as any })} className="w-full p-2 border rounded-lg">
                      <option value="twilio">Twilio SMS API</option>
                      <option value="dialog_sms">Dialog SMS Gateway (Sri Lanka)</option>
                      <option value="mobitel">Mobitel Enterprise SMS</option>
                      <option value="simulator">Local Development Simulator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Sender ID</label>
                    <input type="text" value={smsSettings.senderId} onChange={(e) => setSmsSettings({ ...smsSettings, senderId: e.target.value })} className="w-full p-2 border rounded-lg font-mono" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSendDirectSms} className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3 text-xs">
                <h4 className="font-bold text-amber-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-brand-gold" /> Send Direct Customer SMS Notification
                </h4>
                <input type="text" placeholder="Customer Phone (+94...)" required value={customSms.phone} onChange={(e) => setCustomSms({ ...customSms, phone: e.target.value })} className="w-full p-2 border rounded-lg bg-white" />
                <textarea rows={2} placeholder="Type custom SMS update message..." required value={customSms.message} onChange={(e) => setCustomSms({ ...customSms, message: e.target.value })} className="w-full p-2 border rounded-lg bg-white" />
                <button type="submit" className="px-4 py-2 bg-brand-gold text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer">
                  <Send className="w-3.5 h-3.5" /> Dispatch SMS Alert
                </button>
              </form>
            </div>
          )}

          {/* --- GENERAL SETTINGS --- */}
          {activeTab === 'settings' && general && (
            <form onSubmit={handleSaveGeneralSettings} className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4 text-xs max-w-2xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">General Store Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Store Name</label>
                  <input type="text" value={general.storeName} onChange={(e) => setGeneral({ ...general, storeName: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Support Phone</label>
                  <input type="text" value={general.storePhone} onChange={(e) => setGeneral({ ...general, storePhone: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Store Email</label>
                  <input type="email" value={general.storeEmail} onChange={(e) => setGeneral({ ...general, storeEmail: e.target.value })} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tax Rate (%)</label>
                  <input type="number" value={general.taxRatePercent} onChange={(e) => setGeneral({ ...general, taxRatePercent: Number(e.target.value) })} className="w-full p-2 border rounded-lg" />
                </div>
              </div>
              <button type="submit" className="px-5 py-2 bg-brand-gold text-white font-bold rounded-lg">Save Settings</button>
            </form>
          )}

          {/* --- USER ACCOUNTS & ROLES --- */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Admin & Staff Accounts</h3>
              <p className="text-xs text-gray-500">
                These are real Supabase Auth accounts with access to this admin panel. To add a new admin/staff user,
                create their account in the Supabase dashboard's Authentication tab and add a matching row to the
                <code className="mx-1 px-1 bg-gray-100 rounded">profiles</code> table.
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-mono uppercase text-[10px] border-b border-gray-100">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5 text-right">Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-3.5 font-bold text-gray-900">{u.name}</td>
                        <td className="p-3.5 text-gray-500 font-mono">{u.email}</td>
                        <td className="p-3.5 font-bold uppercase text-brand-blue">{u.role}</td>
                        <td className="p-3.5 text-right">
                          <select value={u.role} onChange={(e) => handleUpdateUserRole(u.id, e.target.value as User['role'])} className="p-1 border rounded-md font-semibold text-xs">
                            <option value="administrator">Administrator</option>
                            <option value="shop_manager">Shop Manager</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

function SidebarButton({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
        active ? 'bg-brand-gold text-stone-950 font-bold shadow-md' : 'text-stone-300 hover:bg-stone-800'
      }`}
    >
      <div className="flex items-center gap-3">{icon} {label}</div>
      {typeof badge === 'number' && badge > 0 && (
        <span className="bg-stone-950/40 text-stone-100 text-[10px] px-2 py-0.5 rounded-full font-mono">{badge}</span>
      )}
    </button>
  );
}
