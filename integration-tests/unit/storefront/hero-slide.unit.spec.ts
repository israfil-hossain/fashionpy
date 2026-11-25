import { hasHeroText } from "../../../apps/storefront/src/lib/helpers/hero-slide"

describe("hasHeroText", () => {
  test("is false when no text is configured", () => {
    expect(hasHeroText({ title: null, subtitle: "", description: null })).toBe(
      false
    )
  })

  test("is true when any text is configured", () => {
    expect(hasHeroText({ title: "Summer Sale" })).toBe(true)
    expect(hasHeroText({ subtitle: "Up to 50% off" })).toBe(true)
    expect(hasHeroText({ description: "Shop the new collection" })).toBe(true)
  })
})
