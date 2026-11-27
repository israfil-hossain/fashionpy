import { randomUUID } from "node:crypto"

import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

import { getEmailSettings } from "../email/settings"
import { sendEmail } from "../email/send-email"
import { wishlistReminderHtml } from "../email/templates"
import { isOptedOut, unsubscribeUrl } from "../email/unsubscribe"

type WishlistRow = {
  id: string
  customer_id: string
  email: string
  metadata: Record<string, unknown> | null
  updated_at: string
  titles: string[] | null
  handles: string[] | null
}

const LOCK_KEY = "email:wishlist-followup"
const LOCK_SECONDS = 600
const BATCH_SIZE = 200

export default async function wishlistFollowupJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const settings = await getEmailSettings(container)
  if (!settings.enabled || !settings.wishlistReminderEnabled) return

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
    logger.info("[wishlist-followup] skipped, a run is already in progress")
    return
  }

  let sent = 0
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as {
      raw: (query: string, bindings?: unknown[]) => Promise<{ rows: WishlistRow[] }>
    }
    const cutoff = new Date(
      Date.now() - settings.wishlistReminderDays * 24 * 60 * 60 * 1000
    ).toISOString()

    const { rows } = await pg.raw(
      `select w.id, cw.customer_id, c.email, w.metadata, w.updated_at,
              array_agg(p.title order by p.title) as titles,
              array_agg(p.handle order by p.title) as handles
       from wishlist w
       join customer_customer_wishlist_wishlist cw on cw.wishlist_id = w.id
       join customer c on c.id = cw.customer_id
       join wishlist_wishlist_product_product wp on wp.wishlist_id = w.id
       join product p on p.id = wp.product_id
       where w.deleted_at is null and c.email is not null and w.updated_at < $1
       group by w.id, cw.customer_id, c.email, w.metadata, w.updated_at
       limit $2`,
      [cutoff, BATCH_SIZE]
    )

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    for (const row of rows) {
      const metadata = row.metadata ?? {}
      const lastSent = metadata.wishlist_reminder_sent_at
      if (typeof lastSent === "string") {
        const daysSince =
          (Date.now() - new Date(lastSent).getTime()) / (24 * 60 * 60 * 1000)
        if (daysSince < settings.cooldownDays) continue
      }

      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "metadata"],
        filters: { id: row.customer_id },
      })
      const customerMetadata = (customers[0] as { metadata?: Record<string, unknown> | null } | undefined)?.metadata
      if (isOptedOut(customerMetadata ?? metadata, "wishlist_reminder")) continue

      const products = (row.titles ?? []).map((title, index) => ({
        title,
        handle: row.handles?.[index] ?? "",
      }))
      if (!products.length) continue

      const result = await sendEmail({
        container,
        to: row.email,
        kind: "wishlist_reminder",
        subject: "Items are waiting on your FashionPy wishlist",
        html: wishlistReminderHtml({
          products,
          unsubscribeUrl: unsubscribeUrl({
            customerId: row.customer_id,
            kind: "wishlist_reminder",
          }),
        }),
        data: { wishlist_id: row.id },
      })

      if (result.sent) {
        sent += 1
        await pg.raw(
          `update wishlist set metadata = $1::jsonb where id = $2`,
          [JSON.stringify({ ...metadata, wishlist_reminder_sent_at: new Date().toISOString() }), row.id]
        )
      }
    }

    logger.info(`[wishlist-followup] sent ${sent} reminder(s)`)
  } catch (error) {
    logger.warn(`[wishlist-followup] failed: ${(error as Error).message}`)
  } finally {
    if (locking) {
      await locking.release(LOCK_KEY, { ownerId }).catch(() => undefined)
    }
  }
}

export const config = {
  name: "email-wishlist-followup",
  schedule: "0 10 * * *",
}
