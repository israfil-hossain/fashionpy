import { Card } from "@/components/atoms/Card/Card"
import { ProductJumpLink } from "@/components/molecules/ProductJumpLink/ProductJumpLink"
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
      className="overflow-hidden p-0"
      data-testid="product-delivery-teaser"
    >
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-component-secondary text-primary">
          <TruckIcon size={18} color="currentColor" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="label-md font-medium text-primary">
            Delivery &amp; returns
          </p>
          <p className="label-sm mt-0.5 text-secondary">
            {leadtimeDays
              ? `Ships in about ${leadtimeDays} business day${leadtimeDays === 1 ? "" : "s"}`
              : "Lead time set by the seller"}
          </p>
        </div>
      </div>
      <div className="border-t border-secondary px-4 py-3">
        <ProductJumpLink
          hash="product-delivery-tab"
          className="label-sm font-medium text-primary underline-offset-4 hover:underline"
          testId="product-delivery-teaser-link"
        >
          View details
        </ProductJumpLink>
      </div>
    </Card>
  )
}
