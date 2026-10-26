import { HttpTypes } from "@medusajs/types"

import { listCollections } from "@/lib/data/collections"
import {
  CollectionSliderClient,
  type CollectionSlide,
} from "./CollectionSliderClient"

type MediaImage = {
  id: string
  url: string
  type?: string | null
  is_thumbnail?: boolean | null
  rank?: number | null
}

type CollectionWithMedia = HttpTypes.StoreCollection & {
  media_images?: MediaImage[]
}

const pickImage = (collection: CollectionWithMedia): string | null => {
  const images = (collection.media_images ?? []).filter((image) => image.url)
  if (!images.length) return null

  const sorted = [...images].sort((a, b) => {
    const thumbnail = Number(b.is_thumbnail ?? false) - Number(a.is_thumbnail ?? false)
    if (thumbnail) return thumbnail
    return (a.rank ?? 0) - (b.rank ?? 0)
  })

  return sorted[0].url
}

export const CollectionSliderSection = async () => {
  const { collections } = await listCollections({
    fields:
      "id,title,handle,media_images.id,media_images.url,media_images.type,media_images.is_thumbnail,media_images.rank",
  })

  const slides: CollectionSlide[] = (collections as CollectionWithMedia[]).map(
    (collection) => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      image: pickImage(collection),
    })
  )

  if (!slides.length) return null

  return <CollectionSliderClient slides={slides} />
}
