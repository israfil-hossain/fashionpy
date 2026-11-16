import {
  getCollectionRank,
  isRankOrder,
  listCollectionsByRank,
} from "../collection-rank"

describe("getCollectionRank", () => {
  it("reads numeric ranks", () => {
    expect(getCollectionRank({ rank: 0 })).toEqual(0)
    expect(getCollectionRank({ rank: 4 })).toEqual(4)
  })

  it("coerces numeric strings written through the metadata form", () => {
    expect(getCollectionRank({ rank: "3" })).toEqual(3)
    expect(getCollectionRank({ rank: "  7 " })).toEqual(7)
  })

  it("returns null for missing or invalid ranks", () => {
    expect(getCollectionRank(null)).toBeNull()
    expect(getCollectionRank(undefined)).toBeNull()
    expect(getCollectionRank({})).toBeNull()
    expect(getCollectionRank({ rank: null })).toBeNull()
    expect(getCollectionRank({ rank: "first" })).toBeNull()
    expect(getCollectionRank({ rank: Number.NaN })).toBeNull()
  })
})

describe("isRankOrder", () => {
  it("detects rank orders in both directions", () => {
    expect(isRankOrder({ rank: "ASC" })).toBe(true)
    expect(isRankOrder({ rank: "DESC" })).toBe(true)
    expect(isRankOrder({ created_at: "DESC" })).toBe(false)
    expect(isRankOrder(undefined)).toBe(false)
    expect(isRankOrder(null)).toBe(false)
  })
})

describe("listCollectionsByRank", () => {
  const makeScope = (rows: Array<{ id: string; title: string; metadata: Record<string, unknown> | null }>) => {
    const calls: Array<Record<string, unknown>> = []

    const graph = jest.fn(async (input: Record<string, unknown>) => {
      calls.push(input)

      if (calls.length === 1) {
        return {
          data: rows.map(({ id, metadata }) => ({ id, metadata })),
          metadata: { count: rows.length, skip: 0, take: rows.length },
        }
      }

      const filters = input.filters as { id: string[] }
      return {
        data: rows
          .filter((row) => filters.id.includes(row.id))
          .map((row) => ({ ...row, title: `${row.title}-full` })),
      }
    })

    return {
      calls,
      scope: {
        resolve: () => ({ graph }),
      } as never,
    }
  }

  const rows = [
    { id: "col_a", title: "A", metadata: { rank: 2 } },
    { id: "col_b", title: "B", metadata: { rank: 0 } },
    { id: "col_c", title: "C", metadata: null },
    { id: "col_d", title: "D", metadata: { rank: 1 } },
  ]

  it("sorts ranked collections first and keeps unranked last", async () => {
    const { scope } = makeScope(rows)

    const result = await listCollectionsByRank(scope, {
      fields: ["id", "title", "metadata"],
    })

    expect(result.data.map((row) => row.id)).toEqual([
      "col_b",
      "col_d",
      "col_a",
      "col_c",
    ])
    expect(result.metadata.count).toEqual(4)
  })

  it("honours descending rank order", async () => {
    const { scope } = makeScope(rows)

    const result = await listCollectionsByRank(scope, {
      fields: ["id"],
      pagination: { order: { rank: "DESC" } },
    })

    expect(result.data.map((row) => row.id)).toEqual([
      "col_a",
      "col_d",
      "col_b",
      "col_c",
    ])
  })

  it("pages after sorting and reports the full count", async () => {
    const { scope, calls } = makeScope(rows)

    const result = await listCollectionsByRank(scope, {
      fields: ["id"],
      pagination: { skip: 1, take: 2, order: { rank: "ASC" } },
    })

    expect(result.data.map((row) => row.id)).toEqual(["col_d", "col_a"])
    expect(result.metadata).toEqual({ count: 4, skip: 1, take: 2 })

    const pageQuery = calls[1]
    expect((pageQuery.filters as { id: string[] }).id).toEqual([
      "col_d",
      "col_a",
    ])
    expect(pageQuery.pagination).toBeUndefined()
  })

  it("returns an empty page without a second query when past the end", async () => {
    const { scope, calls } = makeScope(rows)

    const result = await listCollectionsByRank(scope, {
      fields: ["id"],
      pagination: { skip: 10, take: 5 },
    })

    expect(result).toEqual({
      data: [],
      metadata: { count: 4, skip: 10, take: 5 },
    })
    expect(calls).toHaveLength(1)
  })

  it("applies baseOrder to the unranked fetch", async () => {
    const { scope, calls } = makeScope(rows)

    await listCollectionsByRank(scope, {
      fields: ["id"],
      baseOrder: { created_at: "DESC" },
    })

    expect(calls[0].pagination).toEqual({ order: { created_at: "DESC" } })
  })
})
