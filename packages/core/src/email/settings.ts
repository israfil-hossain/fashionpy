import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"

export type EmailSettings = {
  enabled: boolean
  adminOrderEmail: boolean
  sellerOrderEmail: boolean
  cartReminderEnabled: boolean
  cartReminderHours: number
  wishlistReminderEnabled: boolean
  wishlistReminderDays: number
  cooldownDays: number
}

const defaults: EmailSettings = {
  enabled: true,
  adminOrderEmail: true,
  sellerOrderEmail: true,
  cartReminderEnabled: true,
  cartReminderHours: 24,
  wishlistReminderEnabled: true,
  wishlistReminderDays: 7,
  cooldownDays: 7,
}

export const getEmailSettings = async (
  container: MedusaContainer
): Promise<EmailSettings> => {
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "store",
      fields: ["id", "metadata"],
    })
    const stored = data[0]?.metadata?.email_notifications
    if (!stored || typeof stored !== "object") return defaults
    return { ...defaults, ...(stored as Partial<EmailSettings>) }
  } catch {
    return defaults
  }
}
