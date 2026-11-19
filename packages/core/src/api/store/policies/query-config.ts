export const listStorePolicyPageFields = [
  "id",
  "title",
  "slug",
  "excerpt",
  "status",
  "published_at",
  "created_at",
  "updated_at",
]

export const retrieveStorePolicyPageFields = [
  ...listStorePolicyPageFields,
  "content",
  "country_codes",
]

export const storePolicyPageQueryConfig = {
  list: {
    defaults: listStorePolicyPageFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: retrieveStorePolicyPageFields,
    isList: false,
  },
}
