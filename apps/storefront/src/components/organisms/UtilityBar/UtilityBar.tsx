import { ArrowRightIcon, DashboardIcon, HeadphoneIcon, LocationIcon, TruckIcon } from "@/icons"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7002"

export const UtilityBar = () => {
  return (
    <div
      className="header-utility hidden h-10 items-center justify-between border-b border-[#f6e3da] bg-[#fff3ed] px-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-700 lg:flex lg:px-16"
      data-testid="utility-bar"
    >
      <LocalizedClientLink
        href="/user/addresses"
        className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
        data-testid="utility-add-address"
      >
        <LocationIcon size={14} color="currentColor" className="text-[rgb(var(--brand-500))]" />
        Add Delivery Address
        <ArrowRightIcon size={12} color="currentColor" className="text-[rgb(var(--brand-500))]" />
      </LocalizedClientLink>

      <div className="flex items-center gap-6">
        <a
          href={`${vendorUrl}/register`}
          className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
          data-testid="utility-sell-on-fashionpy"
        >
          <DashboardIcon size={14} color="currentColor" className="text-[rgb(var(--brand-500))]" />
          Sell on FashionPy
        </a>
        <LocalizedClientLink
          href="/user/messages"
          className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
          data-testid="utility-customer-care"
        >
          <HeadphoneIcon size={14} color="currentColor" className="text-[rgb(var(--brand-500))]" />
          Customer Care
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/user/orders"
          className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
          data-testid="utility-track-order"
        >
          <TruckIcon size={14} color="currentColor" className="text-[rgb(var(--brand-500))]" />
          Track My Order
        </LocalizedClientLink>
      </div>
    </div>
  )
}
