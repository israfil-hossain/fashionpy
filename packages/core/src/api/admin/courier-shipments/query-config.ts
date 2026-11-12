export const adminCourierShipmentFields = [
  "id",
  "provider",
  "consignment_id",
  "tracking_code",
  "tracking_url",
  "status",
  "order_id",
  "fulfillment_id",
  "cod_amount",
  "currency_code",
  "cod_remitted_at",
  "cod_remittance_reference",
  "created_at",
  "updated_at",
]

export const adminCourierShipmentQueryConfig = {
  list: {
    defaults: adminCourierShipmentFields,
    isList: true,
  },
  retrieve: {
    defaults: adminCourierShipmentFields,
    isList: false,
  },
}
