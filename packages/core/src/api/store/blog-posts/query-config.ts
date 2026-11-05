export const listStoreBlogPostFields = [
  "id",
  "title",
  "slug",
  "excerpt",
  "cover_image_url",
  "status",
  "published_at",
  "tags",
  "author",
  "category_id",
  "created_at",
  "updated_at",
]

export const retrieveStoreBlogPostFields = [
  ...listStoreBlogPostFields,
  "content",
  "country_codes",
  "category.id",
  "category.name",
  "category.slug",
]

export const storeBlogPostQueryConfig = {
  list: {
    defaults: listStoreBlogPostFields,
    defaultLimit: 12,
    isList: true,
  },
  retrieve: {
    defaults: retrieveStoreBlogPostFields,
    isList: false,
  },
}

export const listStoreBlogCategoryFields = [
  "id",
  "name",
  "slug",
  "created_at",
  "updated_at",
]

export const storeBlogCategoryQueryConfig = {
  list: {
    defaults: listStoreBlogCategoryFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: listStoreBlogCategoryFields,
    isList: false,
  },
}
