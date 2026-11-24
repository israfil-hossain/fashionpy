import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { HttpTypes as MercurHttpTypes } from "@mercurjs/types"

import { listSellerShippingOptionsForCartWorkflow } from "../../../workflows"
import { quoteCourierOptionRates } from "../../../utils/courier/live-rates"
import { quoteBangladeshDelivery } from "../../../utils/delivery-groups"

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

    const options = Object.values(shipping_options ?? {})
        .flat() as unknown as {
            id: string
            amount?: number
            calculated_price?: { calculated_amount?: number }
        }[]

    let deliveryQuote: Awaited<ReturnType<typeof quoteBangladeshDelivery>> = null
    if (cart_id) {
        try {
            deliveryQuote = await quoteBangladeshDelivery(req.scope, {
                cart_id,
                option_ids: options.map((o) => o.id),
            })
        } catch {
            deliveryQuote = null
        }
    }

    if (deliveryQuote) {
        for (const option of options) {
            const amount = deliveryQuote.amountByOption[option.id]
            if (typeof amount === "number") {
                option.amount = amount
                if (option.calculated_price) {
                    option.calculated_price.calculated_amount = amount
                }
            }
        }
    } else {
        // Overlay live courier rates (Pathao) onto the response. Steadfast has no
        // rate API and any failure leaves flat prices untouched — best-effort.
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
    }

    res.json({ shipping_options })
}
