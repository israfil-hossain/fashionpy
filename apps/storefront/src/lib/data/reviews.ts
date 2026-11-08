'use server';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';
import { CACHE_TAGS, getGlobalCacheOptions } from './cache-tags';
import type { StoreReview } from '@/components/organisms/ProductReviews/ProductReviews';

/**
 * Published reviews for a product. Public listing — no session required
 * (the store route scopes to the customer only when product_id is absent).
 */
export const listProductReviews = async (
  productId: string
): Promise<StoreReview[]> => {
  if (!productId) return []

  try {
    const headers = await getAuthHeaders()
    const { reviews } = (await sdk.store.reviews.query({
      product_id: productId,
      status: 'published',
      limit: 50,
      fetchOptions: {
        headers,
        cache: 'force-cache',
        next: getGlobalCacheOptions(CACHE_TAGS.products),
      },
    } as never)) as { reviews?: StoreReview[] }

    return Array.isArray(reviews) ? reviews : []
  } catch {
    return []
  }
};
