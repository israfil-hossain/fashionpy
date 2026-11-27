import {
  customizationFingerprint,
  parseProductCustomization,
  validateCustomizationValues,
} from "../../../packages/types/src/product/customization"

const config = {
  enabled: true,
  fields: [
    { key: "gift_message", label: "Gift message", type: "text" as const, required: true, max_length: 50 },
    { key: "artwork", label: "Artwork", type: "file" as const, required: true, extra_price: 50 },
  ],
}

describe("product customization", () => {
  test("parses an enabled customization config", () => {
    expect(parseProductCustomization(config)).toEqual(config)
    expect(parseProductCustomization({ enabled: false, fields: [] })).toBeNull()
  })

  test("validates required and max length fields", () => {
    expect(validateCustomizationValues(config, {})).toEqual({
      gift_message: "Gift message is required",
      artwork: "Artwork is required",
    })
    expect(
      validateCustomizationValues(config, {
        gift_message: "x".repeat(51),
        artwork: { url: "https://files/test.png" },
      })
    ).toEqual({
      gift_message: "Gift message must be 50 characters or fewer",
    })
  })

  test("fingerprints values regardless of key order", () => {
    expect(
      customizationFingerprint({ a: "one", b: { url: "file" } })
    ).toBe(customizationFingerprint({ b: { url: "file" }, a: "one" }))
    expect(customizationFingerprint({ a: "one" })).not.toBe(
      customizationFingerprint({ a: "two" })
    )
  })
})
