"use server"

import { HttpTypes } from "@medusajs/types"
import { CACHE_TAGS, getCatalogFetchOptions } from "./cache-tags"
import { sdk } from "../client"

export const retrieveCollection = async (id: string) => {
  return (sdk.store.collections.$id
    .query({
      $id: id,
      fetchOptions: getCatalogFetchOptions(
        CACHE_TAGS.collections,
        CACHE_TAGS.collection(id)
      ),
    } as never) as unknown as Promise<{ collection: HttpTypes.StoreCollection }>)
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  return (sdk.store.collections
    .query({
      ...queryParams,
      fetchOptions: getCatalogFetchOptions(CACHE_TAGS.collections),
    } as never) as unknown as Promise<{ collections: HttpTypes.StoreCollection[]; count: number }>)
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection> => {
  return (sdk.store.collections
    .query({
      handle,
      fields: "*products",
      fetchOptions: getCatalogFetchOptions(
        CACHE_TAGS.collections,
        CACHE_TAGS.collection(handle)
      ),
    } as never) as unknown as Promise<HttpTypes.StoreCollectionListResponse>)
    .then(({ collections }) => collections[0])
}
