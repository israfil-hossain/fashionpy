export type SizeChartColumn = {
  key: string
  label: string
}

export type SizeChart = {
  columns: SizeChartColumn[]
  rows: Record<string, string>[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (isRecord(value)) return value
  if (typeof value !== "string" || !value.trim()) return null

  try {
    const parsed: unknown = JSON.parse(value)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const getSizeChart = (
  metadata: Record<string, unknown> | null | undefined
): SizeChart | null => {
  if (!metadata) return null

  const chart = asRecord(metadata.size_chart)
  if (!chart || !Array.isArray(chart.columns) || !Array.isArray(chart.rows)) {
    return null
  }

  const columns: SizeChartColumn[] = []
  for (const entry of chart.columns) {
    const column = asRecord(entry)
    const key = typeof column?.key === "string" ? column.key.trim() : ""
    const label = typeof column?.label === "string" ? column.label.trim() : ""
    if (!key || !label) return null
    columns.push({ key, label })
  }
  if (!columns.length) return null

  const rows: Record<string, string>[] = []
  for (const entry of chart.rows) {
    const source = asRecord(entry)
    if (!source) return null

    const row: Record<string, string> = {}
    for (const { key } of columns) {
      const value = source[key]
      if (typeof value !== "string" && typeof value !== "number") return null
      const text = String(value).trim()
      if (!text) return null
      row[key] = text
    }
    rows.push(row)
  }
  if (!rows.length) return null

  return { columns, rows }
}
