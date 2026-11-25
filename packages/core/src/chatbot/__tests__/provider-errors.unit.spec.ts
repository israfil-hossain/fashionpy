/**
 * Provider HTTP failures: HTML gateway pages must never leak into
 * user-visible errors, 429s surface the upstream detail, and transient
 * statuses are retried with a short backoff.
 */
import { MedusaError } from "@medusajs/framework/utils"

import { OpenAICompatibleProvider } from "../providers/openai-compatible"
import {
  ProviderHttpError,
  formatProviderHttpError,
  isRetryableProviderError,
  looksLikeHtml,
  parseRetryAfterMs,
  toMedusaProviderError,
  withTransientRetries,
} from "../providers/http"

const CONFIG = {
  provider: "openrouter" as const,
  api_key: "test-key",
  model: "some/model:free",
}

const RATE_LIMIT_BODY = JSON.stringify({
  error: {
    message: "Provider returned error",
    code: 429,
    metadata: {
      raw: "some/model:free is temporarily rate-limited upstream. Please retry shortly, or add your own provider key to use your own limits.",
    },
  },
})

const HTML_BODY =
  '<!DOCTYPE html><!--[if lt IE 7]><html class="no-js ie6 oldie" lang="en-US">'

const okBody = JSON.stringify({
  choices: [{ message: { content: "hello" } }],
})

describe("formatProviderHttpError", () => {
  test("never embeds an HTML gateway page", () => {
    const msg = formatProviderHttpError("Chat provider", 502, HTML_BODY)
    expect(looksLikeHtml(HTML_BODY)).toBe(true)
    expect(msg).not.toContain("<!DOCTYPE")
    expect(msg).not.toContain("<html")
    expect(msg).toMatch(/HTML error page/)
    expect(msg).toContain("502")
  })

  test("429 surfaces the upstream rate-limit detail, not the JSON blob", () => {
    const msg = formatProviderHttpError("Chat provider", 429, RATE_LIMIT_BODY)
    expect(msg).toContain("429")
    expect(msg).toContain("temporarily rate-limited upstream")
    expect(msg).toContain("retry shortly")
    expect(msg).not.toContain('{"error"')
  })

  test("429 without a parseable body falls back to an actionable message", () => {
    const msg = formatProviderHttpError("Chat provider", 429, "slow down")
    expect(msg).toContain("429")
    expect(msg).toMatch(/rate-limit/i)
    expect(msg).toMatch(/AI Chatbot settings|provider key/i)
  })

  test("other statuses keep a truncated plain-text snippet", () => {
    const msg = formatProviderHttpError("Chat provider", 400, "x".repeat(500))
    expect(msg).toContain("400")
    expect(msg.length).toBeLessThan(360)
  })
})

describe("retry policy", () => {
  test("429/502/503/504 are retryable, 400 is not", () => {
    expect(isRetryableProviderError(new ProviderHttpError("x", 429))).toBe(true)
    expect(isRetryableProviderError(new ProviderHttpError("x", 503))).toBe(true)
    expect(isRetryableProviderError(new ProviderHttpError("x", 400))).toBe(false)
    expect(isRetryableProviderError(new Error("plain"))).toBe(false)
  })

  test("parseRetryAfterMs reads seconds and ignores garbage", () => {
    expect(parseRetryAfterMs("2")).toBe(2000)
    expect(parseRetryAfterMs(null)).toBeUndefined()
    expect(parseRetryAfterMs("not-a-number")).toBeUndefined()
  })

  test("withTransientRetries retries then succeeds", async () => {
    const sleeps: number[] = []
    const sleepFn = async (ms: number) => {
      sleeps.push(ms)
    }
    let calls = 0
    const fn = async () => {
      calls++
      if (calls < 3) throw new ProviderHttpError("rate limited", 429)
      return "ok"
    }

    await expect(withTransientRetries(fn, { sleepFn })).resolves.toBe("ok")
    expect(calls).toBe(3)
    expect(sleeps).toEqual([1500, 3000])
  })

  test("withTransientRetries honours Retry-After (capped at 5s)", async () => {
    const sleeps: number[] = []
    const sleepFn = async (ms: number) => {
      sleeps.push(ms)
    }
    let calls = 0
    const fn = async () => {
      calls++
      if (calls === 1) throw new ProviderHttpError("x", 429, 60_000)
      return "ok"
    }

    await expect(withTransientRetries(fn, { sleepFn })).resolves.toBe("ok")
    expect(sleeps).toEqual([5000])
  })

  test("withTransientRetries gives up after the budget", async () => {
    const sleepFn = async () => {}
    let calls = 0
    const fn = async () => {
      calls++
      throw new ProviderHttpError("still limited", 429)
    }

    await expect(withTransientRetries(fn, { sleepFn })).rejects.toThrow(
      "still limited"
    )
    expect(calls).toBe(3)
  })

  test("withTransientRetries does not retry non-transient errors", async () => {
    let slept = false
    const sleepFn = async () => {
      slept = true
    }
    let calls = 0
    const fn = async () => {
      calls++
      throw new ProviderHttpError("bad request", 400)
    }

    await expect(withTransientRetries(fn, { sleepFn })).rejects.toThrow(
      "bad request"
    )
    expect(calls).toBe(1)
    expect(slept).toBe(false)
  })
})

describe("OpenAICompatibleProvider", () => {
  const noSleep = async () => {}

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test("retries a 429 and returns the eventual completion", async () => {
    let calls = 0
    global.fetch = (async () => {
      calls++
      if (calls === 1) {
        return new Response(RATE_LIMIT_BODY, {
          status: 429,
          headers: { "Content-Type": "application/json" },
        })
      }
      return new Response(okBody, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }) as typeof fetch

    const provider = new OpenAICompatibleProvider(noSleep)
    const result = await provider.complete(
      [{ role: "user", content: "hi" }],
      [],
      CONFIG
    )

    expect(result.content).toBe("hello")
    expect(calls).toBe(2)
  })

  test("an HTML body with 200 status becomes a clean error", async () => {
    let calls = 0
    global.fetch = (async () => {
      calls++
      return new Response(HTML_BODY, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    }) as typeof fetch

    const provider = new OpenAICompatibleProvider(noSleep)
    const err = await provider
      .complete([{ role: "user", content: "hi" }], [], CONFIG)
      .catch((e: Error) => e)

    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).not.toContain("<!DOCTYPE")
    expect((err as Error).message).toMatch(/HTML error page|non-JSON/i)
    // A malformed success body is not transient — no retries.
    expect(calls).toBe(1)
  })

  test("exhausted 429s throw a friendly message without the JSON blob", async () => {
    let calls = 0
    global.fetch = (async () => {
      calls++
      return new Response(RATE_LIMIT_BODY, {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "0" },
      })
    }) as typeof fetch

    const provider = new OpenAICompatibleProvider(noSleep)
    const err = await provider
      .complete([{ role: "user", content: "hi" }], [], CONFIG)
      .catch((e: Error) => e)

    expect((err as Error).message).toContain("temporarily rate-limited upstream")
    expect((err as Error).message).not.toContain('{"error"')
    expect(calls).toBe(3)
  })

  test("provider HTTP errors keep their message when mapped for Medusa", () => {
    const limited = toMedusaProviderError(
      new ProviderHttpError("Chat provider 429: slow down", 429)
    )

    expect(limited).toBeInstanceOf(MedusaError)
    expect((limited as MedusaError).type).toBe(MedusaError.Types.NOT_ALLOWED)
    expect((limited as MedusaError).message).toContain("Chat provider 429")

    const failed = toMedusaProviderError(
      new ProviderHttpError("Chat provider 502: gateway down", 502)
    )
    expect((failed as MedusaError).type).toBe(
      MedusaError.Types.UNEXPECTED_STATE
    )
    expect((failed as MedusaError).message).toContain("gateway down")
  })

  test("non-provider errors are left untouched", () => {
    const err = new Error("unrelated")
    expect(toMedusaProviderError(err)).toBe(err)
  })

  test("test() passes a bounded timeout and does not retry timeouts", async () => {
    const timeoutSpy = jest.spyOn(AbortSignal, "timeout")
    let calls = 0
    global.fetch = (async () => {
      calls++
      throw Object.assign(new Error("The operation timed out."), {
        name: "TimeoutError",
      })
    }) as typeof fetch

    const provider = new OpenAICompatibleProvider(noSleep)
    const result = await provider.test(CONFIG)

    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
    expect(timeoutSpy).toHaveBeenCalledWith(15_000)
    // Timeouts are not transient HTTP failures — a single attempt.
    expect(calls).toBe(1)
  })
})
