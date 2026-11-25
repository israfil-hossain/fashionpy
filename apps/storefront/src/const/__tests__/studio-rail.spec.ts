import { describe, expect, test } from "vitest"

import {
  getStudioRailKey,
  isStudioRailCategory,
  resolveStudioRailCategories,
  type StudioRailCategoryNode,
} from "../studio-rail"

const category = (
  overrides: Partial<StudioRailCategoryNode> & Pick<StudioRailCategoryNode, "id" | "handle" | "name">
): StudioRailCategoryNode => ({
  is_active: true,
  ...overrides,
})

describe("studio rail categories", () => {
  test("keeps the built-in tabs for legacy categories", () => {
    const resolved = resolveStudioRailCategories([
      category({ id: "cat_men", handle: "men", name: "Men" }),
    ])

    expect(resolved).toHaveLength(1)
    expect(resolved[0].tab.key).toBe("men")
  })

  test("adds a tab for a category flagged in metadata", () => {
    const panjabi = category({
      id: "cat_panjabi",
      handle: "panjabi",
      name: "Panjabi",
      metadata: { show_in_studio_rail: true },
    })
    const pants = category({
      id: "cat_formal_pant",
      handle: "formal-pant",
      name: "Formal Pant",
      metadata: { show_in_studio_rail: "true" },
    })

    const resolved = resolveStudioRailCategories([panjabi, pants])

    expect(resolved.map(entry => entry.tab.key)).toEqual([
      "category:cat_formal_pant",
      "category:cat_panjabi",
    ])
    expect(resolved.map(entry => entry.tab.label)).toEqual([
      "Formal Pant",
      "Panjabi",
    ])
  })

  test("does not duplicate a legacy category that is also flagged", () => {
    const resolved = resolveStudioRailCategories([
      category({
        id: "cat_men",
        handle: "men",
        name: "Men",
        metadata: { show_in_studio_rail: true },
      }),
    ])

    expect(resolved).toHaveLength(1)
    expect(resolved[0].tab.key).toBe("men")
  })

  test("skips inactive flagged categories", () => {
    const resolved = resolveStudioRailCategories([
      category({
        id: "cat_panjabi",
        handle: "panjabi",
        name: "Panjabi",
        is_active: false,
        metadata: { show_in_studio_rail: true },
      }),
    ])

    expect(resolved).toEqual([])
  })

  test("resolves the rail key from the category and its ancestors", () => {
    const parent = category({
      id: "cat_panjabi",
      handle: "panjabi",
      name: "Panjabi",
      metadata: { show_in_studio_rail: true },
    })
    const child = category({
      id: "cat_silver",
      handle: "silver-panjabi",
      name: "Silver Panjabi",
      parent_category_id: parent.id,
    })

    expect(isStudioRailCategory(child)).toBe(false)
    expect(getStudioRailKey(child, [parent, child])).toBe("category:cat_panjabi")
    expect(getStudioRailKey(parent, [parent, child])).toBe("category:cat_panjabi")
    expect(getStudioRailKey(category({ id: "x", handle: "shoes", name: "Shoes" }), [])).toBeNull()
  })
})
