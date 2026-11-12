import type { HttpTypes } from "@medusajs/types"

export type CollectionMediaImage = {
  id?: string
  url: string
  type?: string | null
  is_thumbnail?: boolean | null
  is_banner?: boolean | null
  rank?: number | null
}

export type CollectionWithMedia = HttpTypes.StoreCollection & {
  media_images?: CollectionMediaImage[]
}

export const COLLECTION_MEDIA_FIELDS = [
  "media_images.id",
  "media_images.url",
  "media_images.type",
  "media_images.is_thumbnail",
  "media_images.is_banner",
  "media_images.rank",
].join(",")

/**
 * Image for a collection card. `banner` role prefers the wide `is_banner`
 * asset, `thumbnail` role the square `is_thumbnail` one; both fall back to the
 * next-ranked image so a collection never renders without artwork.
 */
export const pickCollectionImage = (
  collection: CollectionWithMedia,
  role: "banner" | "thumbnail" = "thumbnail"
): string | null => {
  const images = (collection.media_images ?? [])
    .filter((image) => image.url)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  if (!images.length) return null

  if (role === "banner") {
    return (
      images.find((image) => image.is_banner)?.url ??
      images.find((image) => image.is_thumbnail)?.url ??
      images[0].url
    )
  }

  return images.find((image) => image.is_thumbnail)?.url ?? images[0].url
}
