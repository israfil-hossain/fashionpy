'use server';

import { HttpTypes } from "@medusajs/types";

import medusaError from "@/lib/helpers/medusa-error";

import { sdk } from "../client";
import { CACHE_TAGS, getGlobalCacheOptions } from "./cache-tags";
import { getCacheOptions } from "./cookies";

export const retrieveStoreSettings = async () => {
  const next = {
    ...(await getCacheOptions('store')),
    revalidate: 3600,
  };

  return sdk.store.storeSettings
    .query({ fetchOptions: { next, cache: 'force-cache' } })
    .then(({ data }) => data)
    .catch(medusaError);
};