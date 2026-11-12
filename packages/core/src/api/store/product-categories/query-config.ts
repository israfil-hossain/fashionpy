export const storeProductCategoryFields = [
  "id",
  "name",
  "description",
  "handle",
  "rank",
  "parent_category_id",
  "created_at",
  "updated_at",
  "metadata",
  "*parent_category",
  "*category_children",
  "media_images.id",
  "media_images.url",
  "media_images.type",
  "media_images.is_thumbnail",
  "media_images.is_banner",
  "media_images.rank",
  "category_children.media_images.id",
  "category_children.media_images.url",
  "category_children.media_images.type",
  "category_children.media_images.is_thumbnail",
  "category_children.media_images.is_banner",
  "category_children.media_images.rank",
]

export const storeProductCategoryQueryConfig = {
  list: {
    defaults: storeProductCategoryFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: storeProductCategoryFields,
    isList: false,
  },
}
