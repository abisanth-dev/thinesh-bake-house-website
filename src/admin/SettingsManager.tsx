import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Bot, Building2, ChefHat, ClipboardList, CreditCard, Download, Files, Image as ImageIcon, LayoutTemplate,
  MessageCircle, Paintbrush, Palette, PanelTop, Plus, RotateCcw, Save, Search, Store, Trash2, Truck, Upload, Wrench,
} from 'lucide-react';
import { GeneralSettings, OrderStatus } from '../types';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from '../siteSettings';
import { adminFetchJson } from './adminApi';

type SettingsTab =
  | 'general' | 'branding' | 'homepage'
  | 'pages' | 'header-footer' | 'appearance' | 'seo'
  | 'store' | 'orders' | 'payments' | 'delivery' | 'food-ordering'
  | 'contact-social' | 'assistant' | 'system';

interface SettingsManagerProps {
  initialSettings: GeneralSettings;
  onSaved: (settings: GeneralSettings) => void;
  showToast: (message: string) => void;
}

const NAV_GROUPS: Array<{ label: string; items: Array<{ id: SettingsTab; label: string; description: string; icon: typeof Store }> }> = [
  {
    label: 'Business',
    items: [
      { id: 'general', label: 'Business details', description: 'Site name, business information and contact details.', icon: Building2 },
      { id: 'branding', label: 'Branding', description: 'Logos, favicon and the default product image.', icon: Palette },
      { id: 'homepage', label: 'Homepage', description: 'Choose which sections appear on the home page.', icon: LayoutTemplate },
    ],
  },
  {
    label: 'Storefront',
    items: [
      { id: 'pages', label: 'Pages', description: 'Switch storefront pages on or off.', icon: Files },
      { id: 'header-footer', label: 'Header & footer', description: 'Announcement bar, header icons and footer content.', icon: PanelTop },
      { id: 'appearance', label: 'Appearance', description: 'Brand colours, fonts and custom styling.', icon: Paintbrush },
      { id: 'seo', label: 'SEO & tracking', description: 'Search engine defaults, social sharing and analytics.', icon: Search },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { id: 'store', label: 'Store & catalogue', description: 'Menu tabs, currency, tax, limits and customer features.', icon: Store },
      { id: 'orders', label: 'Orders', description: 'Order numbers, statuses, rules and notifications.', icon: ClipboardList },
      { id: 'payments', label: 'Payments', description: 'Payment methods offered at checkout.', icon: CreditCard },
      { id: 'delivery', label: 'Delivery & pickup', description: 'Fulfilment options, fees and delivery areas.', icon: Truck },
      { id: 'food-ordering', label: 'Food ordering', description: 'Kitchen hours, ASAP and scheduled food orders.', icon: ChefHat },
    ],
  },
  {
    label: 'Communication',
    items: [
      { id: 'contact-social', label: 'Contact & social', description: 'Contact page, WhatsApp, notifications and social links.', icon: MessageCircle },
      { id: 'assistant', label: 'Chat assistant', description: 'The Claude-powered chat bubble that answers customer questions.', icon: Bot },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'system', label: 'System', description: 'Maintenance mode, localization and backups.', icon: Wrench },
    ],
  },
];
const NAV_ITEMS = NAV_GROUPS.flatMap(group => group.items);

// Settings each page owns, as a whole section or a single "section.field". "Reset to defaults"
// restores only these, so resetting one page never touches fields shown on another.
const TAB_FIELDS: Record<SettingsTab, string[]> = {
  general: ['identity.siteTitle', 'identity.tagline', 'business'],
  branding: ['identity.logoUrl', 'identity.darkLogoUrl', 'identity.mobileLogoUrl', 'identity.faviconUrl', 'identity.browserThemeColor', 'identity.placeholderProductImageUrl', 'footer.logoUrl'],
  homepage: ['homepage'],
  pages: ['pages'],
  'header-footer': ['header', 'footer.description', 'footer.copyrightText', 'footer.showContactDetails', 'footer.newsletterEnabled', 'footer.paymentMethodLogos', 'footer.quickLinks', 'footer.privacyPolicyUrl', 'footer.termsUrl', 'footer.refundPolicyUrl', 'footer.deliveryPolicyUrl'],
  appearance: ['appearance'],
  seo: ['seo'],
  store: ['store'],
  orders: ['orders'],
  payments: ['payments'],
  delivery: ['delivery'],
  'food-ordering': ['foodOrdering'],
  'contact-social': ['contact', 'social'],
  assistant: ['assistant'],
  system: ['system.maintenanceMode', 'system.maintenanceMessage', 'system.maintenanceImageUrl', 'system.allowAdminDuringMaintenance', 'system.timezone', 'system.dateFormat', 'system.timeFormat', 'system.defaultLanguage'],
};

const SOCIAL_LABELS: Record<keyof GeneralSettings['social'], string> = {
  facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', whatsapp: 'WhatsApp', linkedin: 'LinkedIn',
};

const inputClass = 'block h-9 w-full rounded-lg border border-stone-300 bg-white px-3 text-[13px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 disabled:bg-stone-50 disabled:text-stone-400';

/* ---------- Layout primitives ---------- */

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <header className="border-b border-stone-100 px-5 py-4">
        <h3 className="text-sm font-bold text-stone-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs leading-5 text-stone-500">{description}</p>}
      </header>
      <div className="divide-y divide-stone-100">{children}</div>
    </section>
  );
}

// One setting: label and help text on the left, the control on the right (stacked on small screens).
function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 px-5 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-6">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-stone-800">{label}</p>
        {description && <p className="mt-0.5 text-xs leading-5 text-stone-500">{description}</p>}
      </div>
      <div className="min-w-0 self-center">{children}</div>
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 ${checked ? 'bg-brand-blue' : 'bg-stone-300'}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

function SwitchRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-stone-800">{label}</p>
        {description && <p className="mt-0.5 text-xs leading-5 text-stone-500">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/* ---------- Controls ---------- */

function TextInput({ value, onChange, type = 'text', placeholder, suffix, disabled }: { value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string; suffix?: string; disabled?: boolean }) {
  if (!suffix) return <input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={e => onChange(e.target.value)} className={inputClass} />;
  return (
    <div className="flex">
      <input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={e => onChange(e.target.value)} className={`${inputClass} rounded-r-none`} />
      <span className="inline-flex shrink-0 items-center rounded-r-lg border border-l-0 border-stone-300 bg-stone-50 px-3 text-xs font-medium text-stone-500">{suffix}</span>
    </div>
  );
}

function TextArea({ value, onChange, rows = 3, placeholder, mono }: { value: string; onChange: (value: string) => void; rows?: number; placeholder?: string; mono?: boolean }) {
  return <textarea rows={rows} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className={`${inputClass} h-auto resize-y py-2 leading-5 ${mono ? 'font-mono text-xs' : ''}`} />;
}

function Select({ value, options, onChange }: { value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <select value={value} onChange={e => onChange(e.target.value)} className={inputClass}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}

function ColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-stone-300 bg-white p-1" aria-label="Pick colour" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`${inputClass} max-w-[140px] font-mono uppercase`} />
    </div>
  );
}

// Edits a string list as delimited text, committing on blur so separators can be typed freely.
function ListInput({ value, onChange, separator, placeholder, rows }: { value: string[]; onChange: (value: string[]) => void; separator: ',' | '\n'; placeholder?: string; rows?: number }) {
  const joined = value.join(separator === ',' ? ', ' : '\n');
  const [text, setText] = useState(joined);
  useEffect(() => setText(joined), [joined]);
  const commit = () => onChange(text.split(separator).map(item => item.trim()).filter(Boolean));
  if (separator === '\n') {
    return <textarea rows={rows || 3} value={text} placeholder={placeholder} onChange={e => setText(e.target.value)} onBlur={commit} className={`${inputClass} h-auto resize-y py-2 font-mono text-xs leading-5`} />;
  }
  return <input value={text} placeholder={placeholder} onChange={e => setText(e.target.value)} onBlur={commit} className={inputClass} />;
}

function WeekdaySelector({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label, day) => {
        const selected = value.includes(day);
        return (
          <button
            key={label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? value.filter(item => item !== day) : [...value, day].sort())}
            className={`h-9 min-w-12 rounded-lg border px-3 text-xs font-semibold transition ${selected ? 'border-brand-blue bg-brand-blue text-white' : 'border-stone-300 bg-white text-stone-500 hover:border-stone-400'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Notice({ tone = 'info', children }: { tone?: 'info' | 'warning'; children: React.ReactNode }) {
  return (
    <div className={`flex gap-2.5 px-5 py-3.5 text-xs leading-5 ${tone === 'warning' ? 'bg-amber-50 text-amber-900' : 'bg-stone-50 text-stone-600'}`}>
      <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone === 'warning' ? 'text-amber-600' : 'text-stone-400'}`} />
      <div>{children}</div>
    </div>
  );
}

/* ---------- Settings page ---------- */

// Settings pages live at /admin/settings/<page> ("general" is plain /admin/settings) so a refresh stays on the same page.
const settingsTabFromPath = (path: string): SettingsTab => {
  const segment = path.replace(/^\/admin\/settings\/?/, '').split('/')[0];
  return NAV_ITEMS.some(item => item.id === segment) ? segment as SettingsTab : 'general';
};
const settingsTabPath = (tab: SettingsTab) => (tab === 'general' ? '/admin/settings' : `/admin/settings/${tab}`);

export default function SettingsManager({ initialSettings, onSaved, showToast }: SettingsManagerProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => settingsTabFromPath(window.location.pathname));
  const [saved, setSaved] = useState(() => mergeSiteSettings(initialSettings));
  const [draft, setDraft] = useState(() => mergeSiteSettings(initialSettings));
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);
  const activeItem = NAV_ITEMS.find(item => item.id === activeTab) || NAV_ITEMS[0];

  useEffect(() => {
    const next = mergeSiteSettings(initialSettings);
    setSaved(next); setDraft(next);
  }, [initialSettings]);

  // The rate Dialog Genie charges with, fetched live by the server (falls back to the saved rate).
  const [genieRate, setGenieRate] = useState<{ rate: number | null; source?: string; fetchedAt?: string } | null>(null);
  useEffect(() => {
    if (activeTab !== 'payments') return;
    fetch('/api/payments/genie/rate').then(response => response.json()).then(setGenieRate).catch(() => setGenieRate({ rate: null }));
  }, [activeTab, saved.store.currency, saved.payments.dialogGenieExchangeRate]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = (section: keyof GeneralSettings, field: string, value: unknown) => setDraft(current => ({ ...current, [section]: { ...(current[section] as any), [field]: value } }));
  const number = (section: keyof GeneralSettings, field: string, value: string) => update(section, field, Number(value || 0));
  const setPath = (path: string, value: unknown) => { const [section, key] = path.split('.'); update(section as keyof GeneralSettings, key, value); };

  // Edits on every page share one draft, so switching pages keeps unsaved changes and one save publishes them all.
  const changeTab = (next: SettingsTab) => {
    setActiveTab(next);
    const nextPath = settingsTabPath(next);
    if (window.location.pathname !== nextPath) window.history.pushState({ tab: 'settings', settingsTab: next }, '', nextPath);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin/settings')) setActiveTab(settingsTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      // Rows added with "Add link" / "Add area" but left blank are dropped rather than published.
      const payload: GeneralSettings = {
        ...draft,
        footer: { ...draft.footer, quickLinks: draft.footer.quickLinks.filter(link => link.label.trim() && link.url.trim()) },
        delivery: { ...draft.delivery, areas: draft.delivery.areas.filter(area => area.name.trim()) },
      };
      const response = await adminFetchJson('/api/settings/general', { method: 'PUT', body: JSON.stringify(payload) });
      const next = mergeSiteSettings(response.general);
      setSaved(next); setDraft(next); onSaved(next); showToast('Settings saved.');
    } catch (error: any) { showToast(error.message || 'Could not save settings.'); }
    finally { setSaving(false); }
  };

  const discard = () => setDraft(saved);

  const resetTab = () => {
    if (!confirm(`Reset “${activeItem.label}” to the default values? You still need to save to publish the reset.`)) return;
    setDraft(current => {
      const next: any = structuredClone(current);
      for (const path of TAB_FIELDS[activeTab]) {
        const [section, key] = path.split('.');
        if (key) next[section][key] = structuredClone((DEFAULT_SITE_SETTINGS as any)[section][key]);
        else next[section] = structuredClone((DEFAULT_SITE_SETTINGS as any)[section]);
      }
      return next;
    });
  };

  const uploadImage = (path: string, file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) return showToast('Use a PNG, JPEG, WebP, or GIF image.');
    if (file.size > 5 * 1024 * 1024) return showToast('Image files must be 5 MB or smaller.');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await adminFetchJson('/api/upload', { method: 'POST', body: JSON.stringify({ image: reader.result, fileName: file.name }) });
        setPath(path, response.url); showToast('Image uploaded. Save to publish it.');
      } catch (error: any) { showToast(error.message || 'Image upload failed.'); }
    };
    reader.readAsDataURL(file);
  };

  const imageInput = (path: string, value: string) => (
    <div className="flex items-center gap-3">
      {value
        ? <img src={value} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-stone-200 bg-stone-50 object-contain" />
        : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 text-stone-400"><ImageIcon className="h-4 w-4" /></div>}
      <div className="min-w-0 flex-1 space-y-2">
        <input type="url" value={value} placeholder="https://…" onChange={e => setPath(path, e.target.value)} className={inputClass} />
        <div className="flex gap-2">
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50">
            <Upload className="h-3.5 w-3.5" /> Upload
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={e => uploadImage(path, e.target.files?.[0])} />
          </label>
          {value && <button type="button" onClick={() => setPath(path, '')} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Remove</button>}
        </div>
      </div>
    </div>
  );

  const importSettings = (file?: File) => {
    if (!file || file.size > 1024 * 1024) return showToast('Select a settings JSON file smaller than 1 MB.');
    const reader = new FileReader();
    reader.onload = () => { try { setDraft(mergeSiteSettings(JSON.parse(String(reader.result)))); showToast('Settings imported. Review and save to publish.'); } catch { showToast('Invalid settings JSON file.'); } };
    reader.readAsText(file);
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'tbh-site-settings.json'; link.click(); URL.revokeObjectURL(link.href);
  };

  const updateSocial = (platform: keyof GeneralSettings['social'], field: 'enabled' | 'url', value: unknown) =>
    setDraft(current => ({ ...current, social: { ...current.social, [platform]: { ...current.social[platform], [field]: value } } }));
  const socialKeys = Object.keys(draft.social) as Array<keyof GeneralSettings['social']>;

  const quickLinks = draft.footer.quickLinks;
  const setQuickLinks = (links: typeof quickLinks) => update('footer', 'quickLinks', links);
  const areas = draft.delivery.areas;
  const setAreas = (next: typeof areas) => update('delivery', 'areas', next);

  const environmentOptions = [{ value: 'sandbox', label: 'Sandbox (testing)' }, { value: 'live', label: 'Live payments' }];

  return (
    <div className="text-stone-800">
      {/* Page header */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">Settings</h2>
          <p className="mt-1 text-sm text-stone-500">Manage how your store looks, sells and communicates.</p>
        </div>
        {dirty && <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 sm:self-auto"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved changes</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Section navigation */}
        <nav aria-label="Settings sections" className="lg:self-start">
          <select value={activeTab} onChange={e => changeTab(e.target.value as SettingsTab)} className={`${inputClass} lg:hidden`} aria-label="Settings section">
            {NAV_GROUPS.map(group => <optgroup key={group.label} label={group.label}>{group.items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup>)}
          </select>
          <div className="hidden space-y-5 lg:block">
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">{group.label}</p>
                <ul className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = item.id === activeTab;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => changeTab(item.id)}
                          aria-current={active ? 'page' : undefined}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition ${active ? 'bg-white text-brand-blue shadow-sm ring-1 ring-stone-200' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-brand-gold' : 'text-stone-400'}`} />
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Section content */}
        <div className="min-w-0 max-w-4xl space-y-5 pb-24">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">{activeItem.label}</h2>
              <p className="mt-0.5 text-sm text-stone-500">{activeItem.description}</p>
            </div>
            <button type="button" onClick={resetTab} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-800">
              <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
            </button>
          </div>

          {activeTab === 'general' && <>
            <Card title="Website identity" description="How your store is named across the website and in browser tabs.">
              <Row label="Site title"><TextInput value={draft.identity.siteTitle} onChange={v => update('identity', 'siteTitle', v)} /></Row>
              <Row label="Tagline" description="A short line shown with your logo."><TextInput value={draft.identity.tagline} onChange={v => update('identity', 'tagline', v)} /></Row>
            </Card>
            <Card title="Business information">
              <Row label="Business name"><TextInput value={draft.business.name} onChange={v => update('business', 'name', v)} /></Row>
              <Row label="Registration number" description="Optional company registration number."><TextInput value={draft.business.registrationNumber} onChange={v => update('business', 'registrationNumber', v)} /></Row>
              <Row label="Address"><TextArea rows={2} value={draft.business.address} onChange={v => update('business', 'address', v)} /></Row>
              <Row label="Opening hours" description="Shown in the footer, e.g. “Daily · 7:00 AM–9:30 PM”."><TextInput value={draft.business.openingHours} onChange={v => update('business', 'openingHours', v)} /></Row>
              <Row label="Google Maps link"><TextInput type="url" placeholder="https://maps.google.com/…" value={draft.business.googleMapsUrl} onChange={v => update('business', 'googleMapsUrl', v)} /></Row>
            </Card>
            <Card title="Phone & email" description="How customers and your team reach the business.">
              <Row label="Primary phone"><TextInput type="tel" value={draft.business.primaryPhone} onChange={v => update('business', 'primaryPhone', v)} /></Row>
              <Row label="Secondary phone"><TextInput type="tel" value={draft.business.secondaryPhone} onChange={v => update('business', 'secondaryPhone', v)} /></Row>
              <Row label="WhatsApp number" description="International format without “+”, e.g. 94777259245."><TextInput value={draft.business.whatsappNumber} onChange={v => update('business', 'whatsappNumber', v)} /></Row>
              <Row label="Customer support email"><TextInput type="email" value={draft.business.supportEmail} onChange={v => update('business', 'supportEmail', v)} /></Row>
              <Row label="Order notification email" description="Receives new-order alerts. Never shown publicly."><TextInput type="email" value={draft.business.orderNotificationEmail} onChange={v => update('business', 'orderNotificationEmail', v)} /></Row>
            </Card>
          </>}

          {activeTab === 'branding' && <>
            <Card title="Logos" description="Uploaded images stay as a draft until you save.">
              <Row label="Website logo" description="Shown in the header on desktop.">{imageInput('identity.logoUrl', draft.identity.logoUrl)}</Row>
              <Row label="Mobile logo" description="Shown in the header on phones.">{imageInput('identity.mobileLogoUrl', draft.identity.mobileLogoUrl)}</Row>
              <Row label="Dark-mode logo">{imageInput('identity.darkLogoUrl', draft.identity.darkLogoUrl)}</Row>
              <Row label="Footer logo">{imageInput('footer.logoUrl', draft.footer.logoUrl)}</Row>
            </Card>
            <Card title="Browser & placeholders">
              <Row label="Favicon" description="The small icon in browser tabs. Square images work best.">{imageInput('identity.faviconUrl', draft.identity.faviconUrl)}</Row>
              <Row label="Browser theme colour" description="Colours the browser bar on mobile."><ColorInput value={draft.identity.browserThemeColor} onChange={v => update('identity', 'browserThemeColor', v)} /></Row>
              <Row label="Product placeholder image" description="Used for products without a photo.">{imageInput('identity.placeholderProductImageUrl', draft.identity.placeholderProductImageUrl)}</Row>
            </Card>
            <Card title="Logo preview">
              <div className="px-5 py-4">
                <div className="mb-3 inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                  {(['desktop', 'mobile'] as const).map(mode => (
                    <button key={mode} type="button" onClick={() => setPreviewMode(mode)} className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${previewMode === mode ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}>{mode}</button>
                  ))}
                </div>
                <div className={`flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 ${previewMode === 'mobile' ? 'max-w-xs' : ''}`}>
                  <img src={previewMode === 'mobile' ? draft.identity.mobileLogoUrl : draft.identity.logoUrl} alt="Logo preview" style={{ height: draft.header.logoSize }} className="max-w-full object-contain" />
                  <div><p className="text-sm font-bold text-brand-blue">{draft.identity.siteTitle}</p><p className="text-xs text-stone-500">{draft.identity.tagline}</p></div>
                </div>
              </div>
            </Card>
          </>}

          {activeTab === 'homepage' && <>
            <Card title="Page sections" description="Turn home page sections on or off.">
              <SwitchRow label="Hero slider" description="Large rotating banner at the top. Slides are managed under Hero Carousel Sliders." checked={draft.homepage.heroEnabled} onChange={v => update('homepage', 'heroEnabled', v)} />
              <SwitchRow label="Browse Our Categories" description="Cards linking to the Bakery, Food and Combo menus." checked={draft.homepage.categoryShowcaseEnabled} onChange={v => update('homepage', 'categoryShowcaseEnabled', v)} />
              <SwitchRow label="Promotional banner" description="Featured offers below the category cards." checked={draft.homepage.promotionalBannerEnabled} onChange={v => update('homepage', 'promotionalBannerEnabled', v)} />
              <SwitchRow label="Customer testimonials" checked={draft.homepage.testimonialsEnabled} onChange={v => update('homepage', 'testimonialsEnabled', v)} />
              <SwitchRow label="Newsletter sign-up" checked={draft.homepage.newsletterEnabled} onChange={v => update('homepage', 'newsletterEnabled', v)} />
              <Notice>Product carousels are chosen per category: in <strong>Category Tree</strong>, switch on “Show on home page” for each category to feature. They appear in the order you switch them on.</Notice>
            </Card>
            <Card title="Category card images" description="Artwork for the cards under “Browse Our Categories”. Landscape (16:9) images work best. Leave empty to use a category or product photo.">
              <Row label="Bakery Items card">{imageInput('homepage.bakeryCardImageUrl', draft.homepage.bakeryCardImageUrl)}</Row>
              <Row label="Food Items card">{imageInput('homepage.foodCardImageUrl', draft.homepage.foodCardImageUrl)}</Row>
              <Row label="Combo Items card">{imageInput('homepage.comboCardImageUrl', draft.homepage.comboCardImageUrl)}</Row>
            </Card>
          </>}

          {activeTab === 'pages' && <>
            <Card title="Storefront pages" description="A page that is switched off disappears from the header and footer, and its address opens the home page instead.">
              <Row label="Home" description="The home page is always on."><span className="text-xs font-semibold text-stone-400">Always on</span></Row>
              <SwitchRow label="Menu" description="The full product menu with the Bakery, Food and Combo tabs." checked={draft.pages.menuEnabled} onChange={v => update('pages', 'menuEnabled', v)} />
              <SwitchRow label="Promotions" description="Current offers and coupon codes." checked={draft.pages.promotionsEnabled} onChange={v => update('pages', 'promotionsEnabled', v)} />
              <SwitchRow label="Our Branches" description="Branch list with addresses, phone numbers and map." checked={draft.pages.branchesEnabled} onChange={v => update('pages', 'branchesEnabled', v)} />
              <SwitchRow label="Track Order" description="The order-tracking link in the header. Customers can still track from their account." checked={draft.pages.trackOrderEnabled} onChange={v => update('pages', 'trackOrderEnabled', v)} />
              {!draft.pages.menuEnabled && <Notice tone="warning">With the Menu page off, “View all” and category links send customers to the home page. Products can still be ordered from the home page carousels.</Notice>}
            </Card>
            <Card title="Policy pages" description="Shown as links in the footer.">
              <SwitchRow label="Privacy Policy" checked={draft.pages.privacyPolicyEnabled} onChange={v => update('pages', 'privacyPolicyEnabled', v)} />
              <SwitchRow label="Terms & Conditions" checked={draft.pages.termsEnabled} onChange={v => update('pages', 'termsEnabled', v)} />
              <SwitchRow label="Refund Policy" checked={draft.pages.refundPolicyEnabled} onChange={v => update('pages', 'refundPolicyEnabled', v)} />
            </Card>
          </>}

          {activeTab === 'assistant' && <>
            <Card title="Chat assistant" description="A chat bubble in the corner of every storefront page. Answers come from Claude, using your live menu, branches, opening hours and delivery settings.">
              <SwitchRow label="Show chat assistant" checked={draft.assistant.enabled} onChange={v => update('assistant', 'enabled', v)} />
              <Row label="Assistant name" description="Shown in the chat header and used by the assistant to introduce itself."><TextInput value={draft.assistant.name} onChange={v => update('assistant', 'name', v)} /></Row>
              <Row label="Welcome message" description="The first message customers see when they open the chat."><TextArea value={draft.assistant.welcomeMessage} onChange={v => update('assistant', 'welcomeMessage', v)} /></Row>
              <Notice>The assistant needs an <strong>ANTHROPIC_API_KEY</strong> in the server environment (create one at platform.claude.com). Usage is billed to that API account per message.</Notice>
            </Card>
          </>}

          {activeTab === 'header-footer' && <>
            <Card title="Announcement bar" description="A thin strip of text above the header.">
              <SwitchRow label="Show announcement bar" checked={draft.header.announcementEnabled} onChange={v => update('header', 'announcementEnabled', v)} />
              <Row label="Announcement text"><TextInput value={draft.header.announcementText} disabled={!draft.header.announcementEnabled} onChange={v => update('header', 'announcementText', v)} /></Row>
            </Card>
            <Card title="Header">
              <Row label="Logo height"><TextInput type="number" suffix="px" value={draft.header.logoSize} onChange={v => number('header', 'logoSize', v)} /></Row>
              <SwitchRow label="Sticky header" description="Keep the header visible while scrolling." checked={draft.header.sticky} onChange={v => update('header', 'sticky', v)} />
              <SwitchRow label="Search bar" checked={draft.header.searchEnabled} onChange={v => update('header', 'searchEnabled', v)} />
              <SwitchRow label="Wishlist icon" checked={draft.header.wishlistEnabled} onChange={v => update('header', 'wishlistEnabled', v)} />
              <SwitchRow label="Customer account icon" checked={draft.header.accountEnabled} onChange={v => update('header', 'accountEnabled', v)} />
              <SwitchRow label="Cart icon" checked={draft.header.cartEnabled} onChange={v => update('header', 'cartEnabled', v)} />
            </Card>
            <Card title="Footer content">
              <Row label="Description"><TextArea rows={3} value={draft.footer.description} onChange={v => update('footer', 'description', v)} /></Row>
              <Row label="Copyright text" description="Use {year} for the current year."><TextInput value={draft.footer.copyrightText} onChange={v => update('footer', 'copyrightText', v)} /></Row>
              <SwitchRow label="Show contact details" checked={draft.footer.showContactDetails} onChange={v => update('footer', 'showContactDetails', v)} />
              <SwitchRow label="Newsletter section" checked={draft.footer.newsletterEnabled} onChange={v => update('footer', 'newsletterEnabled', v)} />
              <Row label="Payment method logos" description="One image URL per line."><ListInput separator={'\n'} value={draft.footer.paymentMethodLogos} onChange={v => update('footer', 'paymentMethodLogos', v)} placeholder="https://…/visa.png" /></Row>
            </Card>
            <Card title="Footer quick links" description="Links listed in the footer’s Explore column.">
              <div className="space-y-2 px-5 py-4">
                {quickLinks.map((link, index) => (
                  <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-2">
                    <input value={link.label} placeholder="Label" onChange={e => setQuickLinks(quickLinks.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} className={inputClass} />
                    <input value={link.url} placeholder="/menu" onChange={e => setQuickLinks(quickLinks.map((item, i) => i === index ? { ...item, url: e.target.value } : item))} className={inputClass} />
                    <button type="button" aria-label={`Remove ${link.label || 'link'}`} onClick={() => setQuickLinks(quickLinks.filter((_, i) => i !== index))} className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setQuickLinks([...quickLinks, { label: '', url: '' }])} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/5"><Plus className="h-3.5 w-3.5" /> Add link</button>
              </div>
            </Card>
            <Card title="Policy pages">
              <Row label="Privacy policy"><TextInput value={draft.footer.privacyPolicyUrl} onChange={v => update('footer', 'privacyPolicyUrl', v)} /></Row>
              <Row label="Terms & conditions"><TextInput value={draft.footer.termsUrl} onChange={v => update('footer', 'termsUrl', v)} /></Row>
              <Row label="Refund policy"><TextInput value={draft.footer.refundPolicyUrl} onChange={v => update('footer', 'refundPolicyUrl', v)} /></Row>
              <Row label="Delivery policy" description="Leave empty to hide the link."><TextInput value={draft.footer.deliveryPolicyUrl} onChange={v => update('footer', 'deliveryPolicyUrl', v)} /></Row>
            </Card>
          </>}

          {activeTab === 'appearance' && <>
            <Card title="Colours" description="Your brand colours, applied across the storefront.">
              <Row label="Primary" description="Headings, navigation and main buttons."><ColorInput value={draft.appearance.primaryColor} onChange={v => update('appearance', 'primaryColor', v)} /></Row>
              <Row label="Secondary"><ColorInput value={draft.appearance.secondaryColor} onChange={v => update('appearance', 'secondaryColor', v)} /></Row>
              <Row label="Accent" description="Highlights, badges and call-to-action details."><ColorInput value={draft.appearance.accentColor} onChange={v => update('appearance', 'accentColor', v)} /></Row>
              <Row label="Buttons"><ColorInput value={draft.appearance.buttonColor} onChange={v => update('appearance', 'buttonColor', v)} /></Row>
            </Card>
            <Card title="Typography & layout">
              <Row label="Heading font" description="A Google Fonts family name."><TextInput value={draft.appearance.headingFont} onChange={v => update('appearance', 'headingFont', v)} /></Row>
              <Row label="Body font"><TextInput value={draft.appearance.bodyFont} onChange={v => update('appearance', 'bodyFont', v)} /></Row>
              <Row label="Corner radius"><TextInput type="number" suffix="px" value={draft.appearance.borderRadius} onChange={v => number('appearance', 'borderRadius', v)} /></Row>
              <Row label="Colour mode"><Select value={draft.appearance.mode} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'Match device setting' }]} onChange={v => update('appearance', 'mode', v)} /></Row>
            </Card>
            <Card title="Custom CSS" description="Advanced. Published CSS is visible to every visitor — only add CSS you trust.">
              <div className="px-5 py-4"><TextArea rows={8} mono value={draft.appearance.customCss} onChange={v => update('appearance', 'customCss', v)} placeholder="/* .my-class { … } */" /></div>
            </Card>
          </>}

          {activeTab === 'seo' && <>
            <Card title="Search engine defaults" description="Used when a page or product has no SEO details of its own.">
              <Row label="Default page title"><TextInput value={draft.seo.defaultTitle} onChange={v => update('seo', 'defaultTitle', v)} /></Row>
              <Row label="Meta description" description="About 150–160 characters works best."><TextArea rows={3} value={draft.seo.metaDescription} onChange={v => update('seo', 'metaDescription', v)} /></Row>
              <Row label="Meta keywords" description="Comma separated."><TextArea rows={2} value={draft.seo.metaKeywords} onChange={v => update('seo', 'metaKeywords', v)} /></Row>
              <Row label="Canonical website URL"><TextInput type="url" value={draft.seo.canonicalUrl} onChange={v => update('seo', 'canonicalUrl', v)} /></Row>
              <SwitchRow label="Allow search engine indexing" description="Turn off to ask search engines not to list the site." checked={draft.seo.searchEngineIndexing} onChange={v => update('seo', 'searchEngineIndexing', v)} />
            </Card>
            <Card title="Social sharing">
              <Row label="Share image" description="Shown when your site is shared on social media. 1200×630 px recommended.">{imageInput('seo.openGraphImageUrl', draft.seo.openGraphImageUrl)}</Row>
            </Card>
            <Card title="Analytics & tracking" description="Leave a field empty to turn that tracker off.">
              <Row label="Google Analytics ID"><TextInput placeholder="G-XXXXXXXXXX" value={draft.seo.googleAnalyticsId} onChange={v => update('seo', 'googleAnalyticsId', v)} /></Row>
              <Row label="Google Tag Manager ID"><TextInput placeholder="GTM-XXXXXXX" value={draft.seo.googleTagManagerId} onChange={v => update('seo', 'googleTagManagerId', v)} /></Row>
              <Row label="Meta Pixel ID"><TextInput placeholder="123456789012345" value={draft.seo.metaPixelId} onChange={v => update('seo', 'metaPixelId', v)} /></Row>
            </Card>
          </>}

          {activeTab === 'store' && <>
            <Card title="Menu tabs" description="Choose which main menus customers can browse. With only one switched on, the tab bar is hidden. Products in a hidden menu cannot be ordered.">
              <SwitchRow label="Bakery Items" checked={draft.store.bakeryMenuEnabled} onChange={v => update('store', 'bakeryMenuEnabled', v)} />
              <SwitchRow label="Food Items" checked={draft.store.foodMenuEnabled} onChange={v => update('store', 'foodMenuEnabled', v)} />
              <SwitchRow label="Combo Items" checked={draft.store.comboMenuEnabled} onChange={v => update('store', 'comboMenuEnabled', v)} />
            </Card>
            <Card title="Currency & pricing">
              <Row label="Currency code"><TextInput value={draft.store.currency} onChange={v => update('store', 'currency', v.toUpperCase())} /></Row>
              <Row label="Currency symbol"><TextInput value={draft.store.currencySymbol} onChange={v => update('store', 'currencySymbol', v)} /></Row>
              <Row label="Symbol position"><Select value={draft.store.symbolPosition} options={[{ value: 'before', label: 'Before amount (Rs. 250)' }, { value: 'after', label: 'After amount (250 Rs.)' }]} onChange={v => update('store', 'symbolPosition', v)} /></Row>
              <Row label="Decimal places"><TextInput type="number" value={draft.store.decimalPlaces} onChange={v => number('store', 'decimalPlaces', v)} /></Row>
              <Row label="Tax rate"><TextInput type="number" suffix="%" value={draft.store.taxPercentage} onChange={v => number('store', 'taxPercentage', v)} /></Row>
              <SwitchRow label="Prices include tax" checked={draft.store.pricesIncludeTax} onChange={v => update('store', 'pricesIncludeTax', v)} />
            </Card>
            <Card title="Order limits">
              <Row label="Minimum order amount"><TextInput type="number" suffix={draft.store.currencySymbol} value={draft.store.minimumOrderAmount} onChange={v => number('store', 'minimumOrderAmount', v)} /></Row>
              <Row label="Maximum order amount" description="0 means no limit."><TextInput type="number" suffix={draft.store.currencySymbol} value={draft.store.maximumOrderAmount} onChange={v => number('store', 'maximumOrderAmount', v)} /></Row>
            </Card>
            <Card title="Catalogue & stock">
              <Row label="Default product sorting"><Select value={draft.store.defaultProductSorting} options={[{ value: 'menu_order', label: 'Default order' }, { value: 'name', label: 'Name' }, { value: 'price_asc', label: 'Price: low to high' }, { value: 'price_desc', label: 'Price: high to low' }, { value: 'newest', label: 'Newest' }]} onChange={v => update('store', 'defaultProductSorting', v)} /></Row>
              <Row label="Products per page"><TextInput type="number" value={draft.store.productsPerPage} onChange={v => number('store', 'productsPerPage', v)} /></Row>
              <Row label="Low-stock threshold" description="Products at or below this quantity are marked low stock."><TextInput type="number" suffix="units" value={draft.store.lowStockThreshold} onChange={v => number('store', 'lowStockThreshold', v)} /></Row>
              <SwitchRow label="Allow ordering out-of-stock items" checked={draft.store.allowOutOfStockOrdering} onChange={v => update('store', 'allowOutOfStockOrdering', v)} />
            </Card>
            <Card title="Customer features">
              <SwitchRow label="Guest checkout" description="Let customers order without signing in." checked={draft.store.guestCheckout} onChange={v => update('store', 'guestCheckout', v)} />
              <SwitchRow label="Coupon codes" description="Show the coupon field at checkout." checked={draft.store.couponsEnabled} onChange={v => update('store', 'couponsEnabled', v)} />
              <SwitchRow label="Product reviews" checked={draft.store.reviewsEnabled} onChange={v => update('store', 'reviewsEnabled', v)} />
              <SwitchRow label="Wishlist" checked={draft.store.wishlistEnabled} onChange={v => update('store', 'wishlistEnabled', v)} />
            </Card>
          </>}

          {activeTab === 'orders' && <>
            <Card title="Order numbers & status">
              <Row label="Order number prefix" description="E.g. TBH- gives TBH-1024."><TextInput value={draft.orders.numberPrefix} onChange={v => update('orders', 'numberPrefix', v)} /></Row>
              <Row label="Status for new orders"><Select value={draft.orders.defaultStatus} options={draft.orders.availableStatuses.map(status => ({ value: status, label: status.replaceAll('_', ' ').replace(/^\w/, c => c.toUpperCase()) }))} onChange={v => update('orders', 'defaultStatus', v as OrderStatus)} /></Row>
              <Row label="Available statuses" description="Comma separated status codes."><ListInput separator="," value={draft.orders.availableStatuses} onChange={v => update('orders', 'availableStatuses', v as OrderStatus[])} /></Row>
            </Card>
            <Card title="Order rules">
              <SwitchRow label="Reduce stock automatically" description="Lower product stock when an order is placed." checked={draft.orders.automaticallyReduceStock} onChange={v => update('orders', 'automaticallyReduceStock', v)} />
              <SwitchRow label="Customer order notes" description="Let customers add a note at checkout." checked={draft.orders.customerNotesEnabled} onChange={v => update('orders', 'customerNotesEnabled', v)} />
              <Row label="Cancellation window" description="How long after ordering a customer can cancel."><TextInput type="number" suffix="minutes" value={draft.orders.cancellationTimeLimitMinutes} onChange={v => number('orders', 'cancellationTimeLimitMinutes', v)} /></Row>
            </Card>
            <Card title="Order notifications">
              <SwitchRow label="Notify admin of new orders" checked={draft.orders.adminNewOrderNotifications} onChange={v => update('orders', 'adminNewOrderNotifications', v)} />
              <SwitchRow label="Send customer confirmations" checked={draft.orders.customerConfirmationNotifications} onChange={v => update('orders', 'customerConfirmationNotifications', v)} />
            </Card>
          </>}

          {activeTab === 'payments' && <>
            <Card title="Offline payments">
              <SwitchRow label="Cash on delivery" description="Customers pay when they collect or receive the order." checked={draft.payments.cashOnDeliveryEnabled} onChange={v => update('payments', 'cashOnDeliveryEnabled', v)} />
              <SwitchRow label="Bank transfer" checked={draft.payments.bankTransferEnabled} onChange={v => update('payments', 'bankTransferEnabled', v)} />
              {draft.payments.bankTransferEnabled && <Row label="Bank account details" description="Shown to customers who choose bank transfer."><TextArea rows={3} value={draft.payments.bankAccountInformation} onChange={v => update('payments', 'bankAccountInformation', v)} placeholder={'Bank name\nAccount name\nAccount number\nBranch'} /></Row>}
            </Card>
            <div className="overflow-hidden rounded-xl border border-amber-200"><Notice tone="warning">PayHere and Stripe are not connected yet, so they are not shown at checkout even when switched on. Dialog Genie is connected: customers pay on Genie's secure card page and the order is marked paid only after Genie confirms it.</Notice></div>
            <Card title="PayHere">
              <SwitchRow label="Accept PayHere" checked={draft.payments.payHereEnabled} onChange={v => update('payments', 'payHereEnabled', v)} />
              {draft.payments.payHereEnabled && <>
                <Row label="Merchant ID"><TextInput value={draft.payments.payHereMerchantId} onChange={v => update('payments', 'payHereMerchantId', v)} /></Row>
                <Row label="Environment"><Select value={draft.payments.payHereEnvironment} options={environmentOptions} onChange={v => update('payments', 'payHereEnvironment', v)} /></Row>
              </>}
            </Card>
            <Card title="Dialog Genie">
              <SwitchRow label="Accept Dialog Genie" checked={draft.payments.dialogGenieEnabled} onChange={v => update('payments', 'dialogGenieEnabled', v)} />
              {draft.payments.dialogGenieEnabled && <>
                <Row label="Environment" description="Sandbox uses Genie's test system (no real money). Must match the API key in use."><Select value={draft.payments.dialogGenieEnvironment} options={environmentOptions} onChange={v => update('payments', 'dialogGenieEnvironment', v)} /></Row>
                {draft.store.currency.trim().toUpperCase() !== 'LKR' && <>
                  <Row label="Live exchange rate" description="Genie charges in rupees only, so each order total is converted at today's rate, fetched automatically and refreshed hourly. The customer sees the rupee amount before paying.">
                    <p className="text-sm font-semibold text-stone-800">
                      {genieRate === null ? 'Checking…' : genieRate.rate ? `1 ${draft.store.currency} = ${genieRate.rate.toFixed(2)} LKR` : 'Not available'}
                      {genieRate?.rate ? <span className="block text-xs font-normal text-stone-500">{genieRate.source}{genieRate.fetchedAt ? ` · fetched ${new Date(genieRate.fetchedAt).toLocaleString()}` : ''}</span> : null}
                    </p>
                  </Row>
                  <Row label={`Fallback rate (1 ${draft.store.currency} = ? LKR)`} description="Used only if the live rate can't be fetched. Leave at 0 to hide card payment instead."><TextInput type="number" suffix="LKR" value={draft.payments.dialogGenieExchangeRate} onChange={v => number('payments', 'dialogGenieExchangeRate', v)} /></Row>
                  {genieRate !== null && !genieRate.rate && <Notice tone="warning">No exchange rate is available right now, so card payment is hidden at checkout. Enter a fallback rate to keep it on.</Notice>}
                </>}
                <Notice>The API key is kept on the server, not here: set <strong>DIALOG_GENIE_API_KEY</strong> in the server environment (.env locally, Vercel environment variables when deployed). Get it from the Connect menu of the Genie Business dashboard. Card payment is hidden at checkout while no key is set.</Notice>
              </>}
            </Card>
            <Card title="Stripe">
              <SwitchRow label="Accept Stripe" checked={draft.payments.stripeEnabled} onChange={v => update('payments', 'stripeEnabled', v)} />
            </Card>
            <Card title="Checkout message">
              <Row label="Payment instructions" description="Shown to customers on the payment step."><TextArea rows={3} value={draft.payments.instructions} onChange={v => update('payments', 'instructions', v)} /></Row>
              <Notice tone="warning">Gateway secrets are not editable here for security. Set <code className="font-mono">PAYHERE_MERCHANT_SECRET</code> and <code className="font-mono">DIALOG_GENIE_API_KEY</code> on the server before taking live payments.</Notice>
            </Card>
          </>}

          {activeTab === 'delivery' && <>
            <Card title="Fulfilment options">
              <SwitchRow label="Store pickup" description="Customers collect orders from a branch." checked={draft.delivery.storePickupEnabled} onChange={v => update('delivery', 'storePickupEnabled', v)} />
              <SwitchRow label="Home delivery" checked={draft.delivery.enabled} onChange={v => update('delivery', 'enabled', v)} />
            </Card>
            {draft.delivery.enabled && <>
              <Card title="Delivery fees & timing">
                <Row label="Default delivery fee"><TextInput type="number" suffix={draft.store.currencySymbol} value={draft.delivery.defaultFee} onChange={v => number('delivery', 'defaultFee', v)} /></Row>
                <Row label="Free delivery over" description="0 turns free delivery off."><TextInput type="number" suffix={draft.store.currencySymbol} value={draft.delivery.freeDeliveryMinimum} onChange={v => number('delivery', 'freeDeliveryMinimum', v)} /></Row>
                <Row label="Estimated delivery time"><TextInput value={draft.delivery.estimatedTime} onChange={v => update('delivery', 'estimatedTime', v)} placeholder="45–90 minutes" /></Row>
                <Row label="Maximum distance" description="0 means no limit."><TextInput type="number" suffix="km" value={draft.delivery.maximumDistanceKm} onChange={v => number('delivery', 'maximumDistanceKm', v)} /></Row>
              </Card>
              <Card title="Delivery areas" description="Areas you deliver to, each with its own charge.">
                <SwitchRow label="Check postal code at checkout" description="Only allow delivery to the postal codes listed below." checked={draft.delivery.postalCodeCheckEnabled} onChange={v => update('delivery', 'postalCodeCheckEnabled', v)} />
                <div className="space-y-2 px-5 py-4">
                  {areas.length > 0 && <div className="hidden grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1.4fr)_36px] gap-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400 sm:grid"><span>Area</span><span>Charge</span><span>Postal codes</span><span /></div>}
                  {areas.map((area, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1.4fr)_36px]">
                      <input value={area.name} placeholder="Area name" onChange={e => setAreas(areas.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} className={inputClass} />
                      <input type="number" value={area.charge} onChange={e => setAreas(areas.map((item, i) => i === index ? { ...item, charge: Number(e.target.value || 0) } : item))} className={inputClass} />
                      <ListInput separator="," value={area.postalCodes} placeholder="40000, 40010" onChange={codes => setAreas(areas.map((item, i) => i === index ? { ...item, postalCodes: codes } : item))} />
                      <button type="button" aria-label={`Remove ${area.name || 'area'}`} onClick={() => setAreas(areas.filter((_, i) => i !== index))} className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setAreas([...areas, { name: '', charge: draft.delivery.defaultFee, postalCodes: [] }])} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/5"><Plus className="h-3.5 w-3.5" /> Add area</button>
                </div>
              </Card>
              <Card title="Delivery instructions">
                <div className="px-5 py-4"><TextArea rows={3} value={draft.delivery.instructions} onChange={v => update('delivery', 'instructions', v)} placeholder="Shown to customers who choose delivery." /></div>
              </Card>
            </>}
          </>}

          {activeTab === 'food-ordering' && <>
            <Card title="Availability" description="Food products use the same cart, checkout, payments and order tracking as bakery items.">
              <SwitchRow label="Enable food ordering" checked={draft.foodOrdering.enabled} onChange={v => update('foodOrdering', 'enabled', v)} />
              <SwitchRow label="Kitchen temporarily closed" description="Pause food orders without changing your hours." checked={draft.foodOrdering.temporarilyClosed} onChange={v => update('foodOrdering', 'temporarilyClosed', v)} />
              <Row label="Closed message" description="Shown to customers while the kitchen is closed."><TextArea rows={2} value={draft.foodOrdering.closedMessage} onChange={v => update('foodOrdering', 'closedMessage', v)} /></Row>
            </Card>
            <Card title="Kitchen hours">
              <Row label="Opening days" description="Customers can schedule food only on these days."><WeekdaySelector value={draft.foodOrdering.openingDays} onChange={days => update('foodOrdering', 'openingDays', days)} /></Row>
              <Row label="Opens at"><TextInput type="time" value={draft.foodOrdering.openTime} onChange={v => update('foodOrdering', 'openTime', v)} /></Row>
              <Row label="Closes at"><TextInput type="time" value={draft.foodOrdering.closeTime} onChange={v => update('foodOrdering', 'closeTime', v)} /></Row>
              <Row label="Last order time"><TextInput type="time" value={draft.foodOrdering.lastOrderTime} onChange={v => update('foodOrdering', 'lastOrderTime', v)} /></Row>
            </Card>
            <Card title="Order types">
              <SwitchRow label="ASAP orders" description="Prepared as soon as possible." checked={draft.foodOrdering.allowAsap} onChange={v => update('foodOrdering', 'allowAsap', v)} />
              <SwitchRow label="Scheduled orders" description="Customers pick a date and time slot." checked={draft.foodOrdering.allowScheduled} onChange={v => update('foodOrdering', 'allowScheduled', v)} />
            </Card>
            <Card title="Timing & capacity">
              <Row label="Default preparation time"><TextInput type="number" suffix="minutes" value={draft.foodOrdering.defaultPreparationMinutes} onChange={v => number('foodOrdering', 'defaultPreparationMinutes', v)} /></Row>
              <Row label="ASAP buffer" description="Extra time added to ASAP orders."><TextInput type="number" suffix="minutes" value={draft.foodOrdering.asapBufferMinutes} onChange={v => number('foodOrdering', 'asapBufferMinutes', v)} /></Row>
              <Row label="Time slot length"><TextInput type="number" suffix="minutes" value={draft.foodOrdering.scheduledSlotMinutes} onChange={v => number('foodOrdering', 'scheduledSlotMinutes', v)} /></Row>
              <Row label="Orders per time slot" description="0 means no limit."><TextInput type="number" value={draft.foodOrdering.maximumOrdersPerSlot} onChange={v => number('foodOrdering', 'maximumOrdersPerSlot', v)} /></Row>
            </Card>
          </>}

          {activeTab === 'contact-social' && <>
            <Card title="Contact page">
              <Row label="Page heading"><TextInput value={draft.contact.pageHeading} onChange={v => update('contact', 'pageHeading', v)} /></Row>
              <Row label="Page description"><TextArea rows={2} value={draft.contact.pageDescription} onChange={v => update('contact', 'pageDescription', v)} /></Row>
              <Row label="Form recipient email" description="Contact form messages go here. Never shown publicly."><TextInput type="email" value={draft.contact.formRecipientEmail} onChange={v => update('contact', 'formRecipientEmail', v)} /></Row>
              <Row label="Support phone"><TextInput type="tel" value={draft.contact.supportPhone} onChange={v => update('contact', 'supportPhone', v)} /></Row>
            </Card>
            <Card title="WhatsApp">
              <SwitchRow label="Floating WhatsApp button" description="Uses the WhatsApp number from Business details." checked={draft.contact.whatsappButtonEnabled} onChange={v => update('contact', 'whatsappButtonEnabled', v)} />
              <Row label="Pre-filled message"><TextArea rows={2} value={draft.contact.whatsappDefaultMessage} onChange={v => update('contact', 'whatsappDefaultMessage', v)} /></Row>
            </Card>
            <Card title="Customer notifications">
              <SwitchRow label="Email notifications" checked={draft.contact.emailNotificationsEnabled} onChange={v => update('contact', 'emailNotificationsEnabled', v)} />
              <SwitchRow label="SMS notifications" checked={draft.contact.smsNotificationsEnabled} onChange={v => update('contact', 'smsNotificationsEnabled', v)} />
            </Card>
            <Card title="Social media" description="Only switched-on profiles with a link are shown on the website.">
              {socialKeys.map(platform => (
                <div key={platform} className="grid items-center gap-3 px-5 py-3.5 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
                  <p className="text-[13px] font-semibold text-stone-800">{SOCIAL_LABELS[platform]}</p>
                  <input type="url" value={draft.social[platform].url} placeholder={`https://${platform}.com/…`} onChange={e => updateSocial(platform, 'url', e.target.value)} className={inputClass} />
                  <Switch label={`Show ${SOCIAL_LABELS[platform]}`} checked={draft.social[platform].enabled} onChange={v => updateSocial(platform, 'enabled', v)} />
                </div>
              ))}
            </Card>
          </>}

          {activeTab === 'system' && <>
            <Card title="Maintenance mode" description="Temporarily replace the storefront with a maintenance page.">
              <SwitchRow label="Maintenance mode" description="Visitors see the maintenance page instead of the store." checked={draft.system.maintenanceMode} onChange={v => update('system', 'maintenanceMode', v)} />
              <SwitchRow label="Allow admin access during maintenance" checked={draft.system.allowAdminDuringMaintenance} onChange={v => update('system', 'allowAdminDuringMaintenance', v)} />
              <Row label="Maintenance message"><TextArea rows={2} value={draft.system.maintenanceMessage} onChange={v => update('system', 'maintenanceMessage', v)} /></Row>
              <Row label="Maintenance image">{imageInput('system.maintenanceImageUrl', draft.system.maintenanceImageUrl)}</Row>
            </Card>
            <Card title="Localization">
              <Row label="Time zone"><TextInput value={draft.system.timezone} onChange={v => update('system', 'timezone', v)} placeholder="Asia/Colombo" /></Row>
              <Row label="Date format"><TextInput value={draft.system.dateFormat} onChange={v => update('system', 'dateFormat', v)} placeholder="DD/MM/YYYY" /></Row>
              <Row label="Time format"><Select value={draft.system.timeFormat} options={[{ value: '12-hour', label: '12-hour (2:30 PM)' }, { value: '24-hour', label: '24-hour (14:30)' }]} onChange={v => update('system', 'timeFormat', v)} /></Row>
              <Row label="Default language"><TextInput value={draft.system.defaultLanguage} onChange={v => update('system', 'defaultLanguage', v)} placeholder="en" /></Row>
            </Card>
            <Card title="Backup & data" description="Export your settings as a backup, or restore them from a file.">
              <div className="flex flex-wrap gap-2 px-5 py-4">
                <button type="button" onClick={exportSettings} className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"><Download className="h-4 w-4" /> Export settings</button>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"><Upload className="h-4 w-4" /> Import settings<input type="file" accept="application/json" className="hidden" onChange={e => importSettings(e.target.files?.[0])} /></label>
                <button type="button" onClick={() => { sessionStorage.clear(); showToast('Browser settings cache cleared.'); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">Clear browser cache</button>
              </div>
              <div className="px-5 py-3 text-xs text-stone-500">
                Last updated: {draft.system.lastUpdatedAt ? new Date(draft.system.lastUpdatedAt).toLocaleString() : 'Not recorded'}{draft.system.lastUpdatedBy ? ` by ${draft.system.lastUpdatedBy}` : ''}
              </div>
            </Card>
          </>}
        </div>
      </div>

      {/* Save bar — appears only when there is something to save. Fixed rather than sticky because the
          admin shell wraps this page in an overflow-hidden container, which disables sticky positioning. */}
      {dirty && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white shadow-2xl md:left-64">
          <span className="flex items-center gap-2 text-[13px] font-medium"><AlertTriangle className="h-4 w-4 text-brand-gold" /> You have unsaved changes</span>
          <div className="flex gap-2">
            <button type="button" onClick={discard} disabled={saving} className="h-9 rounded-lg px-3.5 text-xs font-semibold text-stone-300 hover:bg-white/10 hover:text-white">Discard</button>
            <button type="button" onClick={save} disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-gold px-4 text-xs font-bold text-stone-950 hover:brightness-105 disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
