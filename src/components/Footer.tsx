import React from 'react';
import { ArrowRight, Clock3, Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle, Music2, Phone, Sparkles, Youtube } from 'lucide-react';
import Logo from './Logo';
import { useSiteSettings } from './SiteSettingsContext';
import { isPagePathEnabled } from '../sitePages';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const settings = useSiteSettings();

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabFromUrl = (url: string) => ({ '/': 'home', '/menu': 'menu', '/promotions': 'promotions', '/branches': 'branches', '/privacy-policy': 'privacy-policy', '/terms-and-conditions': 'terms-and-conditions', '/refund-policy': 'refund-policy' }[url]);
  const navigation = (settings.footer.quickLinks.length ? settings.footer.quickLinks : [{ label: 'Home', url: '/' }, { label: 'Our Menu', url: '/menu' }, { label: 'Promotions', url: '/promotions' }])
    .filter(link => isPagePathEnabled(link.url, settings.pages));

  const legalNavigation = [
    { label: 'Privacy Policy', url: settings.footer.privacyPolicyUrl },
    { label: 'Terms & Conditions', url: settings.footer.termsUrl },
    { label: 'Refund Policy', url: settings.footer.refundPolicyUrl },
    { label: 'Delivery Policy', url: settings.footer.deliveryPolicyUrl },
  ].filter(link => link.url && isPagePathEnabled(link.url, settings.pages));

  const handleLink = (url: string) => {
    const tab = tabFromUrl(url);
    if (tab) handleNavClick(tab);
    else if (url.startsWith('http')) window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.href = url;
  };

  const socialIcons = { facebook: Facebook, instagram: Instagram, tiktok: Music2, youtube: Youtube, whatsapp: MessageCircle, linkedin: Linkedin };
  const socialLinks = (Object.entries(settings.social) as Array<[keyof typeof settings.social, { enabled: boolean; url: string }]>).filter(([, item]) => item.enabled && item.url).map(([platform, item]) => ({ label: platform, url: item.url, icon: socialIcons[platform] }));

  return (
    <footer className="relative overflow-hidden bg-[#070d32] text-white">
      <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-brand-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-b-[2rem] bg-brand-gold px-6 py-7 text-brand-blue shadow-[0_20px_60px_rgba(0,0,0,0.2)] sm:px-9 sm:py-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="flex items-start gap-4">
            <span className="hidden rounded-2xl bg-brand-blue p-3 text-brand-gold sm:block"><Sparkles className="h-6 w-6" /></span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-blue/60">Freshly baked every day</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Ready for something delicious?</h2>
              <p className="mt-1 text-sm font-medium text-brand-blue/70">Explore cakes, savouries and family favourites made with care.</p>
            </div>
          </div>
          <button type="button" onClick={() => handleNavClick('menu')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-blue-light lg:mt-0 lg:shrink-0">
            Order from our menu <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.7fr_1fr_1fr] lg:gap-12 lg:py-16">
          <div>
            <button type="button" onClick={() => handleNavClick('home')} aria-label="Go to homepage" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold">
              <Logo isLight src={settings.footer.logoUrl || undefined} className="h-16" />
            </button>
            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100/60">{settings.footer.description}</p>
            <div className="mt-6 flex gap-2.5">
              {socialLinks.map(({ icon: Icon, url, label }) => (
                <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-blue-100/70 transition hover:-translate-y-1 hover:border-brand-gold hover:bg-brand-gold hover:text-brand-blue">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">Explore</h3>
            <nav className="mt-5" aria-label="Footer navigation">
              <ul className="space-y-3.5">
                {navigation.map(link => (
                  <li key={`${link.label}-${link.url}`}>
                    <button type="button" onClick={() => handleLink(link.url)} className="group flex items-center gap-2 text-sm font-medium text-blue-100/65 transition hover:text-white">
                      <span className="h-px w-0 bg-brand-gold transition-all group-hover:w-4" />{link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className={settings.footer.showContactDetails ? '' : 'hidden'}>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">Visit us</h3>
            <div className="mt-5 space-y-5">
              <div className="flex gap-3">
                <span className="mt-0.5 rounded-lg bg-white/5 p-2 text-brand-gold"><MapPin className="h-4 w-4" /></span>
                <div><p className="text-sm font-bold">{settings.business.name}</p><p className="mt-1 whitespace-pre-line text-xs leading-5 text-blue-100/55">{settings.business.address}</p></div>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 rounded-lg bg-white/5 p-2 text-brand-gold"><Clock3 className="h-4 w-4" /></span>
                <div><p className="text-sm font-bold">Opening hours</p><p className="mt-1 text-xs leading-5 text-blue-100/55">{settings.business.openingHours}</p></div>
              </div>
            </div>
          </div>

          <div className={settings.footer.showContactDetails ? '' : 'hidden'}>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold">Get in touch</h3>
            <div className="mt-5 space-y-4">
              <a href={`tel:${settings.business.primaryPhone.replace(/\s/g, '')}`} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-brand-gold/50 hover:bg-white/[0.07]">
                <Phone className="h-4 w-4 shrink-0 text-brand-gold" /><div><p className="text-[9px] font-bold uppercase tracking-wider text-blue-100/40">Call us</p><p className="mt-0.5 text-sm font-bold group-hover:text-brand-gold">{settings.business.primaryPhone}</p></div>
              </a>
              <a href={`mailto:${settings.business.supportEmail}`} className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-brand-gold/50 hover:bg-white/[0.07]">
                <Mail className="h-4 w-4 shrink-0 text-brand-gold" /><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-blue-100/40">Email us</p><p className="mt-0.5 truncate text-sm font-bold group-hover:text-brand-gold">{settings.business.supportEmail}</p></div>
              </a>
            </div>
          </div>
        </div>

        {settings.footer.newsletterEnabled && <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><h3 className="font-extrabold">Fresh news from the bakery</h3><p className="mt-1 text-xs text-blue-100/50">Get occasional product and promotion updates.</p></div><form className="mt-4 flex max-w-md flex-1 gap-2 sm:mt-0" onSubmit={event => event.preventDefault()}><input type="email" required aria-label="Newsletter email" placeholder="Email address" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-blue-100/40" /><button className="rounded-xl bg-brand-gold px-4 py-2 text-xs font-extrabold text-stone-950">Subscribe</button></form></div>}

        {settings.footer.paymentMethodLogos.length > 0 && <div className="mb-6 flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-6"><span className="text-[10px] font-bold uppercase tracking-wider text-blue-100/40">Accepted payments</span>{settings.footer.paymentMethodLogos.map(url => <img key={url} src={url} alt="Payment method" className="h-7 w-auto rounded bg-white p-1 object-contain" />)}</div>}

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-[11px] text-blue-100/40 lg:flex-row">
          <p>{settings.footer.copyrightText.replace('{year}', String(currentYear))}</p>
          <nav aria-label="Legal information">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {legalNavigation.map(link => (
                <li key={link.url}>
                  <button type="button" onClick={() => handleLink(link.url)} className="transition hover:text-brand-gold">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <p>Made with care by <span className="font-bold text-brand-gold">InspiroDesk</span></p>
        </div>
      </div>
    </footer>
  );
}
