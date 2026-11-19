import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Order confirmation email via Resend when RESEND_API_KEY is set.
 * Falls back to Medusa's notification module (local provider logs only)
 * when Resend is not configured — never hard-fails checkout.
 */
export async function sendOrderConfirmationEmail(
  container: MedusaContainer,
  input: {
    email: string
    order_group_id: string
    display_id?: number | null
    total?: number | null
    currency_code?: string | null
    items?: Array<{ title: string; quantity: number }>
  }
): Promise<{ sent: boolean; provider: "resend" | "notification" | "skipped"; error?: string }> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM_EMAIL || "Mercur <onboarding@resend.dev>"
  const baseUrl =
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    "http://localhost:8000"

  const orderUrl = `${baseUrl.replace(/\/+$/, "")}/user/orders/${input.order_group_id}`
  const display = input.display_id ? `#${input.display_id}` : input.order_group_id
  const total =
    input.total != null
      ? `${(input.total / 100).toFixed(2)} ${(input.currency_code ?? "usd").toUpperCase()}`
      : null
  const itemsHtml = (input.items ?? [])
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#3f3f46;">${escapeHtml(i.title)} × ${i.quantity}</td></tr>`
    )
    .join("")

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px;">
        <tr><td style="font-size:20px;font-weight:600;color:#18181b;padding-bottom:12px;">Order confirmed</td></tr>
        <tr><td style="font-size:14px;color:#52525b;line-height:1.6;">
          Thanks for your order <strong>${escapeHtml(display)}</strong>.
          ${total ? `<br/>Total: <strong>${escapeHtml(total)}</strong>` : ""}
        </td></tr>
        ${itemsHtml ? `<tr><td style="padding-top:16px;font-size:14px;color:#18181b;"><strong>Items</strong><br/>${itemsHtml}</td></tr>` : ""}
        <tr><td style="padding:24px 0 0;">
          <a href="${orderUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-size:14px;">View your order</a>
        </td></tr>
        <tr><td style="font-size:12px;color:#a1a1aa;padding-top:32px;border-top:1px solid #e4e4e7;margin-top:32px;">
          If you did not place this order, please contact marketplace support.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.email],
          subject: `Order confirmed ${display}`,
          html,
        }),
        signal: AbortSignal.timeout(15_000),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        logger.warn(`Order confirmation email failed (${res.status}): ${text.slice(0, 200)}`)
        return { sent: false, provider: "resend", error: text.slice(0, 200) }
      }
      return { sent: true, provider: "resend" }
    } catch (err) {
      logger.warn(`Order confirmation email error: ${(err as Error).message}`)
      return { sent: false, provider: "resend", error: (err as Error).message }
    }
  }

  // No Resend key — hand to Medusa notification (local provider logs it).
  try {
    const notification = container.resolve("notification") as unknown as {
      createNotifications: (data: Record<string, unknown>) => Promise<unknown>
    }
    await notification.createNotifications({
      to: input.email,
      channel: "email",
      template: "order-confirmation",
      data: {
        display_id: input.display_id,
        order_group_id: input.order_group_id,
        total,
        order_url: orderUrl,
      },
      content: {
        subject: `Order confirmed ${display}`,
        html,
      },
    })
    return { sent: true, provider: "notification" }
  } catch (err) {
    return {
      sent: false,
      provider: "skipped",
      error: (err as Error).message,
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
