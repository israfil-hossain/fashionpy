import { assertSafeUrl, ScrapeError } from "../utils/scrape/fetch-html"

export const MAX_AI_IMAGES = 5
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const FETCH_TIMEOUT_MS = 10_000

export type NormalizedImages = {
  /** `data:` URLs handed to the vision model. */
  data_urls: string[]
  /** The original http(s) URLs, safe to persist on the product. */
  source_urls: string[]
}

async function toDataUrl(raw: string): Promise<string> {
  if (raw.startsWith("data:")) {
    if (!/^data:image\/[^;,]+;base64,/.test(raw)) {
      throw new ScrapeError("Only base64 image data URLs are supported")
    }
    return raw
  }

  const url = await assertSafeUrl(raw)
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: "image/*" },
  }).catch((error) => {
    if (error instanceof ScrapeError) throw error
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new ScrapeError("The image took too long to download", 504)
    }
    throw new ScrapeError(`Could not download the image: ${error?.message ?? error}`, 502)
  })

  if (!response.ok) {
    throw new ScrapeError(`The image responded with status ${response.status}`, 400)
  }

  const mime = (response.headers.get("content-type") ?? "").split(";")[0]
  if (!mime.startsWith("image/")) {
    throw new ScrapeError("The provided URL does not point to an image")
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ScrapeError("The image is too large")
  }

  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`
}

/**
 * Turn a mixed list of http(s) and data URLs into vision-ready data URLs while
 * keeping the original http(s) URLs for persistence. Bad inputs are skipped so
 * one broken gallery image does not fail the whole generation.
 */
export async function normalizeImages(urls: string[]): Promise<NormalizedImages> {
  const unique: string[] = []
  for (const raw of urls) {
    const url = raw.trim()
    if (url && !unique.includes(url)) {
      unique.push(url)
    }
  }

  const selected = unique.slice(0, MAX_AI_IMAGES)
  const data_urls: string[] = []
  const source_urls: string[] = []
  let firstError: unknown
  let failures = 0

  for (const url of selected) {
    try {
      data_urls.push(await toDataUrl(url))
      if (!url.startsWith("data:")) {
        source_urls.push(url)
      }
    } catch (error) {
      failures += 1
      firstError ??= error
    }
  }

  if (selected.length > 0 && failures === selected.length) {
    throw firstError instanceof Error
      ? firstError
      : new ScrapeError("Could not read the provided images")
  }

  return { data_urls, source_urls }
}
