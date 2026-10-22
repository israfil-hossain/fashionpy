export const defaultAdminHeroBannerFields = [
  "id",
  "title",
  "subtitle",
  "description",
  "image_url",
  "cta_text",
  "cta_link",
  "text_position",
  "slot",
  "is_active",
  "rank",
  "starts_at",
  "ends_at",
  "metadata",
  "created_at",
  "updated_at",
  "deleted_at",
]

export const adminHeroBannerQueryConfig = {
  list: {
    defaults: defaultAdminHeroBannerFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminHeroBannerFields,
    isList: false,
  },
}
