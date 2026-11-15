'use server';

import { sdk } from '../client';
import { CACHE_TAGS, getCatalogFetchOptions } from './cache-tags';

export type HomePromotion = {
  id: string;
  code: string;
  type: string;
  is_automatic: boolean;
  application_method?: {
    value?: number;
    type?: string;
    currency_code?: string | null;
  } | null;
  campaign?: {
    name?: string;
    description?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
};

export const listHomePromotions = async (): Promise<HomePromotion[]> => {
  try {
    const res = (await sdk.store.promotions.query({
      limit: 10,
      fetchOptions: getCatalogFetchOptions(CACHE_TAGS.promotions),
    } as never)) as { promotions?: HomePromotion[] };
    return res?.promotions ?? [];
  } catch (error) {
    console.error('[promotions] failed to fetch active promotions:', error);
    return [];
  }
};
