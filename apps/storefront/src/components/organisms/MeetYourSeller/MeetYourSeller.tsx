import { SellerDTO } from "@mercurjs/types"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { SellerAvatar } from "@/components/cells/SellerAvatar/SellerAvatar"
import { Chat } from "@/components/organisms/Chat/Chat"
import { Card } from "@/components/atoms/Card/Card"
import { format } from "date-fns"
import { Badge } from "@/components/atoms/Badge/Badge"

/**
 * Etsy-style "Meet your seller" card under the PDP tabs. Uses only real
 * seller fields (no invented sales/rating stats).
 */
export const MeetYourSeller = ({
  seller,
  user,
  product,
}: {
  seller?: SellerDTO
  user?: HttpTypes.StoreCustomer | null
  product?: HttpTypes.StoreProduct
}) => {
  if (!seller) return null

  const joined = seller.created_at
    ? format(new Date(seller.created_at), "MMMM yyyy")
    : null

  return (
    <Card className="p-5" data-testid="meet-your-seller">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4 min-w-0">
          <SellerAvatar photo={seller.logo || ""} size={64} alt={seller.name} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <LocalizedClientLink
                href={`/sellers/${seller.handle}`}
                className="heading-sm text-primary hover:underline underline-offset-2"
                data-testid="meet-your-seller-name"
              >
                {seller.name}
              </LocalizedClientLink>
              {seller.is_premium && (
                <Badge data-testid="meet-your-seller-premium">Premium</Badge>
              )}
            </div>
            {joined && (
              <p className="label-sm text-secondary mt-1" data-testid="meet-your-seller-joined">
                On Mercur since {joined}
              </p>
            )}
            {seller.description && (
              <p
                className="label-md text-secondary mt-2 line-clamp-3"
                data-testid="meet-your-seller-description"
              >
                {seller.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <LocalizedClientLink
            href={`/sellers/${seller.handle}`}
            className="rounded-sm bg-action-secondary px-4 py-2 label-md text-action-on-secondary hover:bg-action-secondary-hover active:bg-action-secondary-pressed"
            data-testid="meet-your-seller-visit"
          >
            Visit shop
          </LocalizedClientLink>
          {user && product && (
            <Chat
              user={user}
              seller={seller}
              product={product}
              variant="filled"
              buttonClassNames="uppercase"
            />
          )}
        </div>
      </div>

      <ul
        className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4"
        data-testid="meet-your-seller-trust"
      >
        <li className="label-sm text-secondary">
          {seller.default_leadtime_to_ship
            ? `Ships in ~${seller.default_leadtime_to_ship} day${seller.default_leadtime_to_ship === 1 ? "" : "s"}`
            : "Lead time set per listing"}
        </li>
        <li className="label-sm text-secondary">Replies via messages</li>
        <li className="label-sm text-secondary">Secure marketplace checkout</li>
      </ul>
    </Card>
  )
}
