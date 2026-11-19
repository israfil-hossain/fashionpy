import {
  RATE_LIMIT_MESSAGE,
  checkChatbotRateLimit,
  resetChatbotRateLimits,
} from "../rate-limit"

/**
 * Pure sliding-window logic mirrors the Redis Lua INCR used by
 * MessagingRedisModuleService.checkRateLimit — these tests pin the policy
 * without a Redis connection.
 */
describe("chatbot rate limit policy", () => {
  beforeEach(() => {
    resetChatbotRateLimits()
  })

  test("allows up to 20 messages in a minute", () => {
    const now = 1_000_000
    for (let i = 1; i <= 20; i++) {
      const result = checkChatbotRateLimit("customer_a", now + i)
      expect(result.allowed).toBe(true)
      expect(result.count).toBe(i)
    }
  })

  test("rejects the 21st message in the same window", () => {
    const now = 2_000_000
    for (let i = 1; i <= 20; i++) {
      checkChatbotRateLimit("customer_b", now + i)
    }
    const blocked = checkChatbotRateLimit("customer_b", now + 21)
    expect(blocked.allowed).toBe(false)
    expect(RATE_LIMIT_MESSAGE).toMatch(/too quickly/i)
  })

  test("windows reset after 60s", () => {
    const now = 3_000_000
    for (let i = 1; i <= 20; i++) {
      checkChatbotRateLimit("customer_c", now + i)
    }
    expect(checkChatbotRateLimit("customer_c", now + 21).allowed).toBe(false)
    // Window opened at first hit (now+1) and expires 60_000ms later
    expect(checkChatbotRateLimit("customer_c", now + 1 + 60_000).allowed).toBe(
      true
    )
  })

  test("limits are isolated per actor", () => {
    const now = 4_000_000
    for (let i = 1; i <= 20; i++) {
      checkChatbotRateLimit("actor_1", now + i)
    }
    expect(checkChatbotRateLimit("actor_1", now + 21).allowed).toBe(false)
    expect(checkChatbotRateLimit("actor_2", now + 21).allowed).toBe(true)
  })
})
