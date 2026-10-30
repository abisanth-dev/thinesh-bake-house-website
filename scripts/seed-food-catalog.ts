import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { supabaseAdmin } from '../server/supabaseClient.js';
import { uploadImageBuffer } from '../server/storage.js';
import type { Category, Product, ProductVariant } from '../src/types.js';

const sourceItems = [
  { id: 'food-draft-meat-kottu', name: 'Draft – Meat Kottu', category: 'Kottu', imagePath: 'C:/Users/abisa/AppData/Local/Temp/codex-clipboard-d08ac607-4029-43b1-967a-f8c5704d15f7.png' },
  { id: 'food-draft-string-hopper-kottu', name: 'Draft – String Hopper Kottu', category: 'Kottu', imagePath: 'C:/Users/abisa/AppData/Local/Temp/codex-clipboard-67c3943d-958a-4e7a-a314-685631b1eb4f.png' },
  { id: 'food-draft-fried-noodles', name: 'Draft – Fried Noodles', category: 'Noodles', imagePath: 'C:/Users/abisa/AppData/Local/Temp/codex-clipboard-4171565e-7f18-4fe9-96bd-e4aa11d1f2cc.png' },
  { id: 'food-draft-chicken-curry', name: 'Draft – Chicken Curry', category: 'Curries', imagePath: 'C:/Users/abisa/AppData/Local/Temp/codex-clipboard-916705dc-bba9-49e1-99a1-4c642fad25b7.png' },
  { id: 'food-draft-fried-prawns', name: 'Draft – Fried Prawns', category: 'Sides', imagePath: 'C:/Users/abisa/AppData/Local/Temp/codex-clipboard-33b9bdb6-e363-473f-ab6b-b473fbd345fe.png' },
  { id: 'food-draft-fried-rice', name: 'Draft – Fried Rice', category: 'Fried Rice', imagePath: 'C:/Users/abisa/AppData/Local/Temp/codex-clipboard-a4226ade-9eb7-485d-b4bf-93038f1bfa9f.png' },
  { id: 'food-draft-kottu-roti', name: 'Draft – Kottu Roti', category: 'Kottu', imagePath: 'C:/Users/abisa/AppData/Local/Temp/codex-clipboard-cb7268e7-a54b-46ba-989b-e6df662d79c6.png' },
  { id: 'food-draft-fried-chicken', name: 'Draft – Fried Chicken', category: 'Sides', imagePath: 'C:/Users/abisa/AppData/Local/Temp/codex-clipboard-641b8143-e7f4-4cb8-b617-9155ef713428.png' },
] as const;

const draftVariant = (productId: string): ProductVariant => ({
  id: `${productId}-serves-5`, sku: `${productId.toUpperCase()}-P5`, servesPersons: 5, price: 0, stockQuantity: 0, stockStatus: 'out_of_stock',
  attributes: [{ name: 'Serves', option: '5 persons' }],
});

async function main() {
  if (!process.argv.includes('--confirm')) throw new Error('Safety stop: run `npm run seed:food -- --confirm` only after reviewing the draft names and setting the migration.');

  const { error: schemaError } = await supabaseAdmin.from('products').select('product_type,modifier_groups').limit(1);
  if (schemaError) throw new Error(`Food schema is not ready. Apply supabase/migrations/006_food_ordering.sql first. ${schemaError.message}`);

  const uploaded = new Map<string, string>();
  for (const item of sourceItems) {
    const { data: existing, error: existingError } = await supabaseAdmin.from('products').select('image').eq('id', item.id).maybeSingle();
    if (existingError) throw existingError;
    if (existing?.image) {
      uploaded.set(item.id, existing.image);
      continue;
    }
    const buffer = await readFile(item.imagePath);
    uploaded.set(item.id, await uploadImageBuffer(buffer, basename(item.imagePath, '.png'), 'image/png'));
  }

  const categoryNames = ['Food', ...new Set(sourceItems.map(item => item.category))];
  const categories: Category[] = categoryNames.map(name => ({
    id: `food-category-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: name === 'Food' ? 'Fresh meals prepared by the kitchen.' : `Freshly prepared ${name.toLowerCase()}.`,
    image: uploaded.get(sourceItems.find(item => item.category === name)?.id || sourceItems[0].id),
    isFeatured: name !== 'Food',
  }));
  const categoryRows = categories.map(category => ({ id: category.id, name: category.name, slug: category.slug, description: category.description, image: category.image, is_featured: category.isFeatured, count: sourceItems.filter(item => item.category === category.name).length, updated_at: new Date().toISOString() }));
  const { error: categoryError } = await supabaseAdmin.from('categories').upsert(categoryRows, { onConflict: 'id' });
  if (categoryError) throw categoryError;

  const products: Product[] = sourceItems.map(item => ({
    id: item.id,
    sku: item.id.toUpperCase(),
    name: item.name,
    slug: item.id,
    category: item.category,
    categories: ['Food', item.category],
    description: 'Draft food item created from the supplied photograph. Confirm the final product name, description, bulk person packages, prices and stock in Admin before making it available.',
    priceMin: 0,
    image: uploaded.get(item.id)!,
    isFeatured: false,
    stockQuantity: 0,
    stockStatus: 'out_of_stock',
    productType: 'food',
    preparationMinutes: 30,
    allowAsap: true,
    allowScheduled: true,
    variants: [draftVariant(item.id)],
    modifierGroups: [],
  }));
  const productRows = products.map(product => ({
    id: product.id, sku: product.sku, name: product.name, slug: product.slug, category: product.category, categories: product.categories,
    description: product.description, price_min: product.priceMin, image: product.image, is_featured: product.isFeatured,
    stock_quantity: product.stockQuantity, stock_status: product.stockStatus, variants: product.variants,
    product_type: product.productType, preparation_minutes: product.preparationMinutes, allow_asap: product.allowAsap,
    allow_scheduled: product.allowScheduled, modifier_groups: product.modifierGroups, updated_at: new Date().toISOString(),
  }));
  const { error: productError } = await supabaseAdmin.from('products').upsert(productRows, { onConflict: 'id' });
  if (productError) throw productError;

  console.log(`Seeded ${products.length} safe draft food items and ${categories.length} categories. All drafts are out of stock until an administrator confirms names and prices.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
