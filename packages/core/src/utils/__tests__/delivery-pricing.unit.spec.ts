import {
  DEFAULT_DELIVERY_PRICING,
  resolveDeliveryPricingConfig,
  readDeliveryPricingOverride,
} from "@mercurjs/types"

import {
  calculateDeliveryCharge,
  calculateWeightIncrement,
  resolveDeliveryZone,
} from "../delivery-pricing"

describe("delivery pricing resolver", () => {
  const config = resolveDeliveryPricingConfig(null)

  describe("zone detection", () => {
    it.each(["Dhaka", "dhaka", " DHAKA ", "Dhaka Metro", "Dhanmondi, Dhaka"])(
      "treats %s as Dhaka",
      (city) => {
        expect(resolveDeliveryZone(city, config.dhaka_city_aliases)).toBe("dhaka")
      }
    )

    it.each(["Chattogram", "Sylhet", "", null, undefined])(
      "treats %s as outside Dhaka",
      (city) => {
        expect(resolveDeliveryZone(city, config.dhaka_city_aliases)).toBe(
          "outside_dhaka"
        )
      }
    )
  })

  describe("weight increments", () => {
    it.each([
      [0.4, 0],
      [0.5, 0],
      [0.6, 10],
      [1, 10],
      [1.01, 30],
      [2, 30],
      [2.01, 45],
      [2.9, 45],
      [3, 45],
      [3.1, 60],
    ])("adds %s increment for %skg", (weight, increment) => {
      expect(calculateWeightIncrement(weight, config)).toBe(increment)
    })

    it("defaults to 0.5kg when weight is missing", () => {
      expect(calculateWeightIncrement(null, config)).toBe(0)
    })
  })

  describe("charge calculation", () => {
    it("uses the default 60 inside Dhaka and 120 outside", () => {
      expect(calculateDeliveryCharge({ city: "Dhaka", weight_kg: 0.3 })).toMatchObject({
        amount: 60,
        base: 60,
        weight_increment: 0,
        zone: "dhaka",
      })
      expect(
        calculateDeliveryCharge({ city: "Chattogram", weight_kg: 0.3 })
      ).toMatchObject({
        amount: 120,
        base: 120,
        weight_increment: 0,
        zone: "outside_dhaka",
      })
    })

    it("adds the weight increment on top of the outside-Dhaka base", () => {
      expect(
        calculateDeliveryCharge({ city: "Chattogram", weight_kg: 1.5 })
      ).toMatchObject({ amount: 150, base: 120, weight_increment: 30 })
    })

    it("lets a seller override the zone base but keeps the weight increment", () => {
      const sellerOverride = { outside_dhaka_base: 150 }
      expect(
        calculateDeliveryCharge({
          city: "Chattogram",
          weight_kg: 1.5,
          seller_override: sellerOverride,
        })
      ).toMatchObject({ amount: 180, base: 150, weight_increment: 30 })
    })

    it("prefers a product override over the seller override", () => {
      expect(
        calculateDeliveryCharge({
          city: "Chattogram",
          weight_kg: 0.5,
          seller_override: { outside_dhaka_base: 150 },
          product_override: { outside_dhaka_base: 200 },
        })
      ).toMatchObject({ amount: 200, base: 200 })
    })
  })

  describe("metadata parsing", () => {
    it("falls back to the hardcoded defaults when metadata is empty", () => {
      expect(resolveDeliveryPricingConfig(null)).toEqual(DEFAULT_DELIVERY_PRICING)
    })

    it("reads a platform config and ignores invalid values", () => {
      const config = resolveDeliveryPricingConfig({
        delivery_pricing: {
          dhaka_base: 70,
          outside_dhaka_base: "not a number",
          extra_kg_increment: 20,
          platform_warehouse_location_id: "sloc_warehouse",
        },
      })

      expect(config.dhaka_base).toBe(70)
      expect(config.outside_dhaka_base).toBe(120)
      expect(config.extra_kg_increment).toBe(20)
      expect(config.platform_warehouse_location_id).toBe("sloc_warehouse")
    })

    it("reads seller and product override keys only", () => {
      expect(
        readDeliveryPricingOverride({
          delivery_pricing: {
            outside_dhaka_base: 150,
            warehouse_fee: 99,
            extra_kg_increment: 99,
          },
        })
      ).toEqual({ outside_dhaka_base: 150 })
    })
  })
})
