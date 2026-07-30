function cleanHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

export interface WcFetchParams {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

export async function fetchWooCommerceCategories({ url, consumerKey, consumerSecret }: WcFetchParams) {
  const cleanUrl = url.replace(/\/$/, '');
  const endpoint = `${cleanUrl}/wp-json/wc/v3/products/categories?per_page=100&consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`;
  const basicAuth = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(endpoint, {
    headers: {
      'Authorization': basicAuth,
      'User-Agent': 'ThineshBakeHouse-WooCommerceSync/1.0',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WooCommerce Category API returned HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const rawCategories = await response.json();
  if (!Array.isArray(rawCategories)) {
    throw new Error('WooCommerce returned invalid category format.');
  }

  return rawCategories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    count: cat.count || 0,
    description: cleanHtml(cat.description),
    image: cat.image?.src || undefined,
  }));
}

export async function fetchWooCommerceProducts({ url, consumerKey, consumerSecret }: WcFetchParams) {
  const cleanUrl = url.replace(/\/$/, '');
  const endpoint = `${cleanUrl}/wp-json/wc/v3/products?per_page=100&status=publish&consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`;
  const basicAuth = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(endpoint, {
    headers: {
      'Authorization': basicAuth,
      'User-Agent': 'ThineshBakeHouse-WooCommerceSync/1.0',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WooCommerce Product API returned HTTP ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const rawProducts = await response.json();
  if (!Array.isArray(rawProducts)) {
    throw new Error('WooCommerce returned invalid product format.');
  }

  return rawProducts.map((p: any) => {
    // Extract price numbers safely
    const regularPrice = parseFloat(p.regular_price || p.price || '0') || 0;
    const salePrice = p.sale_price ? parseFloat(p.sale_price) || undefined : undefined;
    const priceMin = parseFloat(p.price || p.sale_price || p.regular_price || '0') || 0;
    const onSale = Boolean(p.on_sale) || (salePrice !== undefined && salePrice < regularPrice);

    const mainCategory = p.categories && p.categories.length > 0
      ? p.categories[0].name
      : 'General';

    const allCatNames = p.categories ? p.categories.map((c: any) => c.name) : [];

    const galleryUrls: string[] = (p.images || []).map((img: any) => img.src).filter(Boolean);
    const image = galleryUrls[0] || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600';

    const shortDescription = cleanHtml(p.short_description) || undefined;
    const description = cleanHtml(p.description || p.short_description) || `${p.name} - Available at Thinesh Bake House.`;

    // Detect attributes
    const typeAttr = p.attributes?.find((a: any) =>
      a.name.toLowerCase().includes('type') || a.name.toLowerCase().includes('flavor')
    );
    const weightAttr = p.attributes?.find((a: any) =>
      a.name.toLowerCase().includes('weight') || a.name.toLowerCase().includes('size')
    );

    return {
      id: `wc-${p.id}`,
      sku: p.sku || undefined,
      name: p.name,
      category: mainCategory,
      categories: allCatNames.length > 0 ? allCatNames : undefined,
      priceMin,
      regularPrice,
      salePrice,
      onSale,
      shortDescription,
      description,
      image,
      gallery: galleryUrls.length > 0 ? galleryUrls : undefined,
      isCustomizable: p.type === 'variable' || (p.attributes && p.attributes.length > 0),
      cakeTypes: typeAttr?.options,
      weights: weightAttr?.options,
      stockQuantity: typeof p.stock_quantity === 'number' ? p.stock_quantity : undefined,
      stockStatus: p.stock_status === 'instock' ? 'in_stock' : p.stock_status === 'outofstock' ? 'out_of_stock' : undefined,
      wcId: p.id,
      wcPermalink: p.permalink,
      rawWcCategories: allCatNames,
    };
  });
}
