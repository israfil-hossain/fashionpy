import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "@medusajs/medusa/api/utils/validators"
import { AdditionalData } from "@medusajs/framework/types"

export type VendorGetOrderParamsType = z.infer<typeof VendorGetOrderParams>
export const VendorGetOrderParams = createSelectParams()

export type VendorGetOrdersParamsType = z.infer<typeof VendorGetOrdersParams>
export const VendorGetOrdersParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    customer_id: z.union([z.string(), z.array(z.string())]).optional(),
    sales_channel_id: z.union([z.string(), z.array(z.string())]).optional(),
    region_id: z.union([z.string(), z.array(z.string())]).optional(),
    currency_code: z.union([z.string(), z.array(z.string())]).optional(),
    fulfillment_status: z.string().optional(),
    payment_status: z.string().optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)

export type VendorGetOrderChangesParamsType = z.infer<
  typeof VendorGetOrderChangesParams
>
export const VendorGetOrderChangesParams = createSelectParams()

const CreateFulfillment = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().int().min(0),
    })
  ),
  requires_shipping: z.boolean(),
  location_id: z.string(),
})

export type VendorCreateFulfillmentType = z.infer<typeof CreateFulfillment> &
  AdditionalData
export const VendorCreateFulfillment = WithAdditionalData(CreateFulfillment)

const CancelFulfillment = z
  .object({
    no_notification: z.boolean().optional(),
  })
  .strict()

export type VendorCancelFulfillmentType = z.infer<typeof CancelFulfillment> &
  AdditionalData
export const VendorCancelFulfillment = WithAdditionalData(CancelFulfillment)

export type VendorCreateShipmentType = z.infer<typeof VendorCreateShipment>
export const VendorCreateShipment = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
    })
  ),
  labels: z
    .array(
      z.object({
        tracking_number: z.string(),
        tracking_url: z.string(),
        label_url: z.string(),
      })
    )
    .optional(),
})

export type VendorBookCourierShipmentType = z.infer<
  typeof VendorBookCourierShipment
>
export const VendorBookCourierShipment = z
  .object({
    provider: z.enum(["pathao", "steadfast", "system"]),
    /**
     * Explicit cash amount to collect. Ignored when `use_cod` is true —
     * then the full order total is collected (booked on the platform account).
     */
    cod_amount: z.number().min(0).optional(),
    use_cod: z.boolean().optional(),
    delivery_type: z.enum(["normal", "on_demand", "point"]).optional(),
    special_instruction: z.string().max(480).optional(),
    item_description: z.string().max(255).optional(),
    /** Override the auto-computed weight (kg) */
    weight: z.number().min(0).max(50).optional(),
  })
  .strict()
