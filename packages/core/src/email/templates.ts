export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const storefrontUrl = () =>
  (process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    "http://localhost:8000").replace(/\/+$/, "")

const adminUrl = () =>
  (process.env.ADMIN_URL || "http://localhost:7000").replace(/\/+$/, "")

const vendorUrl = () =>
  (process.env.VENDOR_URL || "http://localhost:7002").replace(/\/+$/, "")

const shell = (heading: string, body: string, footer = ""): string =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:40px;">
<tr><td style="font-size:20px;font-weight:600;color:#18181b;padding-bottom:12px;">${heading}</td></tr>
<tr><td style="font-size:14px;color:#52525b;line-height:1.6;">${body}</td></tr>
${footer ? `<tr><td style="font-size:12px;color:#a1a1aa;padding-top:32px;border-top:1px solid #e4e4e7;">${footer}</td></tr>` : ""}
</table></td></tr></table></body></html>`

const button = (href: string, label: string): string =>
  `<a href="${href}" style="display:inline-block;background:#b7016b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-size:14px;">${label}</a>`

const itemList = (
  items: Array<{ title: string; quantity: number }>
): string =>
  items.length
    ? `<div style="padding-top:16px;color:#18181b;"><strong>Items</strong><br/>${items
        .map(i => `${escapeHtml(i.title)} × ${i.quantity}`)
        .join("<br/>")}</div>`
    : ""

const unsubscribeFooter = (unsubscribeUrl: string): string =>
  `You are receiving this because you have a FashionPy account. <a href="${unsubscribeUrl}" style="color:#71717a;">Unsubscribe from follow-up emails</a>.`

export const orderConfirmationHtml = (input: {
  displayId: string
  total?: string | null
  items: Array<{ title: string; quantity: number }>
  orderGroupId: string
}): string =>
  shell(
    "Order confirmed",
    `Thanks for your order <strong>${escapeHtml(input.displayId)}</strong>.${
      input.total ? `<br/>Total: <strong>${escapeHtml(input.total)}</strong>` : ""
    }${itemList(input.items)}<div style="padding-top:24px;">${button(
      `${storefrontUrl()}/user/orders/${input.orderGroupId}`,
      "View your order"
    )}</div>`,
    "If you did not place this order, please contact FashionPy support."
  )

export const sellerOrderHtml = (input: {
  sellerName: string
  orderId: string
  displayId: string
  items: Array<{ title: string; quantity: number }>
  total?: string | null
}): string =>
  shell(
    "New order received",
    `Hello ${escapeHtml(input.sellerName)},<br/><br/>A new order <strong>${escapeHtml(
      input.displayId
    )}</strong> was placed for your store.${input.total ? `<br/>Total: <strong>${escapeHtml(input.total)}</strong>` : ""}${itemList(
      input.items
    )}<div style="padding-top:24px;">${button(
      `${vendorUrl()}/orders/${input.orderId}`,
      "View order"
    )}</div>`
  )

export const adminOrderHtml = (input: {
  displayId: string
  orderGroupId: string
  sellerCount: number
  total?: string | null
}): string =>
  shell(
    "New marketplace order",
    `Order <strong>${escapeHtml(input.displayId)}</strong> was placed across ${input.sellerCount} seller${
      input.sellerCount === 1 ? "" : "s"
    }.${input.total ? `<br/>Total: <strong>${escapeHtml(input.total)}</strong>` : ""}<div style="padding-top:24px;">${button(
      `${adminUrl()}/orders/${input.orderGroupId}`,
      "Open order group"
    )}</div>`
  )

export const cartReminderHtml = (input: {
  items: Array<{ title: string; quantity: number }>
  unsubscribeUrl: string
}): string =>
  shell(
    "You left something behind",
    `You still have items in your FashionPy cart:${itemList(input.items)}<div style="padding-top:24px;">${button(
      `${storefrontUrl()}/cart`,
      "Return to cart"
    )}</div>`,
    unsubscribeFooter(input.unsubscribeUrl)
  )

export const wishlistReminderHtml = (input: {
  products: Array<{ title: string; handle: string }>
  unsubscribeUrl: string
}): string =>
  shell(
    "Still on your wishlist",
    `Your FashionPy wishlist is waiting:${itemList(
      input.products.map(product => ({
        title: product.title,
        quantity: 1,
      }))
    )}<div style="padding-top:24px;">${button(
      `${storefrontUrl()}/user/wishlist`,
      "View wishlist"
    )}</div>`,
    unsubscribeFooter(input.unsubscribeUrl)
  )
