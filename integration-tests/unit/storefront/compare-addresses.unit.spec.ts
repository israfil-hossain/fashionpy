import compareAddresses from "../../../apps/storefront/src/lib/helpers/compare-addresses"

describe("compareAddresses", () => {
  const base = {
    first_name: "Test",
    last_name: "User",
    address_1: "Road 1",
    city: "Dhaka",
    country_code: "bd",
  }

  it("treats province, postal code and metadata as part of the address", () => {
    const extended = {
      ...base,
      province: "Dhaka",
      postal_code: "1000",
      metadata: { thana: "Dhanmondi" },
    }

    expect(compareAddresses(extended, extended)).toBe(true)
    expect(compareAddresses(extended, { ...extended, postal_code: "1200" })).toBe(
      false
    )
    expect(
      compareAddresses(extended, {
        ...extended,
        metadata: { thana: "Motijheel" },
      })
    ).toBe(false)
  })

  it("keeps legacy addresses without those fields equal", () => {
    expect(compareAddresses(base, { ...base })).toBe(true)
  })
})
