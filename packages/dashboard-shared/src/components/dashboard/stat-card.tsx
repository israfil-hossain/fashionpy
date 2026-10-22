import { clx } from "@medusajs/ui"
import { Skeleton, Text, Heading } from "@medusajs/ui"
import { ReactNode } from "react"

export type StatCardProps = {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  loading?: boolean
  className?: string
}

export const StatCard = ({
  label,
  value,
  hint,
  icon,
  loading,
  className,
}: StatCardProps) => {
  return (
    <div
      className={clx(
        "bg-ui-bg-base shadow-elevation-card-rest rounded-lg p-4 flex flex-col gap-y-2",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Text size="small" className="text-ui-fg-subtle">
          {label}
        </Text>
        {icon ? <span className="text-ui-fg-muted">{icon}</span> : null}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <Heading level="h2" className="text-ui-fg-base">
          {value}
        </Heading>
      )}
      {hint ? (
        <Text size="xsmall" className="text-ui-fg-muted">
          {hint}
        </Text>
      ) : null}
    </div>
  )
}
