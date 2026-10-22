import { SegmentedControl } from "../common/segmented-control/segmented-control"

export type Period = "7d" | "30d" | "90d" | "12m"

export type PeriodSelectorProps = {
  value: Period
  onChange: (v: Period) => void
}

const OPTIONS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "12m", value: "12m" },
]

export const PeriodSelector = ({ value, onChange }: PeriodSelectorProps) => {
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onValueChange={(v) => onChange(v as Period)}
    />
  )
}
