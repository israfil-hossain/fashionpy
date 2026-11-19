import { Divider } from "@/components/atoms/Divider/Divider"
import { TruckIcon, ReturnIcon, LocationIcon, TimeIcon } from "@/icons"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { SellerDTO } from "@mercurjs/types"

const rowClass = "flex gap-3 py-3"
const iconClass = "shrink-0 mt-0.5 text-primary"

/**
 * Delivery tab content. Honest, seller-sourced copy only — no shipping-rate
 * API exists on the storefront, so cost is deferred to checkout.
 */
export const ProductDeliveryPanel = ({
  seller,
  leadtimeDays,
}: {
  seller?: SellerDTO
  leadtimeDays?: number | null
}) => {
  const from = seller?.address?.city
    ? [seller.address.city, seller.address.country_code]
        .filter(Boolean)
        .join(", ")
    : seller?.address?.country_code || "Seller location"

  return (
    <div
      className="grid gap-6 lg:grid-cols-[1fr_280px]"
      data-testid="product-delivery-panel"
    >
      <div className="border rounded-sm px-4 py-2">
        <div className={rowClass}>
          <TimeIcon size={20} className={iconClass} />
          <div>
            <p className="label-md text-primary">Lead time</p>
            <p className="label-sm text-secondary" data-testid="product-delivery-leadtime">
              {leadtimeDays
                ? `Ships in about ${leadtimeDays} business day${leadtimeDays === 1 ? "" : "s"}`
                : "Lead time is set by the seller"}
            </p>
          </div>
        </div>
        <Divider />
        <div className={rowClass}>
          <LocationIcon size={20} className={iconClass} />
          <div>
            <p className="label-md text-primary">Sent from</p>
            <p className="label-sm text-secondary" data-testid="product-delivery-from">
              {from}
            </p>
          </div>
        </div>
        <Divider />
        <div className={rowClass}>
          <TruckIcon size={20} className={iconClass} />
          <div>
            <p className="label-md text-primary">Cost to deliver</p>
            <p className="label-sm text-secondary">
              Calculated at checkout based on your address
            </p>
          </div>
        </div>
        <Divider />
        <div className={rowClass}>
          <ReturnIcon size={20} className={iconClass} />
          <div>
            <p className="label-md text-primary">Returns</p>
            <p className="label-sm text-secondary">
              Accepted within 30 days of delivery if the item is unused and in
              original packaging. Request a return from Your Orders — we
              arrange the pickup.
            </p>
            <p className="label-sm text-secondary mt-1">
              <LocalizedClientLink
                href="/policies/return-refund"
                className="underline"
                data-testid="policy-link-return-refund"
              >
                Return &amp; Refund Policy
              </LocalizedClientLink>
              {" · "}
              <LocalizedClientLink
                href="/policies/shipping"
                className="underline"
                data-testid="policy-link-shipping"
              >
                Shipping Policy
              </LocalizedClientLink>
            </p>
          </div>
        </div>
      </div>

      <aside
        className="border rounded-sm p-4 h-fit"
        data-testid="product-shop-confidence"
      >
        <h3 className="label-lg uppercase mb-3">Shop with confidence</h3>
        <ul className="flex flex-col gap-3">
          <li className="label-sm text-secondary">
            {seller?.is_premium
              ? "Premium seller on FashionPy"
              : "Established FashionPy marketplace seller"}
          </li>
          <li className="label-sm text-secondary">
            Payment is held securely until you confirm delivery
          </li>
          <li className="label-sm text-secondary">
            Message the seller before and after you order
          </li>
          <li className="label-sm text-secondary">
            <LocalizedClientLink href="/policies" className="underline">
              View all store policies
            </LocalizedClientLink>
          </li>
        </ul>
      </aside>
    </div>
  )
}
