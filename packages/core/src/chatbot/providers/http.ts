/**
 * Shared HTTP plumbing for chat providers: response formatting that never
 * leaks HTML into user-visible errors, and a small retry loop for the
 * transient upstream failures free-tier gateways return (429/502/503/504).
 */

export type SleepFn = (ms: number) => Promise<void>

export const defaultSleep: SleepFn = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504])
const DEFAULT_RETRY_DELAYS_MS = [1500, 3000]
const MAX_RETRY_AFTER_MS = 5000

export class ProviderHttpError extends Error {
  status: number
  retryAfterMs?: number

  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message)
    this.name = "ProviderHttpError"
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

export function looksLikeHtml(text: string): boolean {
  return /^\s*<(!doctype|html)/i.test(text)
}

export function parseRetryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000)
  }
  const dateMs = Date.parse(header) - Date.now()
  return Number.isFinite(dateMs) && dateMs > 0 ? dateMs : undefined
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/**
 * OpenRouter-style error bodies carry the human explanation in
 * `error.metadata.raw`; fall back to `error.message` before giving up.
 */
function rateLimitDetail(bodyText: string): string | null {
  try {
    const body = JSON.parse(bodyText) as {
      error?: { message?: string; metadata?: { raw?: string } }
    }
    return body?.error?.metadata?.raw || body?.error?.message || null
  } catch {
    return null
  }
}

/**
 * Turn a provider HTTP failure into a concise, user-visible message.
 * Never embeds an HTML body (gateway error pages/challenges) — those reach
 * admin toasts and the storefront widget verbatim otherwise.
 */
export function formatProviderHttpError(
  label: string,
  status: number,
  bodyText: string
): string {
  if (looksLikeHtml(bodyText)) {
    return (
      `${label} ${status}: the gateway returned an HTML error page ` +
      `instead of JSON — it may be rate-limiting or unavailable. ` +
      `Please retry shortly.`
    )
  }
  if (status === 429) {
    const detail = rateLimitDetail(bodyText)
    if (detail) {
      return `${label} ${status}: ${truncate(detail, 240)}`
    }
    return (
      `${label} ${status}: the model's free pool is temporarily ` +
      `rate-limited upstream. Please retry shortly, switch models in ` +
      `AI Chatbot settings, or add your own provider key for dedicated limits.`
    )
  }
  return `${label} ${status}: ${truncate(bodyText, 300)}`
}

export function isRetryableProviderError(err: unknown): boolean {
  return err instanceof ProviderHttpError && RETRYABLE_STATUSES.has(err.status)
}

/**
 * Run `fn`, retrying transient provider failures with a short backoff.
 * Honours a parsed `Retry-After` (capped) over the default delays.
 */
export async function withTransientRetries<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; sleepFn?: SleepFn } = {}
): Promise<T> {
  const retries = opts.retries ?? DEFAULT_RETRY_DELAYS_MS.length
  const sleepFn = opts.sleepFn ?? defaultSleep

  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === retries || !isRetryableProviderError(err)) {
        throw err
      }
      const fallback = DEFAULT_RETRY_DELAYS_MS[attempt] ?? 3000
      const wait =
        err instanceof ProviderHttpError && err.retryAfterMs
          ? Math.min(err.retryAfterMs, MAX_RETRY_AFTER_MS)
          : fallback
      await sleepFn(wait)
    }
  }
  throw lastError
}
