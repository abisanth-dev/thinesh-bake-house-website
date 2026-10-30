import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { supabaseAdmin } from '../server/supabaseClient.js';
import { uploadImageBuffer } from '../server/storage.js';

const DEFAULT_PRICE = 250;
const CATEGORY_NAME = 'Piece cake';

const products = [
  {
    id: 'piece-cake-matcha-roll',
    sku: 'PC-MATCHA-ROLL',
    name: 'Matcha Roll Cake',
    description: 'Soft matcha sponge rolled with a smooth cream filling and finished with a glossy matcha topping.',
    imagePath: 'D:/TBH/photo_2026-08-07_11-53-45 (2).jpg',
  },
  {
    id: 'piece-cake-red-velvet-roll',
    sku: 'PC-RED-VELVET-ROLL',
    name: 'Red Velvet Roll Cake',
    description: 'Red velvet sponge rolled with a light cream filling and topped with red velvet crumbs and a cherry.',
    imagePath: 'D:/TBH/photo_2026-08-07_11-53-45.jpg',
  },
  {
    id: 'piece-cake-chocolate-roll',
    sku: 'PC-CHOCOLATE-ROLL',
    name: 'Chocolate Roll Cake',
    description: 'Rich chocolate sponge rolled with chocolate cream and finished with chocolate glaze and coconut.',
    imagePath: 'D:/TBH/photo_2026-08-07_11-53-46.jpg',
  },
  {
    id: 'piece-cake-strawberry-roll',
    sku: 'PC-STRAWBERRY-ROLL',
    name: 'Strawberry Roll Cake',
    description: 'Vanilla sponge rolled with strawberry cream and finished with a bright strawberry glaze.',
    imagePath: 'D:/TBH/photo_2026-08-07_11-53-47.jpg',
  },
  {
    id: 'piece-cake-blueberry-roll',
    sku: 'PC-BLUEBERRY-ROLL',
    name: 'Blueberry Roll Cake',
    description: 'Vanilla sponge rolled with fresh cream and finished with a glossy blueberry topping.',
    imagePath: 'D:/TBH/photo_2026-08-07_11-53-55.jpg',
  },
] as const;

async function main() {
  if (!process.argv.includes('--confirm')) {
    throw new Error('Safety stop: run with --confirm after reviewing the five products and provisional Rs. 250 price.');
  }

  const { data: category, error: categoryError } = await supabaseAdmin
    .from('categories')
    .select('id,name,menu_group')
    .eq('name', CATEGORY_NAME)
    .maybeSingle();
  if (categoryError) throw categoryError;
  if (!category) {
    const { data: categoryNames, error: categoryNamesError } = await supabaseAdmin
      .from('categories')
      .select('name')
      .order('name');
    if (categoryNamesError) throw categoryNamesError;
    throw new Error(`The Piece Cake category does not exist. Available categories: ${(categoryNames ?? []).map(item => item.name).join(', ')}`);
  }
  if (category.menu_group && category.menu_group !== 'bakery') {
    throw new Error(`Piece Cake belongs to the ${category.menu_group} menu group instead of bakery.`);
  }

  const rows = [];
  for (const product of products) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('products')
      .select('image')
      .eq('id', product.id)
      .maybeSingle();
    if (existingError) throw existingError;

    let image = existing?.image;
    if (!image) {
      const extension = extname(product.imagePath);
      image = await uploadImageBuffer(
        await readFile(product.imagePath),
        basename(product.imagePath, extension),
        'image/jpeg',
      );
    }

    rows.push({
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.id,
      category: CATEGORY_NAME,
      categories: [CATEGORY_NAME],
      short_description: product.description,
      description: product.description,
      price_min: DEFAULT_PRICE,
      regular_price: DEFAULT_PRICE,
      on_sale: false,
      image,
      gallery: [],
      tags: ['Roll Cake', 'Piece Cake'],
      is_customizable: false,
      is_featured: false,
      is_fast_moving: false,
      stock_quantity: 50,
      stock_status: 'in_stock',
      variants: [],
      product_type: 'bakery',
      updated_at: new Date().toISOString(),
    });
  }

  const { error: productError } = await supabaseAdmin.from('products').upsert(rows, { onConflict: 'id' });
  if (productError) throw productError;

  const { count, error: countError } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category', CATEGORY_NAME);
  if (countError) throw countError;

  const { error: updateCategoryError } = await supabaseAdmin
    .from('categories')
    .update({ count: count ?? products.length, updated_at: new Date().toISOString() })
    .eq('id', category.id);
  if (updateCategoryError) throw updateCategoryError;

  console.log(`Added ${rows.length} Piece Cake products at the provisional price Rs. ${DEFAULT_PRICE}.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
