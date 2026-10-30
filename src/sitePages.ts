import { GeneralSettings } from './types';

type PagesSettings = GeneralSettings['pages'];

// Storefront pages an admin can switch off in Settings > Pages. Home is always on; Track Order
// is a modal rather than a page, so it is handled where its buttons are rendered.
export const TOGGLEABLE_PAGES: Array<{ tab: string; path: string; label: string; key: keyof PagesSettings }> = [
  { tab: 'menu', path: '/menu', label: 'Menu', key: 'menuEnabled' },
  { tab: 'promotions', path: '/promotions', label: 'Promotions', key: 'promotionsEnabled' },
  { tab: 'branches', path: '/branches', label: 'Our Branches', key: 'branchesEnabled' },
  { tab: 'privacy-policy', path: '/privacy-policy', label: 'Privacy Policy', key: 'privacyPolicyEnabled' },
  { tab: 'terms-and-conditions', path: '/terms-and-conditions', label: 'Terms & Conditions', key: 'termsEnabled' },
  { tab: 'refund-policy', path: '/refund-policy', label: 'Refund Policy', key: 'refundPolicyEnabled' },
];

export const isPageEnabled = (tab: string, pages: PagesSettings): boolean => {
  const page = TOGGLEABLE_PAGES.find(item => item.tab === tab);
  return !page || pages[page.key];
};

/** For links stored as URLs (footer quick links, policy links): false only for a switched-off page. */
export const isPagePathEnabled = (url: string, pages: PagesSettings): boolean => {
  const page = TOGGLEABLE_PAGES.find(item => item.path === url);
  return !page || pages[page.key];
};
