/**
 * Public allowlist for `GET /store/promotions`. Never expand budget, rules,
 * seller links, or usage counters — the storefront only needs enough to render
 * a copyable promo-code card.
 */
export const listStorePromotionFields = [
  "id",
  "code",
  "type",
  "is_automatic",
  "application_method.value",
  "application_method.type",
  "application_method.currency_code",
  "campaign.name",
  "campaign.description",
  "campaign.starts_at",
  "campaign.ends_at",
]

export const storePromotionQueryConfig = {
  list: {
    defaults: listStorePromotionFields,
    defaultLimit: 10,
    isList: true,
  },
}
