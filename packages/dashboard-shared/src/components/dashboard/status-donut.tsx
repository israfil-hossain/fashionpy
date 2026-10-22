import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { Text } from "@medusajs/ui"

export type StatusSlice = { status: string; count: number }

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"]

export type StatusDonutProps = {
  data: StatusSlice[]
  height?: number
}

export const StatusDonut = ({ data, height = 240 }: StatusDonutProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-ui-fg-muted">
        <Text size="small">No data</Text>
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
