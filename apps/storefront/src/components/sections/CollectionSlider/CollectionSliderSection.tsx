import { listCollections } from "@/lib/data/collections"
import {
  COLLECTION_MEDIA_FIELDS,
  pickCollectionImage,
  type CollectionWithMedia,
} from "@/lib/helpers/collection-image"
import {
  CollectionSliderClient,
  type CollectionSlide,
} from "./CollectionSliderClient"

export const CollectionSliderSection = async () => {
  const { collections } = await listCollections({
    fields: `id,title,handle,${COLLECTION_MEDIA_FIELDS}`,
  })

  const slides: CollectionSlide[] = (collections as CollectionWithMedia[]).map(
    (collection) => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      image: pickCollectionImage(collection, "thumbnail"),
    })
  )

  if (!slides.length) return null

  return <CollectionSliderClient slides={slides} />
}
