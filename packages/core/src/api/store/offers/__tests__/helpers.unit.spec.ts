import { resolveSalesChannelIdsForInventory } from "../helpers"

describe("resolveSalesChannelIdsForInventory", () => {
  test("uses the publishable key channel when it is unambiguous", () => {
    expect(
      resolveSalesChannelIdsForInventory(["sc_requested"], ["sc_key"])
    ).toEqual(["sc_key"])
  })

  test("uses an explicit request channel when the key has none", () => {
    expect(resolveSalesChannelIdsForInventory(["sc_requested"], [])).toEqual([
      "sc_requested",
    ])
  })

  test("includes every channel on a multi-channel publishable key", () => {
    expect(
      resolveSalesChannelIdsForInventory(
        [],
        ["sc_store", "sc_vendor", "sc_store"]
      )
    ).toEqual(["sc_store", "sc_vendor"])
  })

  test("rejects a context with no sales channel", () => {
    expect(() => resolveSalesChannelIdsForInventory([], [])).toThrow(
      /Inventory availability cannot be calculated/
    )
  })
})
