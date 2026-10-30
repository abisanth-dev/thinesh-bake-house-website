import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Percent, MessageSquare,
  Settings, Users, Sliders, MessageSquareText, Plus, Edit, Trash2,
  Upload, Image as ImageIcon, Search, RefreshCw, Printer, AlertTriangle, Send, TrendingUp,
  LogOut, X, ShoppingCart, Key, Link as LinkIcon, CheckCircle2, AlertCircle, Download, ExternalLink
} from 'lucide-react';
import {
  Product, Category, Order, Coupon, Review, User, GeneralSettings,
  EmailSettings, SmsSettings, HeroSlide, ActivityLog, AnalyticsOverview, OrderStatus,
  ComboItem, MenuGroup
} from '../types';
import { adminFetch, adminFetchJson } from './adminApi';
import Logo from '../components/Logo';
import SettingsManager from './SettingsManager';
import { MENU_GROUPS, isMenuGroupEnabled } from '../menuGroups';

interface AdminDashboardProps {
  profile: { id: string; name: string; email: string; role: string };
  onSignOut: () => void;
}

type Tab = 'analytics' | 'products' | 'categories' | 'orders' | 'coupons' | 'reviews' | 'sms' | 'settings' | 'sliders' | 'users' | 'woocommerce';

const ADMIN_TABS: Tab[] = ['analytics', 'products', 'categories', 'orders', 'coupons', 'reviews', 'woocommerce', 'sliders', 'sms', 'settings', 'users'];

// Each admin section has its own URL (/admin, /admin/products, /admin/settings/...) so a refresh or a shared link reopens the same page.
const tabFromPath = (path: string): Tab => {
  const segment = path.replace(/^\/admin\/?/, '').split('/')[0];
  return (ADMIN_TABS as string[]).includes(segment) ? segment as Tab : 'analytics';
};
const tabPath = (tab: Tab) => (tab === 'analytics' ? '/admin' : `/admin/${tab}`);

export default function AdminDashboard({ profile, onSignOut }: AdminDashboardProps) {
  const [activeTab, setActiveTabState] = useState<Tab>(() => tabFromPath(window.location.pathname));

  const setActiveTab = (tab: Tab) => {
    // Re-clicking the open section keeps its sub-page URL (e.g. /admin/settings/homepage).
    if (tab === activeTab) return;
    setActiveTabState(tab);
    window.history.pushState({ tab }, '', tabPath(tab));
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const handlePopState = () => setActiveTabState(tabFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
  const [comboSearch, setComboSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 10;

  // WooCommerce state
  const [wcSettings, setWcSettings] = useState<{ storeUrl: string; hasConsumerKey: boolean; hasConsumerSecret: boolean; isActive: boolean; lastSyncedAt: string | null } | null>(null);
  const [wcForm, setWcForm] = useState({ url: '', consumerKey: '', consumerSecret: '' });
  const [wcBusy, setWcBusy] = useState<'idle' | 'testing' | 'saving' | 'syncing' | 'migrating'>('idle');
  const [wcStatusMsg, setWcStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [wcPreview, setWcPreview] = useState<{ products: any[]; categories: any[] } | null>(null);
  const [wcExistingItemsStrategy, setWcExistingItemsStrategy] = useState<'keep' | 'replace'>('keep');

  const getWcRequestPayload = () => ({
    url: wcForm.url,
    ...(wcForm.consumerKey.startsWith('ck_') ? { consumerKey: wcForm.consumerKey } : {}),
    ...(wcForm.consumerSecret.startsWith('cs_') ? { consumerSecret: wcForm.consumerSecret } : {}),
  });

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
    if (!editingProduct?.name) return;

    try {
      if (editingProduct.productType === 'combo') {
        const comboItems = editingProduct.comboItems || [];
        if (comboItems.length === 0) {
          showToast('Search the catalogue and add at least one item to this combo.');
          return;
        }
        if (comboItems.some(item => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || !Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0)) {
          showToast('Every combo line needs a whole quantity of 1 or more and a valid unit price.');
          return;
        }
        const regularPrice = comboItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
        const hasSalePrice = editingProduct.salePrice !== undefined && Number.isFinite(Number(editingProduct.salePrice));
        const salePrice = hasSalePrice ? Number(editingProduct.salePrice) : undefined;
        if (salePrice !== undefined && (salePrice <= 0 || salePrice >= regularPrice)) {
          showToast('The sale value must be greater than zero and lower than the combined item value.');
          return;
        }
        const isNewCombo = !editingProduct.id;
        await adminFetchJson(isNewCombo ? '/api/products' : `/api/products/${editingProduct.id}`, {
          method: isNewCombo ? 'POST' : 'PUT',
          body: JSON.stringify({
            ...editingProduct,
            comboItems: comboItems.map(item => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
            variants: [],
            modifierGroups: [],
            regularPrice,
            salePrice,
            category: editingProduct.category || (categories.find(category => category.menuGroup === 'combo')?.name ?? 'Combos'),
            stockQuantity: Number(editingProduct.stockQuantity || 20),
          }),
        });
        showToast(`Combo ${isNewCombo ? 'created' : 'updated'} successfully!`);
        setEditingProduct(null);
        setComboSearch('');
        loadAllBackendData();
        return;
      }

      const isFood = editingProduct.productType === 'food';
      if (isFood && !(editingProduct.variants || []).length) {
        showToast('Add at least one bulk order package with a person count and price.');
        return;
      }
      if (isFood && (editingProduct.variants || []).some(variant => !Number.isInteger(Number(variant.servesPersons)) || Number(variant.servesPersons) < 1 || !Number.isFinite(Number(variant.price)) || Number(variant.price) <= 0)) {
        showToast('Every food package needs a valid person count and price greater than zero.');
        return;
      }
      const variants = isFood ? (editingProduct.variants || []).map(variant => ({
        ...variant,
        servesPersons: Number(variant.servesPersons),
        price: Number(variant.price),
        regularPrice: Number(variant.price),
        salePrice: undefined,
        attributes: [{ name: 'Serves', option: `${Number(variant.servesPersons)} persons` }],
        stockStatus: variant.stockStatus || 'in_stock',
      })) : (editingProduct.variants || []);
      const variantPrices = variants.map(variant => Number(variant.salePrice ?? variant.price)).filter(price => Number.isFinite(price) && price >= 0);
      const priceMin = variantPrices.length ? Math.min(...variantPrices) : Number(editingProduct.priceMin || 0);
      const priceMax = variantPrices.length ? Math.max(...variantPrices) : Number(editingProduct.priceMax || priceMin);
      const isNew = !editingProduct.id;
      const url = isNew ? '/api/products' : `/api/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';

      await adminFetchJson(url, {
        method,
        body: JSON.stringify({
          ...editingProduct,
          variants,
          modifierGroups: isFood ? [] : editingProduct.modifierGroups,
          priceMin,
          priceMax,
          regularPrice: Number(editingProduct.regularPrice ?? priceMin),
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

  const addVariant = () => setEditingProduct(current => current ? ({
    ...current,
    variants: [...(current.variants || []), {
      id: `variant-${Date.now()}`,
      sku: '',
      price: Number(current.priceMin || 0),
      regularPrice: Number(current.priceMin || 0),
      stockQuantity: Number(current.stockQuantity || 0),
      stockStatus: 'in_stock',
      servesPersons: current.productType === 'food' ? 5 : undefined,
      attributes: current.productType === 'food' ? [{ name: 'Serves', option: '5 persons' }] : [{ name: 'Size', option: '' }],
    }],
  }) : current);

  const updateVariant = (index: number, patch: Record<string, unknown>) => setEditingProduct(current => current ? ({
    ...current,
    variants: (current.variants || []).map((variant, variantIndex) => variantIndex === index ? { ...variant, ...patch } : variant),
  }) : current);

  const updateVariantAttribute = (variantIndex: number, attributeIndex: number, field: 'name' | 'option', value: string) => setEditingProduct(current => current ? ({
    ...current,
    variants: (current.variants || []).map((variant, index) => index === variantIndex ? {
      ...variant,
      attributes: variant.attributes.map((attribute, attrIndex) => attrIndex === attributeIndex ? { ...attribute, [field]: value } : attribute),
    } : variant),
  }) : current);

  // --- Combo builder helpers ---
  const comboItems = editingProduct?.comboItems || [];
  const comboItemsTotal = comboItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const comboSalePrice = Number.isFinite(Number(editingProduct?.salePrice)) && editingProduct?.salePrice !== undefined ? Number(editingProduct.salePrice) : undefined;
  const comboSavings = comboSalePrice !== undefined ? comboItemsTotal - comboSalePrice : 0;

  const comboSearchResults = useMemo(() => {
    if (editingProduct?.productType !== 'combo') return [];
    const query = comboSearch.trim().toLowerCase();
    if (!query) return [];
    const alreadyAdded = new Set(comboItems.map(item => item.productId));
    return products
      .filter(product => product.productType !== 'combo' && product.id !== editingProduct.id && !alreadyAdded.has(product.id))
      .filter(product => product.name.toLowerCase().includes(query) || Boolean(product.sku?.toLowerCase().includes(query)) || product.category.toLowerCase().includes(query))
      .slice(0, 6);
  }, [products, comboSearch, comboItems, editingProduct?.productType, editingProduct?.id]);

  const addComboItem = (product: Product) => {
    setEditingProduct(current => current ? ({
      ...current,
      comboItems: [...(current.comboItems || []), {
        productId: product.id,
        name: product.name,
        image: product.image,
        quantity: 1,
        unitPrice: Number(product.salePrice ?? product.priceMin ?? 0),
      }],
    }) : current);
    setComboSearch('');
  };

  const updateComboItem = (index: number, patch: Partial<ComboItem>) => setEditingProduct(current => current ? ({
    ...current,
    comboItems: (current.comboItems || []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
  }) : current);

  const removeComboItem = (index: number) => setEditingProduct(current => current ? ({
    ...current,
    comboItems: (current.comboItems || []).filter((_, itemIndex) => itemIndex !== index),
  }) : current);

  const filteredProducts = useMemo(() => products.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || Boolean(product.sku?.toLowerCase().includes(searchTerm.toLowerCase()))), [products, searchTerm]);
  const productPageCount = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const visibleProducts = filteredProducts.slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE);

  useEffect(() => setProductPage(1), [searchTerm]);
  useEffect(() => setProductPage(page => Math.min(page, productPageCount)), [productPageCount]);

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

  const saveCategoryChanges = async (category: Category, changes: Partial<Category>, successMessage: string) => {
    try {
      await adminFetchJson(`/api/categories/${category.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...category, ...changes })
      });
      showToast(successMessage);
      loadAllBackendData();
    } catch (err: any) {
      showToast(err.message || 'Could not update category.');
    }
  };

  const handleToggleCategoryCheckout = (category: Category) => {
    const checkoutEnabled = category.checkoutEnabled === false;
    saveCategoryChanges(category, { checkoutEnabled }, `Checkout ${checkoutEnabled ? 'enabled' : 'disabled'} for ${category.name}.`);
  };

  // Home carousels are listed in the order categories were featured: switching one on puts it last.
  const homeFeaturedCategories = categories
    .filter(category => category.homeFeaturedOrder != null)
    .sort((a, b) => (a.homeFeaturedOrder ?? 0) - (b.homeFeaturedOrder ?? 0));
  // A featured category whose main menu tab is switched off is skipped on the home page.
  const isCategoryMenuHidden = (category: Category) => Boolean(general) && !isMenuGroupEnabled(category.menuGroup || 'bakery', general!.store);
  const menuTabLabel = (category: Category) => category.menuGroup === 'food' ? 'Food Items' : category.menuGroup === 'combo' ? 'Combo Items' : 'Bakery Items';
  const nextHomeFeaturedOrder = () => Math.max(0, ...homeFeaturedCategories.map(category => category.homeFeaturedOrder ?? 0)) + 1;

  const handleToggleCategoryHome = (category: Category) => {
    const featured = category.homeFeaturedOrder == null;
    saveCategoryChanges(
      category,
      { homeFeaturedOrder: featured ? nextHomeFeaturedOrder() : null },
      featured ? `${category.name} added to the home page.` : `${category.name} removed from the home page.`
    );
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
      const data = await adminFetchJson('/api/woocommerce/test', { method: 'POST', body: JSON.stringify(getWcRequestPayload()) });
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
      const data = await adminFetchJson('/api/woocommerce/sync', { method: 'POST', body: JSON.stringify(getWcRequestPayload()) });
      setWcPreview({ products: data.products || [], categories: data.categories || [] });
      setWcStatusMsg({ type: 'success', text: `Fetched ${data.count} products from ${data.storeUrl}. Review below, then run the migration to download everything into Supabase.` });
    } catch (err: any) {
      setWcStatusMsg({ type: 'error', text: err.message || 'Could not fetch WooCommerce data.' });
    } finally {
      setWcBusy('idle');
    }
  };

  const handleWcMigrate = async () => {
    if (wcExistingItemsStrategy === 'replace' && !confirm(
      'REPLACE mode will migrate the WooCommerce catalogue, then permanently delete existing products and categories that are not in WooCommerce. Continue?'
    )) return;
    setWcBusy('migrating');
    setWcStatusMsg({ type: 'info', text: 'Migrating products, categories, and images into Supabase... this can take a minute.' });
    try {
      const data = await adminFetchJson('/api/woocommerce/migrate', {
        method: 'POST',
        body: JSON.stringify({ ...getWcRequestPayload(), existingItemsStrategy: wcExistingItemsStrategy })
      });
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
          <SidebarButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-4 h-4" />} label="Website Settings" />
          <SidebarButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users className="w-4 h-4" />} label="User Accounts & Roles" />
        </aside>

        {/* Mobile Tab Nav Selector */}
        <div className="md:hidden w-full bg-stone-900 border-b border-stone-800 p-2 flex overflow-x-auto gap-2 shrink-0 fixed top-[76px] left-0 z-30">
          {ADMIN_TABS.map((tab) => (
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => { setComboSearch(''); setEditingProduct({ name: '', priceMin: 0, category: categories.find(category => category.menuGroup === 'combo')?.name || categories[0]?.name || 'Combos', stockQuantity: 25, stockStatus: 'in_stock', productType: 'combo', comboItems: [], variants: [], modifierGroups: [] }); }}
                    className="border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Combo Pack
                  </button>
                  <button
                    onClick={() => { setComboSearch(''); setEditingProduct({ name: '', priceMin: 500, category: 'Cakes', stockQuantity: 25, stockStatus: 'in_stock', productType: 'bakery', allowAsap: true, allowScheduled: true, modifierGroups: [] }); }}
                    className="bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add New Product
                  </button>
                </div>
              </div>

              {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={editingProduct.id ? 'Edit product' : 'Create product'}>
                <form onSubmit={handleSaveProduct} className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-stone-200 bg-stone-50 p-5 shadow-2xl space-y-4 sm:p-7">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">{editingProduct.productType === 'combo' ? 'Combo management' : 'Product management'}</p><h4 className="mt-1 font-display text-xl font-bold text-brand-blue">
                      {editingProduct.productType === 'combo'
                        ? (editingProduct.id ? 'Edit Combo Pack' : 'Create New Combo Pack')
                        : (editingProduct.id ? 'Edit Product Details' : 'Create New Product')}
                    </h4></div>
                    <button type="button" onClick={() => { setEditingProduct(null); setComboSearch(''); }} className="p-1 text-gray-400 hover:text-gray-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-xs sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="font-semibold text-stone-700">Product type<select value={editingProduct.productType || 'bakery'} onChange={e => setEditingProduct({ ...editingProduct, productType: e.target.value as MenuGroup })} className="mt-1 h-10 w-full rounded-lg border border-blue-100 bg-white px-3"><option value="bakery">Bakery item</option><option value="food">Prepared food</option><option value="combo">Combo pack</option></select></label>
                      {editingProduct.productType === 'food' && <><label className="font-semibold text-stone-700">Preparation time (minutes)<input type="number" min="1" value={editingProduct.preparationMinutes || 30} onChange={e => setEditingProduct({ ...editingProduct, preparationMinutes: Number(e.target.value) })} className="mt-1 h-10 w-full rounded-lg border border-blue-100 bg-white px-3" /></label><label className="flex h-10 items-center justify-between self-end rounded-lg border border-blue-100 bg-white px-3 font-semibold text-stone-700">Allow ASAP<input type="checkbox" checked={editingProduct.allowAsap !== false} onChange={e => setEditingProduct({ ...editingProduct, allowAsap: e.target.checked })} className="h-4 w-4 accent-brand-gold" /></label><label className="flex h-10 items-center justify-between self-end rounded-lg border border-blue-100 bg-white px-3 font-semibold text-stone-700">Allow scheduled<input type="checkbox" checked={editingProduct.allowScheduled !== false} onChange={e => setEditingProduct({ ...editingProduct, allowScheduled: e.target.checked })} className="h-4 w-4 accent-brand-gold" /></label></>}
                    </div>
                  </section>

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

                  {editingProduct.productType === 'combo' && (
                    <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm sm:p-5">
                      <div className="mb-4">
                        <h5 className="font-display text-base font-bold text-brand-blue">Combo contents</h5>
                        <p className="mt-1 text-xs text-stone-500">Search the catalogue and add each item with its quantity, for example 1 cake, 15 rolls and 2 doughnuts.</p>
                      </div>

                      {/* Catalogue search */}
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          value={comboSearch}
                          onChange={e => setComboSearch(e.target.value)}
                          placeholder="Search products to add (name, SKU or category)…"
                          aria-label="Search products to add to this combo"
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-xs focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                        />
                        {comboSearch.trim() !== '' && (
                          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
                            {comboSearchResults.length === 0 ? (
                              <p className="px-4 py-3 text-xs text-stone-500">No matching product. Combos cannot contain other combos.</p>
                            ) : comboSearchResults.map(product => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => addComboItem(product)}
                                className="flex w-full items-center gap-3 border-b border-stone-100 px-3 py-2.5 text-left last:border-0 hover:bg-amber-50"
                              >
                                <img src={product.image} alt="" className="h-9 w-9 rounded-lg object-cover" />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-bold text-stone-900">{product.name}</span>
                                  <span className="block text-[10px] text-stone-400">{product.category} · {product.sku || 'No SKU'}</span>
                                </span>
                                <span className="font-mono text-xs font-bold text-brand-blue">Rs. {Number(product.salePrice ?? product.priceMin ?? 0).toLocaleString()}</span>
                                <Plus className="h-4 w-4 text-brand-gold" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Added lines */}
                      {comboItems.length === 0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center text-xs text-stone-500">
                          No items yet. Use the search box above to build this combo.
                        </div>
                      ) : (
                        <ul className="mt-4 space-y-2">
                          {comboItems.map((item, itemIndex) => (
                            <li key={`${item.productId}-${itemIndex}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:grid-cols-[auto_1fr_90px_120px_110px_auto]">
                              <img src={item.image || ''} alt="" className="h-10 w-10 rounded-lg object-cover" />
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-bold text-stone-900">{item.name}</span>
                                <span className="block text-[10px] text-stone-400 sm:hidden">Qty {item.quantity} × Rs. {Number(item.unitPrice).toLocaleString()}</span>
                              </span>
                              <label className="hidden text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:block">Qty
                                <input type="number" min="1" step="1" required value={item.quantity} onChange={e => updateComboItem(itemIndex, { quantity: Number(e.target.value) })} aria-label={`Quantity of ${item.name}`} className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2 font-mono text-xs" />
                              </label>
                              <label className="hidden text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:block">Unit price
                                <input type="number" min="0" step="0.01" required value={item.unitPrice} onChange={e => updateComboItem(itemIndex, { unitPrice: Number(e.target.value) })} aria-label={`Unit price of ${item.name}`} className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2 font-mono text-xs" />
                              </label>
                              <span className="hidden text-right font-mono text-xs font-bold text-brand-blue sm:block">Rs. {(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString()}</span>
                              <button type="button" onClick={() => removeComboItem(itemIndex)} aria-label={`Remove ${item.name} from combo`} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Pricing summary */}
                      <div className="mt-4 grid gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:grid-cols-3">
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-amber-900">Combined item value</span>
                          <span className="mt-1 block font-mono text-lg font-bold text-stone-700">Rs. {comboItemsTotal.toLocaleString()}</span>
                          <span className="mt-0.5 block text-[10px] text-amber-800/80">Shown struck through to customers</span>
                        </div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-amber-900">Combo sale value
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingProduct.salePrice ?? ''}
                            onChange={e => setEditingProduct({ ...editingProduct, salePrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                            placeholder="e.g. 2200"
                            aria-label="Combo sale value"
                            className="mt-1 w-full rounded-lg border border-amber-200 bg-white p-2.5 font-mono text-sm font-bold text-brand-blue"
                          />
                          <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-amber-800/80">Leave empty to sell at the full value</span>
                        </label>
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-amber-900">Customer saving</span>
                          {comboSavings > 0 ? (
                            <>
                              <span className="mt-1 inline-block rounded-full bg-emerald-600 px-3 py-1 font-mono text-sm font-black text-white">SAVE Rs. {comboSavings.toLocaleString()}</span>
                              <span className="mt-1 block text-[10px] text-amber-800/80">{Math.round((comboSavings / comboItemsTotal) * 100)}% off the combined value</span>
                            </>
                          ) : (
                            <span className="mt-1 block text-xs font-semibold text-stone-500">No saving badge yet — enter a sale value below Rs. {comboItemsTotal.toLocaleString()}.</span>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {editingProduct.productType !== 'combo' && <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div><h5 className="font-display text-base font-bold text-brand-blue">{editingProduct.productType === 'food' ? 'Bulk order packages' : 'Product variants'}</h5><p className="mt-1 text-xs text-stone-500">{editingProduct.productType === 'food' ? 'Set only how many people each package serves and its total price.' : 'Add sizes, flavours or other options with their own price and stock.'}</p></div>
                      <button type="button" onClick={addVariant} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> {editingProduct.productType === 'food' ? 'Add package' : 'Add variant'}</button>
                    </div>
                    {(editingProduct.variants || []).length === 0 ? <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center text-xs text-stone-500">{editingProduct.productType === 'food' ? 'No packages yet. Add at least one package before saving this food product.' : 'No variants. The main product price will be used.'}</div> : <div className="space-y-3">{(editingProduct.variants || []).map((variant, variantIndex) => (
                      <div key={variant.id || variantIndex} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-blue">{editingProduct.productType === 'food' ? 'Package' : 'Variant'} {variantIndex + 1}{variant.wcId ? ` · WC #${variant.wcId}` : ''}</span><button type="button" onClick={() => setEditingProduct(current => current ? ({ ...current, variants: (current.variants || []).filter((_, index) => index !== variantIndex) }) : current)} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50" aria-label={`Remove ${editingProduct.productType === 'food' ? 'package' : 'variant'} ${variantIndex + 1}`}><Trash2 className="h-4 w-4" /></button></div>
                        {editingProduct.productType === 'food' ? <div className="grid gap-3 text-xs sm:grid-cols-2">
                          <label className="font-semibold text-stone-700">Number of persons *<input aria-label="Number of persons" type="number" min="1" step="1" required value={variant.servesPersons ?? ''} onChange={e => updateVariant(variantIndex, { servesPersons: Number(e.target.value) })} placeholder="e.g. 5" className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2 font-mono" /></label>
                          <label className="font-semibold text-stone-700">Package price (Rs.) *<input aria-label="Package price" type="number" min="0.01" step="0.01" required value={variant.price} onChange={e => updateVariant(variantIndex, { price: Number(e.target.value) })} placeholder="e.g. 5500" className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2 font-mono" /></label>
                        </div> : <>
                        <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-5">
                          <label className="font-semibold text-stone-700">SKU<input value={variant.sku || ''} onChange={e => updateVariant(variantIndex, { sku: e.target.value })} className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2 font-mono" /></label>
                          <label className="font-semibold text-stone-700">Price *<input type="number" min="0" step="0.01" required value={variant.price} onChange={e => updateVariant(variantIndex, { price: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2 font-mono" /></label>
                          <label className="font-semibold text-stone-700">Regular price<input type="number" min="0" step="0.01" value={variant.regularPrice ?? ''} onChange={e => updateVariant(variantIndex, { regularPrice: e.target.value === '' ? undefined : Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2 font-mono" /></label>
                          <label className="font-semibold text-stone-700">Sale price<input type="number" min="0" step="0.01" value={variant.salePrice ?? ''} onChange={e => updateVariant(variantIndex, { salePrice: e.target.value === '' ? undefined : Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2 font-mono" /></label>
                          <label className="font-semibold text-stone-700">Stock<input type="number" min="0" value={variant.stockQuantity ?? 0} onChange={e => updateVariant(variantIndex, { stockQuantity: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2 font-mono" /></label>
                        </div>
                        <div className="mt-3 space-y-2">{variant.attributes.map((attribute, attributeIndex) => <div key={attributeIndex} className="grid grid-cols-[1fr_1fr_auto] gap-2"><input aria-label="Attribute name" placeholder="Option name (e.g. Size)" value={attribute.name} onChange={e => updateVariantAttribute(variantIndex, attributeIndex, 'name', e.target.value)} className="rounded-lg border border-stone-200 bg-white p-2 text-xs" /><input aria-label="Attribute value" placeholder="Value (e.g. 1 kg)" required value={attribute.option} onChange={e => updateVariantAttribute(variantIndex, attributeIndex, 'option', e.target.value)} className="rounded-lg border border-stone-200 bg-white p-2 text-xs" /><button type="button" onClick={() => updateVariant(variantIndex, { attributes: variant.attributes.filter((_, index) => index !== attributeIndex) })} className="rounded-lg border border-stone-200 p-2 text-stone-400 hover:text-rose-600"><X className="h-4 w-4" /></button></div>)}<button type="button" onClick={() => updateVariant(variantIndex, { attributes: [...variant.attributes, { name: '', option: '' }] })} className="text-xs font-bold text-brand-blue">+ Add another attribute</button></div>
                        </>}
                      </div>
                    ))}</div>}
                  </section>}

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1 text-xs">Description</label>
                    <textarea rows={2} value={editingProduct.description || ''} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-xs" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {editingProduct.productType !== 'food' && editingProduct.productType !== 'combo' && <div>
                      <label className="block font-semibold text-gray-700 mb-1">Regular Price (Rs.)</label>
                      <input type="number" required value={editingProduct.priceMin || 0} onChange={(e) => setEditingProduct({ ...editingProduct, priceMin: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg font-mono" />
                    </div>}
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

                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs">
                    <p className="mb-3 font-bold text-brand-blue">Product SEO overrides</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input type="text" placeholder="SEO title (uses site default when empty)" value={editingProduct.seo?.metaTitle || ''} onChange={e => setEditingProduct({ ...editingProduct, seo: { ...editingProduct.seo, metaTitle: e.target.value } })} className="rounded-lg border border-blue-100 bg-white p-2" />
                      <input type="text" placeholder="Open Graph image URL" value={editingProduct.seo?.ogImage || ''} onChange={e => setEditingProduct({ ...editingProduct, seo: { ...editingProduct.seo, ogImage: e.target.value } })} className="rounded-lg border border-blue-100 bg-white p-2" />
                      <textarea rows={2} placeholder="Meta description" value={editingProduct.seo?.metaDescription || ''} onChange={e => setEditingProduct({ ...editingProduct, seo: { ...editingProduct.seo, metaDescription: e.target.value } })} className="rounded-lg border border-blue-100 bg-white p-2 sm:col-span-2" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => { setEditingProduct(null); setComboSearch(''); }} className="px-4 py-2 border rounded-lg text-xs font-semibold">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-brand-gold text-white font-bold text-xs rounded-lg shadow-sm">{editingProduct.productType === 'combo' ? 'Save Combo' : 'Save Product'}</button>
                  </div>
                </form>
                </div>
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
                    {visibleProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/80">
                          <td className="p-3.5 flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <span className="font-bold text-gray-900 block">{p.name}</span>
                              <span className={`mr-1 text-[9px] font-bold uppercase ${p.productType === 'food' ? 'text-orange-700' : p.productType === 'combo' ? 'text-emerald-700' : 'text-blue-700'}`}>{p.productType === 'food' ? 'Food' : p.productType === 'combo' ? 'Combo' : 'Bakery'}</span>
                              {p.isFeatured && <span className="text-[9px] bg-brand-gold/20 text-brand-gold font-bold px-1.5 py-0.5 rounded">Featured</span>}
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-gray-500">{p.sku || 'N/A'}</td>
                          <td className="p-3.5">{p.category}</td>
                          <td className="p-3.5 font-bold font-mono text-brand-blue">Rs. {p.priceMin}{p.priceMax && p.priceMax !== p.priceMin ? `–${p.priceMax}` : ''}{p.productType === 'combo' && p.regularPrice && p.regularPrice > p.priceMin ? <span className="mt-1 block text-[9px] font-sans text-emerald-700">Save Rs. {(p.regularPrice - p.priceMin).toLocaleString()} · {p.comboItems?.length || 0} items</span> : p.variants?.length ? <span className="mt-1 block text-[9px] font-sans text-stone-400">{p.variants.length} {p.productType === 'food' ? 'packages' : 'variants'}</span> : null}</td>
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
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50 px-4 py-3 text-xs text-stone-500"><span>Showing {filteredProducts.length === 0 ? 0 : (productPage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(productPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}</span><div className="flex items-center gap-2"><button type="button" disabled={productPage <= 1} onClick={() => setProductPage(page => page - 1)} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-bold text-brand-blue disabled:opacity-40">Previous</button><span className="font-bold text-stone-700">Page {productPage} of {productPageCount}</span><button type="button" disabled={productPage >= productPageCount} onClick={() => setProductPage(page => page + 1)} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-bold text-brand-blue disabled:opacity-40">Next</button></div></div>
              </div>
            </div>
          )}

          {/* --- CATEGORIES --- */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Category Management</h3>
                <button onClick={() => setEditingCategory({ name: '', description: '', isFeatured: true, menuGroup: 'bakery' })} className="bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              </div>

              {editingCategory && (
                <form onSubmit={handleSaveCategory} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 text-xs">
                  <input type="text" placeholder="Category Name (e.g. Pastries)" required value={editingCategory.name || ''} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="w-full p-2 border rounded-lg" />
                  <label className="block font-semibold text-gray-700">
                    Main menu tab
                    <select
                      value={editingCategory.menuGroup || 'bakery'}
                      onChange={(e) => setEditingCategory({ ...editingCategory, menuGroup: e.target.value as MenuGroup })}
                      className="mt-1 w-full rounded-lg border p-2 font-normal"
                    >
                      <option value="bakery">Bakery Items</option>
                      <option value="food">Food Items</option>
                      <option value="combo">Combo Items</option>
                    </select>
                    <span className="mt-1 block font-normal text-[10px] text-gray-400">This category appears as a sub tab under the selected main menu tab.</span>
                  </label>
                  <input type="text" placeholder="Image URL" value={editingCategory.image || ''} onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })} className="w-full p-2 border rounded-lg" />
                  <label className="flex items-start gap-2 font-semibold text-gray-700">
                    <input type="checkbox" checked={editingCategory.checkoutEnabled !== false} onChange={(e) => setEditingCategory({ ...editingCategory, checkoutEnabled: e.target.checked })} className="mt-0.5 h-4 w-4 accent-amber-500" />
                    <span>
                      Allow checkout
                      <span className="mt-0.5 block font-normal text-[10px] text-gray-400">When off, products in this category stay visible but can't be opened, added to the cart or ordered.</span>
                    </span>
                  </label>
                  <div className="rounded-lg border border-gray-200 p-3 space-y-2">
                    <label className="flex items-start gap-2 font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={editingCategory.homeFeaturedOrder != null}
                        onChange={(e) => setEditingCategory({ ...editingCategory, homeFeaturedOrder: e.target.checked ? nextHomeFeaturedOrder() : null })}
                        className="mt-0.5 h-4 w-4 accent-amber-500"
                      />
                      <span>
                        Show on home page
                        <span className="mt-0.5 block font-normal text-[10px] text-gray-400">Adds a product carousel for this category to the home page, after the categories already featured.</span>
                      </span>
                    </label>
                    {editingCategory.homeFeaturedOrder != null && <>
                      <input type="text" placeholder={`Carousel title (default: ${editingCategory.name || 'category name'})`} value={editingCategory.homeTitle || ''} onChange={(e) => setEditingCategory({ ...editingCategory, homeTitle: e.target.value })} className="w-full p-2 border rounded-lg" />
                      <textarea rows={2} placeholder="Short description shown under the title" value={editingCategory.homeDescription || ''} onChange={(e) => setEditingCategory({ ...editingCategory, homeDescription: e.target.value })} className="w-full p-2 border rounded-lg" />
                    </>}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingCategory(null)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-brand-gold text-white font-bold rounded-lg">Save Category</button>
                  </div>
                </form>
              )}

              {/* Home page order at a glance */}
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-xs">
                <p className="font-bold text-gray-700">Home page carousels</p>
                {homeFeaturedCategories.length === 0
                  ? <p className="mt-1 text-gray-400">No categories are featured yet. Switch on “Home page” on a category below to add its carousel.</p>
                  : <ol className="mt-2 flex flex-wrap gap-2">{homeFeaturedCategories.map((c, index) => (
                      <li key={c.id} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${isCategoryMenuHidden(c) ? 'bg-stone-100 text-stone-400 line-through' : 'bg-amber-50 text-amber-900'}`}><span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white ${isCategoryMenuHidden(c) ? 'bg-stone-300' : 'bg-amber-500'}`}>{index + 1}</span>{c.homeTitle || c.name}</li>
                    ))}</ol>}
                {homeFeaturedCategories.some(isCategoryMenuHidden) && (
                  <p className="mt-2 text-[11px] text-amber-700">Crossed-out categories are not shown on the home page because their menu tab is switched off in Website Settings → Store &amp; catalogue → Menu tabs.</p>
                )}
              </div>

              {/* One section per main menu tab, in storefront order */}
              {MENU_GROUPS.map((group) => {
                const groupCategories = categories.filter(c => (c.menuGroup || 'bakery') === group.id);
                const GroupIcon = group.icon;
                const groupHidden = Boolean(general) && !isMenuGroupEnabled(group.id, general!.store);
                return (
              <section key={group.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-blue text-brand-gold"><GroupIcon className="h-4 w-4" /></span>
                    <h4 className="text-sm font-bold text-gray-800">{group.label}</h4>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{groupCategories.length}</span>
                    {groupHidden && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Menu switched off</span>}
                  </div>
                  <button type="button" onClick={() => { setEditingCategory({ name: '', description: '', isFeatured: true, menuGroup: group.id }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-blue hover:bg-brand-blue/5">
                    <Plus className="h-3.5 w-3.5" /> Add to {group.label}
                  </button>
                </div>
                {groupCategories.length === 0 && <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-xs text-gray-400">No categories in {group.label} yet.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {groupCategories.map((c) => {
                  const homePosition = homeFeaturedCategories.findIndex(item => item.id === c.id);
                  const miniSwitch = (on: boolean, onClick: () => void, label: string, onClass: string) => (
                    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? onClass : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  );
                  return (
                    <div key={c.id} className="bg-white rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3 p-4">
                        <img src={c.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=200'} alt={c.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{c.name}</h4>
                          <span className="text-xs text-gray-400">{c.count || 0} products</span>
                          {homePosition >= 0 && isCategoryMenuHidden(c) && <span className="mt-1 block text-[10px] font-semibold text-amber-700">Not on home page: {menuTabLabel(c)} menu is switched off</span>}
                        </div>
                        <div className="flex items-center gap-1 self-start">
                          <button onClick={() => setEditingCategory(c)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" aria-label={`Edit ${c.name}`}><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" aria-label={`Delete ${c.name}`}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 text-[11px]">
                        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                          <span className="font-semibold text-gray-600">Home page{homePosition >= 0 && <span className="ml-1 font-bold text-amber-600">#{homePosition + 1}</span>}</span>
                          {miniSwitch(homePosition >= 0, () => handleToggleCategoryHome(c), `Show ${c.name} on home page`, 'bg-amber-500')}
                        </div>
                        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                          <span className={`font-semibold ${c.checkoutEnabled === false ? 'text-rose-600' : 'text-gray-600'}`}>Checkout</span>
                          {miniSwitch(c.checkoutEnabled !== false, () => handleToggleCategoryCheckout(c), `Allow checkout for ${c.name}`, 'bg-emerald-500')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              </section>
                );
              })}
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
                        <td className="p-3.5 font-bold font-mono text-brand-blue">{ord.orderNumber}<span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] uppercase ${ord.orderType === 'food' ? 'bg-orange-100 text-orange-800' : ord.orderType === 'mixed' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>{ord.orderType || 'bakery'}</span>{ord.requestedFulfillmentAt && <span className="mt-1 block font-sans text-[9px] font-normal text-stone-400">{ord.orderMode === 'asap' ? 'ASAP' : 'Scheduled'} · {new Date(ord.requestedFulfillmentAt).toLocaleString('en-LK', { timeZone: 'Asia/Colombo', dateStyle: 'short', timeStyle: 'short' })}</span>}</td>
                        <td className="p-3.5">
                          <span className="font-semibold text-gray-900 block">{ord.customerName}</span>
                          <span className="text-gray-400 text-[10px] block">{ord.customerPhone}</span>
                        </td>
                        <td className="p-3.5">{ord.pickupBranch}</td>
                        <td className="p-3.5 font-bold font-mono">Rs. {ord.total}</td>
                        <td className="p-3.5">
                          <select value={ord.status} onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)} className="p-1 border rounded-md text-xs font-semibold bg-white">
                            {(general?.orders.availableStatuses || ['pending_payment', 'processing', 'ready_for_pickup', 'completed', 'cancelled']).map(status => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
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
                  <input type="url" name="woocommerce-store-url" autoComplete="off" value={wcForm.url} onChange={(e) => setWcForm({ ...wcForm, url: e.target.value })} placeholder="https://yourwoocommercestore.com" className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B1354] font-mono" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-[#0B1354]" /> Consumer Key
                    </label>
                    <input type="text" name="woocommerce-consumer-key" autoComplete="off" value={wcForm.consumerKey} onChange={(e) => setWcForm({ ...wcForm, consumerKey: e.target.value })} placeholder={wcSettings?.hasConsumerKey ? '••••••••••• (saved)' : 'ck_xxxxxxxxxxxxxxxxxxxx'} className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B1354] font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-[#0B1354]" /> Consumer Secret
                    </label>
                    <input type="password" name="woocommerce-consumer-secret" autoComplete="new-password" value={wcForm.consumerSecret} onChange={(e) => setWcForm({ ...wcForm, consumerSecret: e.target.value })} placeholder={wcSettings?.hasConsumerSecret ? '••••••••••• (saved)' : 'cs_xxxxxxxxxxxxxxxxxxxx'} className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B1354] font-mono" />
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

                <fieldset className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <legend className="px-1 text-xs font-bold uppercase tracking-wider text-gray-700">Existing catalogue items</legend>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <label className={`cursor-pointer rounded-xl border p-3 transition ${wcExistingItemsStrategy === 'keep' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                      <span className="flex items-start gap-2.5">
                        <input type="radio" name="existingItemsStrategy" value="keep" checked={wcExistingItemsStrategy === 'keep'} onChange={() => setWcExistingItemsStrategy('keep')} className="mt-0.5" />
                        <span><strong className="block text-xs text-gray-800">Keep existing items</strong><span className="mt-1 block text-[10px] leading-4 text-gray-500">Update matching imports and keep manual or older catalogue items.</span></span>
                      </span>
                    </label>
                    <label className={`cursor-pointer rounded-xl border p-3 transition ${wcExistingItemsStrategy === 'replace' ? 'border-rose-500 bg-rose-50' : 'border-gray-200 bg-white'}`}>
                      <span className="flex items-start gap-2.5">
                        <input type="radio" name="existingItemsStrategy" value="replace" checked={wcExistingItemsStrategy === 'replace'} onChange={() => setWcExistingItemsStrategy('replace')} className="mt-0.5" />
                        <span><strong className="block text-xs text-gray-800">Replace old catalogue</strong><span className="mt-1 block text-[10px] leading-4 text-rose-600">After a successful import, delete products and categories not found in WooCommerce.</span></span>
                      </span>
                    </label>
                  </div>
                </fieldset>

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
            <SettingsManager initialSettings={general} onSaved={setGeneral} showToast={showToast} />
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
