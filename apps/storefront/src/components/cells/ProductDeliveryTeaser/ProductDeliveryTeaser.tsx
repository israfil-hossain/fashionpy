import { Card } from "@/components/atoms/Card/Card"
import { TruckIcon } from "@/icons"

/**
 * Compact delivery teaser inside the sticky buy box. Full policy lives in
 * the Delivery tab below; this is a jump affordance only.
 */
export const ProductDeliveryTeaser = ({
  leadtimeDays,
}: {
  leadtimeDays?: number | null
}) => {
  return (
    <Card
      className="flex items-start gap-3 py-3"
      data-testid="product-delivery-teaser"
    >
      <TruckIcon size={20} className="mt-0.5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="label-md text-primary">Delivery &amp; returns</p>
        <p className="label-sm text-secondary">
          {leadtimeDays
            ? `Ships in about ${leadtimeDays} business day${leadtimeDays === 1 ? "" : "s"}`
            : "Lead time set by the seller"}
        </p>
        <a
          href="#product-delivery-tab"
          className="mt-0.5 inline-block label-sm text-primary underline underline-offset-2"
          data-testid="product-delivery-teaser-link"
        >
          View details
        </a>
      </div>
    </Card>
  )
}
