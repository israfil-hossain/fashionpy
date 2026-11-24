import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  MercurModules,
  resolveDeliveryPricingConfig,
} from "@mercurjs/types"

import CommissionModuleService from "../../../modules/commission/service"

export type WarehouseFeeLineInput = {
  order_items: Array<{ order_id: string; item_id: string }>
}

export const createWarehouseFeeCommissionLinesStepId =
  "create-warehouse-fee-commission-lines"

/**
 * The platform warehouse fee is charged to the seller, not the customer. It is
 * recorded as a commission line on each seller order that shipped from the
 * platform warehouse, so it comes out of that seller's payout.
 */
export const createWarehouseFeeCommissionLinesStep = createStep(
  createWarehouseFeeCommissionLinesStepId,
  async (input: WarehouseFeeLineInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["metadata"],
    })
    const config = resolveDeliveryPricingConfig(
      (stores?.[0]?.metadata ?? null) as Record<string, unknown> | null
    )

    if (!config.warehouse_fee || !input.order_items.length) {
      return new StepResponse([] as string[])
    }

    const service = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )
    const lines = await service.upsertCommissionLines(
      input.order_items.map(({ order_id, item_id }) => ({
        item_id,
        commission_rate_id: null,
        provider_id: "system",
        code: "warehouse_fee",
        rate: config.warehouse_fee,
        amount: config.warehouse_fee,
        description: "Platform warehouse fee",
        data: { order_id, warehouse_fee: config.warehouse_fee },
      }))
    )

    return new StepResponse(
      lines.map((line) => line.id),
      lines.map((line) => line.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }
    const service = container.resolve<CommissionModuleService>(
      MercurModules.COMMISSION
    )
    await service.deleteCommissionLines(createdIds)
  }
)
