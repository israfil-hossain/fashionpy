import { decryptSecret, encryptSecret } from "../../modules/chatbot/crypto"
import { CHATBOT_TOOLS, toolNames } from "../tools/definitions"
import { resolveProvider, OpenAICompatibleProvider, GeminiProvider } from "../providers"

describe("chatbot tool definitions", () => {
  test("exposes the full commerce toolset", () => {
    const names = toolNames()
    for (const expected of [
      "search_products",
      "get_product",
      "add_to_cart",
      "list_addresses",
      "set_shipping_address",
      "list_shipping_options",
      "set_shipping_method",
      "list_payment_methods",
      "set_payment_method",
      "review_order",
      "place_order",
      "list_my_orders",
      "get_order_status",
    ]) {
      expect(names).toContain(expected)
    }
  })

  test("every tool has a JSON-schema object parameters block", () => {
    for (const tool of CHATBOT_TOOLS) {
      expect(tool.type).toBe("function")
      expect(tool.function.name).toBeTruthy()
      expect(tool.function.description).toBeTruthy()
      expect(tool.function.parameters.type).toBe("object")
    }
  })

  test("place_order is documented as confirmation-gated", () => {
    const place = CHATBOT_TOOLS.find((t) => t.function.name === "place_order")!
    expect(place.function.description).toMatch(/ONLY call after/i)
    expect(place.function.description).toMatch(/explicitly confirmed/i)
  })
})

describe("provider resolution", () => {
  test("openrouter and openai_compatible use the OpenAI adapter", () => {
    expect(resolveProvider({ provider: "openrouter", api_key: "k", model: "m" })).toBeInstanceOf(
      OpenAICompatibleProvider
    )
    expect(
      resolveProvider({ provider: "openai_compatible", api_key: "k", model: "m" })
    ).toBeInstanceOf(OpenAICompatibleProvider)
  })

  test("gemini uses the Gemini adapter", () => {
    expect(resolveProvider({ provider: "gemini", api_key: "k", model: "m" })).toBeInstanceOf(
      GeminiProvider
    )
  })
})

describe("settings secret encryption", () => {
  test("round-trips an API key", () => {
    const key = "sk-or-v1-abc123"
    const encrypted = encryptSecret(key)
    expect(encrypted).not.toContain(key)
    expect(decryptSecret(encrypted)).toBe(key)
  })

  test("returns null for corrupted payloads", () => {
    expect(decryptSecret("not-a-valid-payload")).toBeNull()
    expect(decryptSecret("a.b")).toBeNull()
  })
})
