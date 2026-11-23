const BLOCKED_METADATA_KEYS = new Set(["__proto__", "constructor", "prototype"])
const MAX_DEPTH = 2

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (typeof value === "string") {
    return value.slice(0, 500)
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === "boolean") {
    return value
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => sanitizeValue(item, depth))
      .filter((item) => item !== undefined)
  }
  if (isPlainObject(value)) {
    return depth >= MAX_DEPTH ? undefined : sanitizeMetadata(value, 20, depth + 1)
  }
  return undefined
}

/**
 * Constrain model-authored metadata to a small, JSON-safe shape. Prototype
 * keys are dropped and nesting/entries are capped so a bad completion cannot
 * bloat the product row.
 */
export function sanitizeMetadata(
  input: unknown,
  maxEntries = 30,
  depth = 0
): Record<string, unknown> {
  if (!isPlainObject(input)) {
    return {}
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input).slice(0, maxEntries)) {
    if (BLOCKED_METADATA_KEYS.has(key) || !key || key.length > 64) {
      continue
    }
    const sanitized = sanitizeValue(value, depth)
    if (sanitized !== undefined) {
      result[key] = sanitized
    }
  }
  return result
}

export function sanitizeTagList(
  tags: string[] | undefined,
  max = 20
): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of tags ?? []) {
    const tag = raw.replace(/^#+/, "").trim().slice(0, 80)
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(tag)
    if (result.length >= max) break
  }

  return result
}

export function sanitizeSku(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const sku = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
  return sku || undefined
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
}
