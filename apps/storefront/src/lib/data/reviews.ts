'use server';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';
import { CACHE_TAGS, getCatalogFetchOptions } from './cache-tags';
import type { StoreReview } from '@/components/organisms/ProductReviews/ProductReviews';

export type MyReview = {
  id: string;
  display_id?: number;
  reference: 'product' | 'seller';
  rating: number;
  customer_note: string | null;
  seller_note: string | null;
  status: 'pending' | 'published' | 'rejected';
  created_at: string;
};

/**
 * The storefront sdk is intentionally untyped (`Routes = Record<string,
 * unknown>`), so cast once to a narrow facade instead of per call site.
 */
type ReviewsRoutes = {
  query: (
    input: Record<string, unknown>
  ) => Promise<{ reviews?: StoreReview[] | MyReview[] }>
};

const reviewRoutes = sdk.store as unknown as { reviews: ReviewsRoutes };

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
    const { reviews } = await reviewRoutes.reviews.query({
      product_id: productId,
      status: 'published',
      limit: 50,
      fetchOptions: {
        headers,
        ...getCatalogFetchOptions(CACHE_TAGS.products),
      },
    })

    return Array.isArray(reviews) ? (reviews as StoreReview[]) : []
  } catch {
    return []
  }
};

/**
 * The signed-in customer's own reviews. `GET /store/reviews` without a
 * product/seller filter scopes to the session customer (auth required).
 */
export const listMyReviews = async (): Promise<MyReview[]> => {
  try {
    const headers = await getAuthHeaders()
    const { reviews } = await reviewRoutes.reviews.query({
      limit: 50,
      fetchOptions: { headers },
    })

    return Array.isArray(reviews) ? (reviews as MyReview[]) : []
  } catch {
    return []
  }
};
