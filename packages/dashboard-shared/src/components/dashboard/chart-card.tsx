import { clx } from "@medusajs/ui"
import { Heading, Text } from "@medusajs/ui"
import { ReactNode } from "react"

export type ChartCardProps = {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
}

export const ChartCard = ({
  title,
  subtitle,
  children,
  className,
  actions,
}: ChartCardProps) => {
  return (
    <div
      className={clx(
        "bg-ui-bg-base shadow-elevation-card-rest rounded-lg p-4 flex flex-col gap-y-3",
        className
      )}
    >
      <div className="flex items-start justify-between gap-x-2">
        <div className="flex flex-col gap-y-0.5">
          <Heading level="h3" className="text-ui-fg-base">
            {title}
          </Heading>
          {subtitle ? (
            <Text size="xsmall" className="text-ui-fg-muted">
              {subtitle}
            </Text>
          ) : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className="w-full">{children}</div>
    </div>
  )
}
