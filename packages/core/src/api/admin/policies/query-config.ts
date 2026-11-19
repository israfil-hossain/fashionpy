export const defaultAdminPolicyPageFields = [
  "id",
  "title",
  "slug",
  "excerpt",
  "content",
  "status",
  "published_at",
  "unpublished_at",
  "country_codes",
  "metadata",
  "created_at",
  "updated_at",
  "deleted_at",
]

export const adminPolicyPageQueryConfig = {
  list: {
    defaults: defaultAdminPolicyPageFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminPolicyPageFields,
    isList: false,
  },
}
