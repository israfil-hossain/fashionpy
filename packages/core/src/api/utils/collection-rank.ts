import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import type { Pagination } from "./index-engine"

type RankMetadata = {
  metadata?: Record<string, unknown> | null
}

/**
 * Collections carry their sort position in `metadata.rank` (the product
 * module's `product_collection` has no rank column). The write path exposes it
 * as a top-level `rank` field on create/update; everything else reads it here.
 */
export const getCollectionRank = (
  metadata: Record<string, unknown> | null | undefined
): number | null => {
  const raw = metadata?.rank

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw
  }

  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

export const isRankOrder = (
  order: Record<string, unknown> | null | undefined
): boolean => !!order && "rank" in order

/**
 * Ranked collections come first in rank order (0 before 1). Collections
 * without a rank keep their relative input order and sort after ranked ones,
 * so a list where nothing is ranked is returned untouched.
 */
const sortCollectionsByRank = <T extends RankMetadata>(
  collections: T[],
  direction: unknown
): T[] => {
  const descending = direction === "DESC"

  return collections
    .map((collection, index) => ({
      collection,
      index,
      rank: getCollectionRank(collection.metadata),
    }))
    .sort((a, b) => {
      if (a.rank === null && b.rank === null) {
        return a.index - b.index
      }
      if (a.rank === null) {
        return 1
      }
      if (b.rank === null) {
        return -1
      }
      if (a.rank !== b.rank) {
        return descending ? b.rank - a.rank : a.rank - b.rank
      }
      return a.index - b.index
    })
    .map((entry) => entry.collection)
}

type ListCollectionsByRankOptions = {
  fields: string[]
  filters?: Record<string, unknown>
  pagination?: Pagination
  /**
   * Order the unranked collections keep. Query `pagination.order` cannot sort
   * by `metadata.rank`, so ranking happens in memory after this query; callers
   * pass their historical default (e.g. the store's `-created_at`) here to
   * keep unranked collections where they used to land.
   */
  baseOrder?: Record<string, unknown>
  context?: unknown
  options?: Record<string, unknown>
}

type RankListResult<T> = {
  data: T[]
  metadata: { count: number; skip: number; take?: number }
}

/**
 * Lists collections ordered by rank: fetches every matching id + metadata,
 * sorts by rank in memory, then loads full rows for the requested page so
 * pagination and `count` stay correct.
 */
export const listCollectionsByRank = async <T = Record<string, unknown>>(
  scope: MedusaContainer,
  {
    fields,
    filters = {},
    pagination,
    baseOrder,
    context,
    options,
  }: ListCollectionsByRankOptions
): Promise<RankListResult<T>> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const skip = pagination?.skip ?? 0
  const take = pagination?.take
  const direction = isRankOrder(pagination?.order)
    ? pagination?.order?.rank
    : "ASC"

  const { data: all } = await query.graph(
    {
      entity: "product_collection",
      fields: ["id", "metadata"],
      filters,
      ...(baseOrder ? { pagination: { order: baseOrder } } : {}),
      ...(context ? { context } : {}),
    },
    options
  )

  const sorted = sortCollectionsByRank(all as (T & RankMetadata)[], direction)
  const page = take === undefined ? sorted : sorted.slice(skip, skip + take)
  const pageIds = page.map(
    (collection) => (collection as unknown as { id: string }).id
  )

  if (!pageIds.length) {
    return { data: [], metadata: { count: sorted.length, skip, take } }
  }

  const { data } = await query.graph(
    {
      entity: "product_collection",
      // The page is re-assembled by id, so the key has to be selected even
      // when the caller did not ask for it.
      fields: fields.includes("id") ? fields : ["id", ...fields],
      filters: { ...filters, id: pageIds },
      ...(context ? { context } : {}),
    },
    options
  )

  const byId = new Map(
    (data as { id: string }[]).map((row) => [row.id, row as unknown as T])
  )
  const collections = pageIds
    .map((id) => byId.get(id))
    .filter((row): row is T => row !== undefined)

  return { data: collections, metadata: { count: sorted.length, skip, take } }
}
