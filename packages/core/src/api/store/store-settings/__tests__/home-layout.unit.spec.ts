import {
  DEFAULT_HOME_LAYOUT,
  HOME_SECTION_IDS,
  normalizeHomeLayout,
} from "@mercurjs/types"

describe("normalizeHomeLayout", () => {
  it("returns the default layout for null or garbage input", () => {
    expect(normalizeHomeLayout(null)).toEqual(DEFAULT_HOME_LAYOUT)
    expect(normalizeHomeLayout(undefined)).toEqual(DEFAULT_HOME_LAYOUT)
    expect(normalizeHomeLayout("nope")).toEqual(DEFAULT_HOME_LAYOUT)
    expect(normalizeHomeLayout(42)).toEqual(DEFAULT_HOME_LAYOUT)
    expect(normalizeHomeLayout({ sections: "nope" })).toEqual(
      DEFAULT_HOME_LAYOUT
    )
  })

  it("does not alias the default layout array", () => {
    const a = normalizeHomeLayout(null)
    const b = normalizeHomeLayout(null)
    expect(a).toEqual(b)
    expect(a).not.toBe(b)
    a[0].enabled = false
    expect(DEFAULT_HOME_LAYOUT[0].enabled).toBe(true)
  })

  it("applies saved order and enabled flags", () => {
    const normalized = normalizeHomeLayout({
      sections: [
        { id: "promo_banner", enabled: false },
        { id: "hero", enabled: true },
        { id: "blog", enabled: false },
      ],
    })

    expect(normalized[0]).toEqual({ id: "promo_banner", enabled: false })
    expect(normalized[1]).toEqual({ id: "hero", enabled: true })
    expect(normalized[2]).toEqual({ id: "blog", enabled: false })
    expect(normalized).toHaveLength(DEFAULT_HOME_LAYOUT.length)
  })

  it("appends sections missing from the saved config with their default flag", () => {
    const normalized = normalizeHomeLayout({
      sections: [{ id: "hero", enabled: true }],
    })

    const ids = normalized.map((section) => section.id)
    expect(ids[0]).toBe("hero")
    for (const id of HOME_SECTION_IDS) {
      expect(ids).toContain(id)
    }
    expect(ids.indexOf("blog")).toBeGreaterThan(ids.indexOf("hero"))
    expect(normalized.find((s) => s.id === "studio_rail")).toEqual({
      id: "studio_rail",
      enabled: true,
    })
  })

  it("drops unknown ids and keeps the first entry for duplicates", () => {
    const normalized = normalizeHomeLayout({
      sections: [
        { id: "removed_section", enabled: true },
        { id: "hero", enabled: false },
        { id: "hero", enabled: true },
        { id: 7, enabled: true },
        null,
        "hero",
      ],
    })

    const heroes = normalized.filter((section) => section.id === "hero")
    expect(heroes).toEqual([{ id: "hero", enabled: false }])
    expect(
      normalized.some((section) => section.id === "removed_section")
    ).toBe(false)
    expect(normalized).toHaveLength(DEFAULT_HOME_LAYOUT.length)
  })

  it("coerces missing or non-boolean enabled flags to true", () => {
    const normalized = normalizeHomeLayout({
      sections: [{ id: "hero" }, { id: "blog", enabled: "yes" }],
    })

    expect(normalized[0]).toEqual({ id: "hero", enabled: true })
    expect(normalized.find((s) => s.id === "blog")?.enabled).toBe(true)
  })

  it("accepts a bare array of sections", () => {
    const normalized = normalizeHomeLayout([
      { id: "blog", enabled: false },
    ])

    expect(normalized[0]).toEqual({ id: "blog", enabled: false })
    expect(normalized).toHaveLength(DEFAULT_HOME_LAYOUT.length)
  })
})
