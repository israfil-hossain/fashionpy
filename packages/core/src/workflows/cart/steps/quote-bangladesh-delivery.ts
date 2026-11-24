import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  quoteBangladeshDelivery,
  type DeliveryQuote,
} from "../../../utils/delivery-groups"

export type QuoteBangladeshDeliveryStepInput = {
  cart_id: string
  option_ids: string[]
}

export const quoteBangladeshDeliveryStep = createStep(
  "quote-bangladesh-delivery",
  async (input: QuoteBangladeshDeliveryStepInput, { container }) => {
    try {
      const quote = await quoteBangladeshDelivery(container, input)
      return new StepResponse(quote as DeliveryQuote | null)
    } catch {
      return new StepResponse(null)
    }
  }
)
