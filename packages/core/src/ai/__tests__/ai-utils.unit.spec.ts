import type { MedusaContainer } from "@medusajs/framework/types"
import { OpenAICompatibleProvider } from "../../chatbot/providers"
import { parseJsonResponse, AiResponseError } from "../json"
import { normalizeImages } from "../images"
import {
  checkAiRateLimit,
  enforceAiRateLimit,
  resetAiRateLimits,
  AI_RATE_LIMIT_PER_MINUTE,
} from "../rate-limit"
import { DEFAULT_AI_PRODUCT_QUOTA, readAiProductQuota } from "../quota"
import {
  sanitizeMetadata,
  sanitizeSku,
  sanitizeTagList,
  slugify,
} from "../sanitize"

describe("parseJsonResponse", () => {
  test("parses a bare JSON object", () => {
    expect(parseJsonResponse('{"title":"Shirt"}')).toEqual({ title: "Shirt" })
  })

  test("parses JSON wrapped in a markdown fence", () => {
    expect(
      parseJsonResponse('Here you go:\n```json\n{"title":"Shirt"}\n```')
    ).toEqual({ title: "Shirt" })
  })

  test("parses JSON surrounded by prose", () => {
    expect(
      parseJsonResponse('Result follows {"title":"Shirt"} — done.')
    ).toEqual({ title: "Shirt" })
  })

  test("rejects empty and non-JSON output", () => {
    expect(() => parseJsonResponse("   ")).toThrow(AiResponseError)
    expect(() => parseJsonResponse("no json here")).toThrow(AiResponseError)
  })

  test("rejects malformed JSON", () => {
    expect(() => parseJsonResponse('{"title": }')).toThrow(AiResponseError)
  })
})

describe("sanitizeTagList", () => {
  test("strips hashtags, trims and de-duplicates case-insensitively", () => {
    expect(sanitizeTagList(["#Summer", " summer ", "Denim", ""])).toEqual([
      "Summer",
      "Denim",
    ])
  })

  test("caps the list", () => {
    expect(sanitizeTagList(["a", "b", "c"], 2)).toEqual(["a", "b"])
  })
})

describe("sanitizeSku", () => {
  test("normalizes to uppercase hyphen form", () => {
    expect(sanitizeSku(" acme / summer tee 01 ")).toBe("ACME-SUMMER-TEE-01")
  })

  test("returns undefined when nothing usable is left", () => {
    expect(sanitizeSku("///")).toBeUndefined()
    expect(sanitizeSku(null)).toBeUndefined()
  })

  test("caps SKU length", () => {
    expect(sanitizeSku("A".repeat(80))).toHaveLength(48)
  })
})

describe("sanitizeMetadata", () => {
  test("drops prototype keys and non-JSON values", () => {
    const input = JSON.parse(
      '{"material":"cotton","__proto__":{"polluted":true},"nested":{"color":"blue"},"count":3,"valid":true}'
    )
    input.bad = Number.NaN
    const metadata = sanitizeMetadata(input)

    expect(metadata).toEqual({
      material: "cotton",
      nested: { color: "blue" },
      count: 3,
      valid: true,
    })
    expect({}.polluted).toBeUndefined()
  })

  test("caps entries and string length", () => {
    const metadata = sanitizeMetadata({ long: "x".repeat(900), a: 1, b: 2 }, 2)
    expect(Object.keys(metadata)).toHaveLength(2)
    expect(String(metadata.long)).toHaveLength(500)
  })
})

describe("slugify", () => {
  test("produces a kebab-case slug", () => {
    expect(slugify("  Summer T-Shirt — 2026 Edition! ")).toBe(
      "summer-t-shirt-2026-edition"
    )
  })
})

describe("normalizeImages", () => {
  test("passes base64 data URLs through without persisting them", async () => {
    const data = "data:image/png;base64,AAAA"
    await expect(normalizeImages([data])).resolves.toEqual({
      data_urls: [data],
      source_urls: [],
    })
  })

  test("rejects a non-image data URL", async () => {
    await expect(
      normalizeImages(["data:text/plain;base64,AAAA"])
    ).rejects.toThrow(/base64 image/)
  })
})

describe("readAiProductQuota", () => {
  test("defaults to the platform quota", () => {
    expect(readAiProductQuota(null)).toEqual({
      used: 0,
      quota: DEFAULT_AI_PRODUCT_QUOTA,
      remaining: DEFAULT_AI_PRODUCT_QUOTA,
    })
  })

  test("reads overrides from metadata", () => {
    expect(
      readAiProductQuota({ ai_product_quota: 50, ai_product_generations: 12 })
    ).toEqual({ used: 12, quota: 50, remaining: 38 })
  })

  test("never reports negative remaining and tolerates bad JSON", () => {
    expect(
      readAiProductQuota({ ai_product_quota: 5, ai_product_generations: 9 })
        .remaining
    ).toBe(0)
    expect(readAiProductQuota("{not json").quota).toBe(DEFAULT_AI_PRODUCT_QUOTA)
  })
})

describe("AI rate limit", () => {
  beforeEach(() => resetAiRateLimits())

  test("allows requests up to the per-minute budget", () => {
    for (let i = 0; i < AI_RATE_LIMIT_PER_MINUTE; i++) {
      expect(checkAiRateLimit("seller-1").allowed).toBe(true)
    }
    expect(checkAiRateLimit("seller-1").allowed).toBe(false)
    expect(checkAiRateLimit("seller-2").allowed).toBe(true)
  })

  test("falls back to the in-process window when Redis is unavailable", async () => {
    const container = {
      resolve: () => {
        throw new Error("no redis")
      },
    } as unknown as MedusaContainer

    for (let i = 0; i < AI_RATE_LIMIT_PER_MINUTE; i++) {
      await enforceAiRateLimit(container, "actor-1")
    }

    await expect(enforceAiRateLimit(container, "actor-1")).rejects.toThrow(
      /too quickly/
    )
  })
})

describe("provider token usage", () => {
  test("captures OpenAI-compatible usage metadata", async () => {
    const original = global.fetch
    global.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "{}" } }],
          usage: {
            prompt_tokens: 12,
            completion_tokens: 8,
            total_tokens: 20,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )) as typeof fetch

    try {
      const provider = new OpenAICompatibleProvider()
      const result = await provider.complete(
        [{ role: "user", content: "ping" }],
        [],
        { provider: "openai_compatible", api_key: "k", model: "m" }
      )

      expect(result.usage).toEqual({
        prompt_tokens: 12,
        completion_tokens: 8,
        total_tokens: 20,
      })
    } finally {
      global.fetch = original
    }
  })
})
