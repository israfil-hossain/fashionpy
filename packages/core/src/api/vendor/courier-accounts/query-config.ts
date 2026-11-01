/**
 * Credentials (`data`) are deliberately never returned to the client — the
 * vendor entered them and the server needs them for booking, nothing else.
 */
export const vendorCourierAccountFields = [
  "id",
  "provider",
  "seller_id",
  "status",
  "cod_enabled",
  "created_at",
  "updated_at",
]

export const vendorCourierAccountQueryConfig = {
  list: {
    defaults: vendorCourierAccountFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorCourierAccountFields,
    isList: false,
  },
}
