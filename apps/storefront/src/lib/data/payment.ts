'use server';

import { HttpTypes } from '@medusajs/types';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';

export const listCartPaymentMethods = async (regionId: string) => {
  if (!regionId) {
    return null;
  }

  return (sdk.store.paymentProviders
    .query({
      region_id: regionId,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'no-store'
      }
    } as never) as unknown as Promise<HttpTypes.StorePaymentProviderListResponse>)
    .then(({ payment_providers }) =>
      payment_providers.sort((a, b) => {
        return a.id > b.id ? 1 : -1;
      })
    )
    .catch(error => {
      console.error('[checkout] failed to list payment providers:', error);
      return null;
    });
};
