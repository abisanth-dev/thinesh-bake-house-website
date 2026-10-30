function cleanHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

export interface WcFetchParams {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

function createRequestContext({ url, consumerKey, consumerSecret }: WcFetchParams) {
  return {
    baseUrl: url.replace(/\/$/, ''),
    headers: {
      Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
      'User-Agent': 'ThineshBakeHouse-WooCommerceSync/1.0',
      Accept: 'application/json',
    },
  };
}

async function fetchAllPages(params: WcFetchParams, resourcePath: string, query: Record<string, string> = {}) {
  const { baseUrl, headers } = createRequestContext(params);
  const records: any[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const endpoint = new URL(`${baseUrl}/wp-json/wc/v3/${resourcePath}`);
    endpoint.searchParams.set('per_page', '100');
    endpoint.searchParams.set('page', String(page));
    Object.entries(query).forEach(([key, value]) => endpoint.searchParams.set(key, value));

    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WooCommerce ${resourcePath} API returned HTTP ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const pageRecords = await response.json();
    if (!Array.isArray(pageRecords)) throw new Error(`WooCommerce returned invalid ${resourcePath} data.`);
    records.push(...pageRecords);
    totalPages = Math.max(1, Number(response.headers.get('x-wp-totalpages') || 1));
    page += 1;
  } while (page <= totalPages);

  return records;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export async function fetchWooCommerceCategories(params: WcFetchParams) {
  const rawCategories = await fetchAllPages(params, 'products/categories', { hide_empty: 'false' });
  return rawCategories.map((category: any) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parent ? String(category.parent) : null,
    count: category.count || 0,
    description: cleanHtml(category.description),
    image: category.image?.src || undefined,
  }));
}

export async function fetchWooCommerceProducts(params: WcFetchParams) {
  const rawProducts = await fetchAllPages(params, 'products', { status: 'publish' });

  return mapWithConcurrency(rawProducts, 5, async (product: any) => {
    const rawVariations = product.type === 'variable'
      ? await fetchAllPages(params, `products/${product.id}/variations`, { status: 'publish' })
      : [];

    const variants = rawVariations.map((variation: any) => ({
      id: `wc-variation-${variation.id}`,
      wcId: variation.id,
      sku: variation.sku || undefined,
      price: Number.parseFloat(variation.price || variation.sale_price || variation.regular_price || '0') || 0,
      regularPrice: variation.regular_price ? Number.parseFloat(variation.regular_price) : undefined,
      salePrice: variation.sale_price ? Number.parseFloat(variation.sale_price) : undefined,
      image: variation.image?.src || undefined,
      stockQuantity: typeof variation.stock_quantity === 'number' ? variation.stock_quantity : undefined,
      stockStatus: variation.stock_status === 'instock' ? 'in_stock' : variation.stock_status === 'outofstock' ? 'out_of_stock' : undefined,
      attributes: (variation.attributes || []).map((attribute: any) => ({ name: attribute.name, option: attribute.option })),
    }));

    const regularPrice = Number.parseFloat(product.regular_price || product.price || '0') || 0;
    const salePrice = product.sale_price ? Number.parseFloat(product.sale_price) || undefined : undefined;
    const variantPrices = variants.map(variant => variant.price).filter(price => price > 0);
    const productPrice = Number.parseFloat(product.price || product.sale_price || product.regular_price || '0') || 0;
    const priceMin = variantPrices.length > 0 ? Math.min(...variantPrices) : productPrice;
    const priceMax = variantPrices.length > 0 ? Math.max(...variantPrices) : undefined;
    const onSale = Boolean(product.on_sale) || (salePrice !== undefined && salePrice < regularPrice);
    const categories = (product.categories || []).map((category: any) => category.name);
    const galleryUrls: string[] = (product.images || []).map((image: any) => image.src).filter(Boolean);
    const typeAttribute = product.attributes?.find((attribute: any) => /type|flavou?r/i.test(attribute.name));
    const weightAttribute = product.attributes?.find((attribute: any) => /weight|size/i.test(attribute.name));

    return {
      id: `wc-${product.id}`,
      sku: product.sku || undefined,
      name: product.name,
      slug: product.slug || undefined,
      category: categories[0] || 'General',
      categories: categories.length > 0 ? categories : undefined,
      priceMin,
      priceMax: priceMax && priceMax !== priceMin ? priceMax : undefined,
      regularPrice,
      salePrice,
      onSale,
      shortDescription: cleanHtml(product.short_description) || undefined,
      description: cleanHtml(product.description || product.short_description) || `${product.name} - Available at Thinesh Bake House.`,
      image: galleryUrls[0] || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
      gallery: galleryUrls.length > 0 ? galleryUrls : undefined,
      tags: (product.tags || []).map((tag: any) => tag.name).filter(Boolean),
      isCustomizable: product.type === 'variable' || Boolean(product.attributes?.length),
      cakeTypes: typeAttribute?.options,
      weights: weightAttribute?.options,
      stockQuantity: typeof product.stock_quantity === 'number' ? product.stock_quantity : undefined,
      stockStatus: product.stock_status === 'instock' ? 'in_stock' : product.stock_status === 'outofstock' ? 'out_of_stock' : undefined,
      wcId: product.id,
      wcPermalink: product.permalink,
      rawWcCategories: categories,
      variants: variants.length > 0 ? variants : undefined,
    };
  });
}
