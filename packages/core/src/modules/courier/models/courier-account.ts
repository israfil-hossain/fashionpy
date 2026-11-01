import { model } from "@medusajs/framework/utils"

import { CourierAccountStatus } from "@mercurjs/types"

export const CourierAccount = model.define("courier_account", {
  id: model.id({ prefix: "cacc" }).primaryKey(),
  provider: model.text(),
  /**
   * Owner of the credentials. NULL marks the platform-level account used for
   * COD bookings (credentials come from module options, not this row).
   */
  seller_id: model.text().nullable(),
  status: model.enum(CourierAccountStatus).default(
    CourierAccountStatus.PENDING
  ),
  cod_enabled: model.boolean().default(true),
  data: model.json().default({}),
})
