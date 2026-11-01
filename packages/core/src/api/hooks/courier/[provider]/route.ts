import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { CourierEvents, MercurModules } from "@mercurjs/types"

import type CourierModuleService from "../../../../modules/courier/services/courier-module-service"

const SUPPORTED_PROVIDERS = new Set(["pathao", "steadfast", "system"])

/**
 * POST /hooks/courier/:provider — public courier status webhook.
 *
 * Parsed and authenticated SYNCHRONOUSLY (Steadfast's Bearer token / HMAC
 * live in the provider) so bad credentials are rejected with 401 — Steadfast
 * never retries 4xx, which keeps a misconfigured endpoint from retrying
 * forever. Accepted events are emitted for async processing (status →
 * shipment → mark-as-delivered → money release).
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const provider = String(req.params.provider ?? "").toLowerCase()

  if (!SUPPORTED_PROVIDERS.has(provider)) {
    res.status(404).json({ message: `Unknown courier provider "${provider}"` })
    return
  }

  try {
    const courierService = req.scope.resolve<CourierModuleService>(
      MercurModules.COURIER
    )

    // Throws on auth/signature failure → caught below → 401
    const event = await courierService.getWebhookEvent(provider, {
      data: (req.body ?? {}) as Record<string, unknown>,
      rawData: req.rawBody ?? JSON.stringify(req.body ?? {}),
      headers: req.headers as Record<string, string>,
    })

    if (event.action !== "status.changed") {
      // Acknowledge anything we don't act on (tracking updates, unknown
      // statuses) — the courier expects a 2xx either way.
      res.sendStatus(200)
      return
    }

    const eventBus = req.scope.resolve(Modules.EVENT_BUS)
    await eventBus.emit(
      {
        name: CourierEvents.WebhookReceived,
        data: { provider, event },
      },
      {
        delay: 1000,
        attempts: 3,
      }
    )
  } catch (err: any) {
    const status = err?.status ?? err?.statusCode
    if (status === 401 || /token|signature|authorization|configured/i.test(err?.message ?? "")) {
      res.status(401).json({ message: err.message })
      return
    }
    res.status(400).json({ message: err?.message ?? "Webhook Error" })
    return
  }

  res.sendStatus(200)
}
