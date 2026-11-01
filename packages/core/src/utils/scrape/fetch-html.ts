import { isIP } from "net"
import { lookup } from "dns/promises"

const FETCH_TIMEOUT_MS = 10_000
const MAX_HTML_BYTES = 5 * 1024 * 1024
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

export class ScrapeError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
  }
}

const PRIVATE_V4_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
]

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".")
  if (parts.length !== 4) return null
  let result = 0
  for (const part of parts) {
    const n = Number(part)
    if (!Number.isInteger(n) || n < 0 || n > 255) return null
    result = (result << 8) | n
  }
  return result >>> 0
}

function isPrivateIPv4(ip: string): boolean {
  const value = ipv4ToInt(ip)
  if (value === null) return true
  for (const [range, bits] of PRIVATE_V4_RANGES) {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
    if ((value & mask) === (ipv4ToInt(range)! & mask)) {
      return true
    }
  }
  return false
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  if (normalized === "::1" || normalized === "::") return true
  if (normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true
  }
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length)
    if (isIP(mapped) === 4) {
      return isPrivateIPv4(mapped)
    }
  }
  return false
}

function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) return isPrivateIPv4(ip)
  if (version === 6) return isPrivateIPv6(ip)
  return true
}

export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new ScrapeError("Invalid URL")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ScrapeError("Only http(s) URLs are supported")
  }

  const hostname = url.hostname
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new ScrapeError("URLs resolving to local addresses are not allowed")
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new ScrapeError("URLs resolving to local addresses are not allowed")
    }
    return url
  }

  let addresses
  try {
    addresses = await lookup(hostname, { all: true })
  } catch {
    throw new ScrapeError(`Could not resolve host ${hostname}`, 502)
  }

  if (!addresses.length) {
    throw new ScrapeError(`Could not resolve host ${hostname}`, 502)
  }

  for (const { address } of addresses) {
    if (isPrivateAddress(address)) {
      throw new ScrapeError("URLs resolving to local addresses are not allowed")
    }
  }

  return url
}

export async function fetchHtml(rawUrl: string): Promise<string> {
  const url = await assertSafeUrl(rawUrl)

  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
    },
  }).catch((error) => {
    if (error instanceof ScrapeError) throw error
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new ScrapeError("The page took too long to respond", 504)
    }
    throw new ScrapeError(`Could not fetch the page: ${error?.message ?? error}`, 502)
  })

  if (!response.ok) {
    throw new ScrapeError(
      `The page responded with status ${response.status}`,
      response.status >= 500 ? 502 : 400
    )
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0)
  if (contentLength > MAX_HTML_BYTES) {
    throw new ScrapeError("The page is too large to scrape")
  }

  const text = await response.text()
  if (text.length > MAX_HTML_BYTES) {
    throw new ScrapeError("The page is too large to scrape")
  }

  return text
}
