/**
 * Validates a post-login redirect target: same-site relative path only
 * (starts with a single `/`, no scheme, no backslashes) so a crafted
 * `?redirect=https://evil.com` can't bounce users off-site.
 */
export function safeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return null
  }
  // Reject embedded scheme markers like `/\/evil.com` or `/https:`.
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(raw)) {
    return null
  }
  return raw
}
