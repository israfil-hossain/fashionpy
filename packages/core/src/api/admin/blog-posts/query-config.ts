export const defaultAdminBlogPostFields = [
  "id",
  "title",
  "slug",
  "excerpt",
  "content",
  "cover_image_id",
  "cover_image_url",
  "status",
  "published_at",
  "unpublished_at",
  "country_codes",
  "category_id",
  "tags",
  "author",
  "metadata",
  "created_at",
  "updated_at",
  "deleted_at",
]

export const defaultAdminBlogPostDetailFields = [
  ...defaultAdminBlogPostFields,
  "category.id",
  "category.name",
  "category.slug",
]

export const adminBlogPostQueryConfig = {
  list: {
    defaults: defaultAdminBlogPostFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminBlogPostDetailFields,
    isList: false,
  },
}

export const defaultAdminBlogCategoryFields = [
  "id",
  "name",
  "slug",
  "metadata",
  "created_at",
  "updated_at",
  "deleted_at",
]

export const adminBlogCategoryQueryConfig = {
  list: {
    defaults: defaultAdminBlogCategoryFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminBlogCategoryFields,
    isList: false,
  },
}
