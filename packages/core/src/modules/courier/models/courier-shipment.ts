import { model } from "@medusajs/framework/utils"

import { CourierShipmentStatus } from "@mercurjs/types"

export const CourierShipment = model.define("courier_shipment", {
  id: model.id({ prefix: "cshp" }).primaryKey(),
  provider: model.text(),
  consignment_id: model.text(),
  tracking_code: model.text().nullable(),
  tracking_url: model.text().nullable(),
  status: model
    .enum(CourierShipmentStatus)
    .default(CourierShipmentStatus.PENDING),
  /** Mercur order id — passed to the courier as invoice/merchant_order_id */
  order_id: model.text(),
  fulfillment_id: model.text(),
  cod_amount: model.bigNumber().nullable(),
  delivery_fee: model.bigNumber().nullable(),
  currency_code: model.text().nullable(),
  /**
   * When the courier remitted this shipment's COD cash to the platform.
   * Seller payouts that include the shipment wait on this.
   */
  cod_remitted_at: model.dateTime().nullable(),
  cod_remittance_reference: model.text().nullable(),
  /** Last raw payload received from the courier (create or webhook) */
  data: model.json().nullable(),
})
