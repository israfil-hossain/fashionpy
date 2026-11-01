import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { HttpTypes as MercurHttpTypes } from "@mercurjs/types"

import { listSellerShippingOptionsForCartWorkflow } from "../../../workflows"
import { quoteCourierOptionRates } from "../../../utils/courier/live-rates"

export const GET = async (
    req: MedusaRequest<{}, HttpTypes.StoreGetShippingOptionList>,
    res: MedusaResponse<MercurHttpTypes.StoreSellerShippingOptionsResponse>
) => {
    const { cart_id, is_return } = req.filterableFields

    const { result: shipping_options } = await listSellerShippingOptionsForCartWorkflow(req.scope).run({
        input: {
            cart_id,
            is_return: !!is_return,
            fields: req.queryConfig.fields,
        },
    })

    // Overlay live courier rates (Pathao) onto the response. Steadfast has no
    // rate API and any failure leaves flat prices untouched — best-effort.
    const options = (shipping_options ?? []) as unknown as {
        id: string
        calculated_price?: { calculated_amount?: number }
    }[]

    let courierRates: Awaited<ReturnType<typeof quoteCourierOptionRates>> = []
    if (cart_id) {
        try {
            courierRates = await quoteCourierOptionRates(req.scope, {
                cart_id,
                option_ids: options.map((o) => o.id),
            })
        } catch {
            courierRates = []
        }
    }

    for (const rate of courierRates) {
        const option = options.find((o) => o.id === rate.option_id)
        if (option?.calculated_price) {
            option.calculated_price.calculated_amount = rate.amount
        }
    }

    res.json({ shipping_options })
}
