import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  quoteCourierOptionRates,
  CourierOptionRate,
} from "../../../utils/courier/live-rates"

export const quoteCourierRatesStepId = "quote-courier-rates-step"

/**
 * Live courier rates for the cart's shipping options. Returns [] on any
 * failure — callers keep their flat prices (best-effort, never blocks checkout).
 */
export const quoteCourierRatesStep = createStep(
  quoteCourierRatesStepId,
  async (
    input: { cart_id: string; option_ids: string[] },
    { container }
  ) => {
    let rates: CourierOptionRate[] = []
    try {
      rates = await quoteCourierOptionRates(container as any, input)
    } catch {
      rates = []
    }
    return new StepResponse(rates, rates.map((r) => r.option_id).join(","))
  }
)
