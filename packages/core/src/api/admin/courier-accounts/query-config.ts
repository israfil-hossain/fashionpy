/**
 * Credentials (`data`) are never returned to the client.
 */
export const adminCourierAccountFields = [
  "id",
  "provider",
  "seller_id",
  "status",
  "cod_enabled",
  "created_at",
  "updated_at",
]

export const adminCourierAccountQueryConfig = {
  list: {
    defaults: adminCourierAccountFields,
    isList: true,
  },
  retrieve: {
    defaults: adminCourierAccountFields,
    isList: false,
  },
}
