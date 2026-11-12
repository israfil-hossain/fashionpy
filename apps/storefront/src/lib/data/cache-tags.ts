/**
 * Catalog-wide cache tags. Unlike the per-visitor `getCacheOptions` in
 * `cookies.ts`, these are NOT suffixed with `_medusa_cache_id`, so the backend
 * can name and invalidate them from a webhook (see
 * `src/app/api/revalidate/route.ts`). Only use these for non-personalized
 * catalog data — never for cart/order/customer.
 *
 * This module is intentionally free of `server-only` / `next/headers` so it can
 * be imported by catalog data files that also end up in client bundles.
 */
export const CACHE_TAGS = {
  products: 'products',
  product: (handle: string) => `product-${handle}`,
  offers: 'offers',
  offer: (id: string) => `offer-${id}`,
  productOffers: (productId: string) => `product-offers-${productId}`,
  collections: 'collections',
  collection: (handle: string) => `collection-${handle}`,
  categories: 'categories',
  category: (handle: string) => `category-${handle}`,
  store: 'store',
  heroBanners: 'hero-banners',
  blogPosts: 'blog-posts',
} as const;

/**
 * Webhook-driven invalidation with a time-based fallback: the backend pushes a
 * `revalidateTag` from its subscriber, and the 5-minute TTL catches anything
 * the webhook missed (or was never sent for).
 */
const FALLBACK_TTL_SECONDS = 300;

export const getGlobalCacheOptions = (
  base: string,
  scoped?: string
): { revalidate: number; tags: string[] } => {
  const tags = scoped ? [base, scoped] : [base];
  return { revalidate: FALLBACK_TTL_SECONDS, tags };
};

/**
 * Fetch options for catalog data. Production serves the tagged, TTL-cached
 * response; development never caches so admin edits show up on refresh.
 */
export const getCatalogFetchOptions = (
  base: string,
  scoped?: string
):
  | { cache: 'no-store' }
  | { cache: 'force-cache'; next: { revalidate: number; tags: string[] } } => {
  if (process.env.NODE_ENV === 'development') {
    return { cache: 'no-store' };
  }
  return { cache: 'force-cache', next: getGlobalCacheOptions(base, scoped) };
};
