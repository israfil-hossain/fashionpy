import {
  buildAllowedFields,
  prefixAllowedFields,
} from "@medusajs/medusa/api/store/utils/allowed-fields"

import { defaultStoreProductFields } from "../products/query-config"

// Medusa's store collection defaults plus the Mercur media link alias, so the
// storefront can render collection images in a single round-trip.
export const defaultStoreCollectionFields = [
  "id",
  "title",
  "handle",
  "external_id",
  "created_at",
  "updated_at",
  "media_images.id",
  "media_images.url",
  "media_images.type",
  "media_images.is_thumbnail",
  "media_images.is_banner",
  "media_images.rank",
]

export const allowedStoreCollectionExtraFields = [
  "products",
  "metadata",
  "deleted_at",
  ...prefixAllowedFields("products", defaultStoreProductFields),
]

export const storeCollectionQueryConfig = {
  list: {
    defaults: defaultStoreCollectionFields,
    allowed: buildAllowedFields(
      defaultStoreCollectionFields,
      allowedStoreCollectionExtraFields
    ),
    defaultLimit: 10,
    isList: true,
  },
}
