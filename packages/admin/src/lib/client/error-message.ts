/**
 * Fallback message for non-JSON error bodies. Gateway error pages are HTML
 * (Cloudflare/Express) — embedding them made admin toasts render raw markup.
 */
export function buildHttpErrorMessage(status: number, bodyText: string): string {
  if (/^\s*<(!doctype|html)/i.test(bodyText)) {
    return `Server returned an HTML error page (HTTP ${status})`
  }
  return bodyText.slice(0, 300)
}
