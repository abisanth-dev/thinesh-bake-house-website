import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { supabaseAdmin } from '../server/supabaseClient.js';
import { uploadImageBuffer } from '../server/storage.js';

const sourceItems = [
  {
    id: 'food-prawn-rice-and-curry', sku: 'FOOD-PRC', name: 'Prawn Rice & Curry', category: 'Rice & Curry',
    description: 'Steamed rice served with prawn curry and a selection of traditional vegetable curries and sambols.',
    imagePath: 'C:/Users/abisa/Downloads/ChatGPT Image Aug 8, 2026, 01_41_11 PM.png',
  },
  {
    id: 'food-chicken-rice-and-curry', sku: 'FOOD-CRC', name: 'Chicken Rice & Curry', category: 'Rice & Curry',
    description: 'Steamed rice served with chicken curry and a selection of traditional vegetable curries and sambols.',
    imagePath: 'C:/Users/abisa/Downloads/ChatGPT Image Aug 8, 2026, 01_41_06 PM.png',
  },
  {
    id: 'food-fish-rice-and-curry', sku: 'FOOD-FRC', name: 'Fish Rice & Curry', category: 'Rice & Curry',
    description: 'Steamed rice served with fish curry and a selection of traditional vegetable curries and sambols.',
    imagePath: 'C:/Users/abisa/Downloads/ChatGPT Image Aug 8, 2026, 01_41_01 PM.png',
  },
  {
    id: 'food-parotta', sku: 'FOOD-PAROTTA', name: 'Parotta', category: 'Breads',
    description: 'Soft, flaky layered parotta, freshly prepared and ideal for serving with your choice of curry.',
    imagePath: 'C:/Users/abisa/Downloads/ChatGPT Image Aug 8, 2026, 01_40_55 PM.png',
  },
  {
    id: 'food-meat-biryani', sku: 'FOOD-MEAT-BIRYANI', name: 'Meat Biryani', category: 'Biryani',
    description: 'Fragrant basmati rice cooked with seasoned meat, aromatic spices, herbs and a boiled egg.',
    imagePath: 'C:/Users/abisa/Downloads/ChatGPT Image Aug 6, 2026, 04_59_20 AM.png',
  },
] as const;

const packageFor = (productId: string, servesPersons: number, price: number) => ({
  id: `${productId}-serves-${servesPersons}`,
  sku: `${productId.toUpperCase()}-P${servesPersons}`,
  servesPersons,
  price,
  regularPrice: price,
  stockQuantity: 25,
  stockStatus: 'in_stock',
  attributes: [{ name: 'Serves', option: `${servesPersons} persons` }],
});

async function main() {
  if (!process.argv.includes('--confirm')) {
    throw new Error('Safety stop: run with --confirm after reviewing the five food products and default packages.');
  }

  const categoryNames = [...new Set(sourceItems.map(item => item.category))];
  for (const name of categoryNames) {
    const representative = sourceItems.find(item => item.category === name)!;
    const { data: existingProduct } = await supabaseAdmin.from('products').select('image').eq('id', representative.id).maybeSingle();
    let categoryImage = existingProduct?.image;
    if (!categoryImage) {
      const extension = extname(representative.imagePath);
      categoryImage = await uploadImageBuffer(
        await readFile(representative.imagePath),
        `category-${basename(representative.imagePath, extension)}`,
        'image/png',
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { error } = await supabaseAdmin.from('categories').upsert({
      id: `food-category-${slug}`,
      name,
      slug,
      description: `Freshly prepared ${name.toLowerCase()} food packages.`,
      image: categoryImage,
      is_featured: true,
      menu_group: 'food',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
  }

  const rows = [];
  for (const item of sourceItems) {
    const { data: existing, error: existingError } = await supabaseAdmin.from('products').select('image').eq('id', item.id).maybeSingle();
    if (existingError) throw existingError;

    let image = existing?.image;
    if (!image) {
      const extension = extname(item.imagePath);
      image = await uploadImageBuffer(await readFile(item.imagePath), basename(item.imagePath, extension), 'image/png');
    }

    const packages = [packageFor(item.id, 5, 5000), packageFor(item.id, 10, 9500)];
    rows.push({
      id: item.id,
      sku: item.sku,
      name: item.name,
      slug: item.id,
      category: item.category,
      categories: ['Food', item.category],
      short_description: item.description,
      description: item.description,
      price_min: 5000,
      price_max: 9500,
      regular_price: 5000,
      image,
      gallery: [],
      tags: ['Food', item.category],
      is_featured: false,
      is_fast_moving: false,
      stock_quantity: 50,
      stock_status: 'in_stock',
      variants: packages,
      product_type: 'food',
      preparation_minutes: 60,
      allow_asap: true,
      allow_scheduled: true,
      modifier_groups: [],
      updated_at: new Date().toISOString(),
    });
  }

  const { error: productError } = await supabaseAdmin.from('products').upsert(rows, { onConflict: 'id' });
  if (productError) throw productError;

  for (const name of categoryNames) {
    const { count, error: countError } = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('category', name);
    if (countError) throw countError;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { error } = await supabaseAdmin.from('categories').update({ count: count ?? 0 }).eq('id', `food-category-${slug}`);
    if (error) throw error;
  }

  console.log(`Added ${rows.length} food products with 5-person (Rs. 5,000) and 10-person (Rs. 9,500) default packages.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
