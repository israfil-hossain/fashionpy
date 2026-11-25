import { describe, expect, test } from "vitest"

import { getRemovableSellers } from "../removable-sellers"

describe("getRemovableSellers", () => {
  test("blocks sellers assigned to a single region", () => {
    const result = getRemovableSellers(
      ["sel_1", "sel_2"],
      [
        { id: "sel_1", regions: [{ id: "reg_1" }] },
        {
          id: "sel_2",
          regions: [{ id: "reg_1" }, { id: "reg_2" }],
        },
      ]
    )

    expect(result).toEqual({ removable: ["sel_2"], blocked: ["sel_1"] })
  })

  test("treats sellers without loaded region data as removable", () => {
    const result = getRemovableSellers(["sel_1", "sel_2"], [
      { id: "sel_1" },
      { id: "sel_2" },
    ])

    expect(result).toEqual({ removable: ["sel_1", "sel_2"], blocked: [] })
  })

  test("keeps selection order in both groups", () => {
    const result = getRemovableSellers(
      ["sel_1", "sel_2", "sel_3", "sel_4"],
      [
        { id: "sel_1", regions: [{ id: "reg_1" }] },
        { id: "sel_2", regions: [{ id: "reg_1" }, { id: "reg_2" }] },
        { id: "sel_3", regions: [{ id: "reg_1" }] },
        { id: "sel_4", regions: [{ id: "reg_1" }, { id: "reg_3" }] },
      ]
    )

    expect(result).toEqual({
      removable: ["sel_2", "sel_4"],
      blocked: ["sel_1", "sel_3"],
    })
  })

  test("returns empty groups for an empty selection", () => {
    expect(getRemovableSellers([], [])).toEqual({
      removable: [],
      blocked: [],
    })
  })
})
