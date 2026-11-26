import { describe, expect, test } from "vitest"

import { resolveOfferIdsForSelection } from "../resolve-offer-ids"

describe("resolveOfferIdsForSelection", () => {
  test("deletes every offer in a grouped row, not just the representative id", () => {
    const rows = [
      {
        id: "offer_1",
        offer_ids: ["offer_1", "offer_2", "offer_3"],
      },
    ]

    expect(resolveOfferIdsForSelection(rows, { offer_1: true })).toEqual([
      "offer_1",
      "offer_2",
      "offer_3",
    ])
  })

  test("falls back to the row id when offer_ids is missing", () => {
    expect(
      resolveOfferIdsForSelection([{ id: "offer_1" }], { offer_1: true })
    ).toEqual(["offer_1"])
  })

  test("ignores unselected rows and deduplicates shared offers", () => {
    const rows = [
      { id: "offer_1", offer_ids: ["offer_1", "offer_2"] },
      { id: "offer_3", offer_ids: ["offer_2", "offer_3"] },
    ]

    expect(
      resolveOfferIdsForSelection(rows, {
        offer_1: true,
        offer_3: true,
        offer_9: false,
      })
    ).toEqual(["offer_1", "offer_2", "offer_3"])
  })
})
