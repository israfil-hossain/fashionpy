import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Text } from "@medusajs/ui"

export type RevenuePoint = { bucket: string; gmv?: number; revenue?: number; orders?: number }

export type RevenueChartProps = {
  data: RevenuePoint[]
  valueKey?: "gmv" | "revenue"
  height?: number
}

export const RevenueChart = ({ data, valueKey = "gmv", height = 240 }: RevenueChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-ui-fg-muted">
        <Text size="small">No data</Text>
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={48} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey={valueKey}
          stroke="#6366f1"
          fill="url(#revGrad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
