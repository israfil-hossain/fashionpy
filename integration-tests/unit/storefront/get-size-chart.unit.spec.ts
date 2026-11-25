import { getSizeChart } from "../../../apps/storefront/src/lib/helpers/get-size-chart"

const sizeChart = {
  columns: [
    { key: "size", label: "Size" },
    { key: "chest", label: "Chest" },
    { key: "length", label: "Length" },
  ],
  rows: [
    { size: "M", chest: '40"', length: '28"' },
    { size: "L", chest: '42"', length: '29"' },
    { size: "XL", chest: '44"', length: '30"' },
    { size: "XXL", chest: '46"', length: '31"' },
  ],
}

describe("getSizeChart", () => {
  it("parses a size chart from product metadata", () => {
    expect(getSizeChart({ size_chart: sizeChart })).toEqual(sizeChart)
  })

  it("parses a size chart stored as a JSON string", () => {
    expect(getSizeChart({ size_chart: JSON.stringify(sizeChart) })).toEqual(
      sizeChart
    )
  })

  it("converts numeric cell values to strings", () => {
    const metadata = {
      size_chart: {
        columns: [{ key: "size", label: "Size" }],
        rows: [{ size: 42 }],
      },
    }

    expect(getSizeChart(metadata)).toEqual({
      columns: [{ key: "size", label: "Size" }],
      rows: [{ size: "42" }],
    })
  })

  it("returns null when there is no metadata or size chart", () => {
    expect(getSizeChart(null)).toBeNull()
    expect(getSizeChart(undefined)).toBeNull()
    expect(getSizeChart({})).toBeNull()
    expect(getSizeChart({ size_chart: null })).toBeNull()
  })

  it("returns null for malformed size charts", () => {
    expect(getSizeChart({ size_chart: { columns: [], rows: [] } })).toBeNull()
    expect(getSizeChart({ size_chart: { columns: [], rows: [{}] } })).toBeNull()
    expect(
      getSizeChart({
        size_chart: {
          columns: [{ key: "size", label: "Size" }],
          rows: [{ chest: '40"' }],
        },
      })
    ).toBeNull()
    expect(
      getSizeChart({
        size_chart: {
          columns: [{ key: "size", label: "" }],
          rows: [{ size: "M" }],
        },
      })
    ).toBeNull()
    expect(
      getSizeChart({
        size_chart: { columns: [{ key: "size", label: "Size" }], rows: "M" },
      })
    ).toBeNull()
  })
})
