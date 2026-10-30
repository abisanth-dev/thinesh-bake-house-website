import { Croissant, UtensilsCrossed, Gift } from 'lucide-react';
import { GeneralSettings, MenuGroup, Product } from './types';

// The three major categories of the storefront. Shared by the home page showcase and the
// menu tabs so both always offer the same set in the same order.
export const MENU_GROUPS: Array<{
  id: MenuGroup;
  label: string;
  icon: typeof Croissant;
  blurb: string;
  eyebrow: string;
  fallbackImage: string;
}> = [
  {
    id: 'bakery',
    label: 'Bakery Items',
    icon: Croissant,
    blurb: 'Cakes, buns, doughnuts and everything baked fresh each morning.',
    eyebrow: 'Straight from the oven',
    fallbackImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=85&w=1200',
  },
  {
    id: 'food',
    label: 'Food Items',
    icon: UtensilsCrossed,
    blurb: 'Kitchen-prepared meals and bulk packages for your group.',
    eyebrow: 'Cooked to order',
    fallbackImage: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=85&w=1200',
  },
  {
    id: 'combo',
    label: 'Combo Items',
    icon: Gift,
    blurb: 'Hand-picked bundles that cost less than buying each item on its own.',
    eyebrow: 'Bundle and save',
    fallbackImage: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=85&w=1200',
  },
];

export const groupOf = (product: Product): MenuGroup =>
  product.productType === 'food' ? 'food' : product.productType === 'combo' ? 'combo' : 'bakery';

// Admin > Settings > Store can switch each main menu tab off.
export const isMenuGroupEnabled = (group: MenuGroup, store: GeneralSettings['store']): boolean =>
  group === 'food' ? store.foodMenuEnabled : group === 'combo' ? store.comboMenuEnabled : store.bakeryMenuEnabled;

export const enabledMenuGroups = (store: GeneralSettings['store']) =>
  MENU_GROUPS.filter(group => isMenuGroupEnabled(group.id, store));
