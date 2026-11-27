import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type EmailKind =
  | "order_confirmation"
  | "seller_order"
  | "admin_order"
  | "cart_reminder"
  | "wishlist_reminder"
  | "chat_followup"

export type SendEmailInput = {
  container: MedusaContainer
  to: string
  subject: string
  html: string
  kind: EmailKind
  data?: Record<string, unknown>
}

export type SendEmailResult = {
  sent: boolean
  provider: "resend" | "notification" | "skipped"
  error?: string
}

export async function sendEmail({
  container,
  to,
  subject,
  html,
  kind,
  data,
}: SendEmailInput): Promise<SendEmailResult> {
  if (!to) {
    return { sent: false, provider: "skipped", error: "Missing recipient" }
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || "FashionPy <onboarding@resend.dev>"

  if (apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [to], subject, html }),
        signal: AbortSignal.timeout(15_000),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => "")
        logger.warn(`[email] ${kind} failed (${response.status}): ${text.slice(0, 200)}`)
        return { sent: false, provider: "resend", error: text.slice(0, 200) }
      }

      return { sent: true, provider: "resend" }
    } catch (error) {
      logger.warn(`[email] ${kind} error: ${(error as Error).message}`)
      return { sent: false, provider: "resend", error: (error as Error).message }
    }
  }

  try {
    const notification = container.resolve("notification") as unknown as {
      createNotifications: (input: Record<string, unknown>) => Promise<unknown>
    }
    await notification.createNotifications({
      to,
      channel: "email",
      template: kind,
      data: data ?? {},
      content: { subject, html },
    })
    return { sent: true, provider: "notification" }
  } catch (error) {
    logger.warn(`[email] ${kind} skipped: ${(error as Error).message}`)
    return { sent: false, provider: "skipped", error: (error as Error).message }
  }
}
