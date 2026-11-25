import medusaError from "../../../apps/storefront/src/lib/helpers/medusa-error"

const errorFor = (data: unknown) => ({
  config: { url: "carts/cart_123/line-items", baseURL: "https://api.test" },
  response: { data, status: 400, headers: {} },
})

describe("medusaError", () => {
  test("uses a string message from the response", () => {
    let thrown: Error | null = null
    try {
      medusaError(errorFor({ message: "out of stock" }))
    } catch (error) {
      thrown = error as Error
    }
    expect(thrown?.message).toBe("Out of stock.")
  })

  test("handles a plain string body", () => {
    expect(() => medusaError(errorFor("bad request"))).toThrow("Bad request.")
  })

  test("falls back when the message is not a string", () => {
    expect(() => medusaError(errorFor({ message: { code: 400 } }))).toThrow(
      "The request could not be completed."
    )
  })

  test("handles nested message objects", () => {
    expect(() =>
      medusaError(errorFor({ message: { message: "offer unavailable" } }))
    ).toThrow("Offer unavailable.")
  })
})
