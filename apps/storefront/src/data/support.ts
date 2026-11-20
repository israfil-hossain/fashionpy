/**
 * Support WhatsApp number — single source of truth shared by the footer
 * social link and the chatbot login gate (SPEC-011).
 */
export const SUPPORT_WHATSAPP = "8801805101868"

/** `wa.me` deep link with a prefilled message. */
export function whatsappHref(message: string): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`
}
