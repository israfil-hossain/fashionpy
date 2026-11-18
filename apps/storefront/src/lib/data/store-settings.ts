'use server';

import { HttpTypes } from "@medusajs/types";
import { normalizeHomeLayout, type HomeLayoutSection } from "@mercurjs/types";

import medusaError from "@/lib/helpers/medusa-error";

import { sdk } from "../client";
import { CACHE_TAGS, getCatalogFetchOptions } from "./cache-tags";
import { getCacheOptions } from "./cookies";

export const retrieveStoreSettings = async () => {
  const next = {
    ...(await getCacheOptions('store')),
    revalidate: 3600,
  };

  // The endpoint returns `{ announcement, home_layout }` at the top level —
  // there is no `data` wrapper (destructuring one made every setting resolve
  // to undefined).
  return sdk.store.storeSettings
    .query({ fetchOptions: { next, cache: 'force-cache' } })
    .catch(medusaError);
};

/**
 * Ordered + flagged home-page sections from `store.metadata.home_layout`,
 * normalized against the current section registry so newly shipped sections
 * appear with their defaults and removed ones drop out. Failures fall back to
 * the default layout — the home page must never hard-fail on this.
 */
export const retrieveHomeLayout = async (): Promise<HomeLayoutSection[]> => {
  try {
    const settings = (await sdk.store.storeSettings.query({
      fetchOptions: getCatalogFetchOptions(CACHE_TAGS.store),
    } as never)) as { home_layout?: unknown } | undefined;
    const homeLayout = settings?.home_layout ?? null;

    if (!homeLayout) {
      console.warn(
        "[store-settings] no home_layout in store settings response — rendering the default section order (nothing saved yet, or the settings endpoint returned an empty projection)"
      );
    }

    return normalizeHomeLayout(homeLayout);
  } catch (error) {
    console.error('[store-settings] failed to fetch home layout:', error);
    return normalizeHomeLayout(null);
  }
};