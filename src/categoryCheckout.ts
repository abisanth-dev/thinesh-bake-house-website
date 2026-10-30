import { Category, Product } from './types';

// Names of the categories an admin has switched checkout off for. Products link to categories by
// name (product.category === category.name), the same way the menu filters them.
export const checkoutDisabledCategoryNames = (categories: Category[]): Set<string> =>
  new Set(categories.filter(category => category.checkoutEnabled === false).map(category => category.name.trim().toLowerCase()));

export const isProductCheckoutDisabled = (product: Pick<Product, 'category'>, disabledNames: Set<string>): boolean =>
  disabledNames.has((product.category || '').trim().toLowerCase());
