import { isWishlistedProduct } from "../../../apps/storefront/src/lib/helpers/wishlist"

describe("isWishlistedProduct", () => {
  test("finds a product in the wishlist ids", () => {
    expect(isWishlistedProduct(["prod_1", "prod_2"], "prod_2")).toBe(true)
  })

  test("returns false for missing or empty lists", () => {
    expect(isWishlistedProduct(["prod_1"], "prod_2")).toBe(false)
    expect(isWishlistedProduct([], "prod_1")).toBe(false)
  })
})
