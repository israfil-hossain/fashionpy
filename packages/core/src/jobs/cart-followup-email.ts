import { randomUUID } from "node:crypto"

import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

import { getEmailSettings } from "../email/settings"
import { cartReminderHtml } from "../email/templates"
import { isOptedOut, unsubscribeUrl } from "../email/unsubscribe"
import { sendEmail } from "../email/send-email"

type CartRow = {
  id: string
  email: string | null
  metadata: Record<string, unknown> | null
  updated_at: string
}

const LOCK_KEY = "email:cart-followup"
const LOCK_SECONDS = 600
const BATCH_SIZE = 200

export default async function cartFollowupJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const settings = await getEmailSettings(container)
  if (!settings.enabled || !settings.cartReminderEnabled) return

  let locking: { acquire: (k: string, o: object) => Promise<void>; release: (k: string, o: object) => Promise<unknown> } | null = null
  const ownerId = randomUUID()
  try {
    const lock = container.resolve(Modules.LOCKING) as unknown as {
      acquire: (k: string, o: object) => Promise<void>
      release: (k: string, o: object) => Promise<unknown>
    }
    locking = lock
    await lock.acquire(LOCK_KEY, { expire: LOCK_SECONDS, ownerId })
  } catch {
    logger.info("[cart-followup] skipped, a run is already in progress")
    return
  }

  let sent = 0
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as {
      raw: (query: string, bindings?: unknown[]) => Promise<{ rows: CartRow[] }>
    }
    const cutoff = new Date(
      Date.now() - settings.cartReminderHours * 60 * 60 * 1000
    ).toISOString()

    const { rows } = await pg.raw(
      `select c.id, coalesce(c.email, cu.email) as email, c.metadata, c.updated_at
       from cart c
       left join customer cu on cu.id = c.customer_id
       where c.deleted_at is null
         and c.completed_at is null
         and coalesce(c.email, cu.email) is not null
         and c.updated_at < $1
       limit $2`,
      [cutoff, BATCH_SIZE]
    )

    const cartService = container.resolve(Modules.CART) as {
      updateCarts: (
        id: string,
        data: Record<string, unknown>
      ) => Promise<unknown>
    }
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    for (const cart of rows) {
      const metadata = cart.metadata ?? {}
      const lastSent = metadata.cart_reminder_sent_at
      if (typeof lastSent === "string") {
        const daysSince =
          (Date.now() - new Date(lastSent).getTime()) / (24 * 60 * 60 * 1000)
        if (daysSince < settings.cooldownDays) continue
      }

      if (!cart.email) continue

      const customerId = metadata.customer_id
      const customerMetadata =
        typeof customerId === "string"
          ? (
              (
                await query.graph({
                  entity: "customer",
                  fields: ["id", "metadata"],
                  filters: { id: customerId },
                })
              ).data[0] as { metadata?: Record<string, unknown> | null } | undefined
            )?.metadata
          : undefined
      if (isOptedOut(customerMetadata ?? metadata, "cart_reminder")) continue

      const result = await sendEmail({
        container,
        to: cart.email,
        kind: "cart_reminder",
        subject: "You left something in your FashionPy cart",
        html: cartReminderHtml({
          items: [],
          unsubscribeUrl: unsubscribeUrl({
            customerId: typeof metadata.customer_id === "string" ? metadata.customer_id : cart.id,
            kind: "cart_reminder",
          }),
        }),
        data: { cart_id: cart.id },
      })

      if (result.sent) {
        sent += 1
        await cartService.updateCarts(cart.id, {
          metadata: { ...metadata, cart_reminder_sent_at: new Date().toISOString() },
        })
      }
    }

    logger.info(`[cart-followup] sent ${sent} reminder(s)`)
  } catch (error) {
    logger.warn(`[cart-followup] failed: ${(error as Error).message}`)
  } finally {
    if (locking) {
      await locking.release(LOCK_KEY, { ownerId }).catch(() => undefined)
    }
  }
}

export const config = {
  name: "email-cart-followup",
  schedule: "0 9 * * *",
}
