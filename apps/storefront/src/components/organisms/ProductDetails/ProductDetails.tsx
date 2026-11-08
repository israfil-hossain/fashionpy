import { ProductDetailsFooter } from '@/components/cells/ProductDetailsFooter/ProductDetailsFooter';
import { MeetYourSeller } from '@/components/organisms/MeetYourSeller/MeetYourSeller';
import { ProductTabContent } from '@/components/organisms/ProductTabContent/ProductTabContent';
import { ProductReviews } from '@/components/organisms/ProductReviews/ProductReviews';
import { listProductReviews } from '@/lib/data/reviews';

import {
  getBuyboxWinner,
  rankOffers,
  StoreOffer,
} from "@/lib/helpers/buybox"
import { AdditionalAttributeProps } from "@/types/product"
import { HttpTypes } from "@medusajs/types"

/**
 * Below-the-fold product content: About/Delivery tabs, reviews, meet your
 * seller, tags/report footer. Buy box and info column live in
 * ProductDetailsPage.
 */
export const ProductDetails = async ({
  product,
  offers = [],
  user,
}: {
  product: HttpTypes.StoreProduct & {
    attribute_values?: AdditionalAttributeProps[]
  }
  locale?: string
  offers?: StoreOffer[]
  user?: HttpTypes.StoreCustomer | null
  wishlist?: unknown
}) => {
  const winner = getBuyboxWinner(rankOffers(offers))
  const seller = winner?.seller
  const leadtimeDays =
    winner?.leadtime_to_ship ?? seller?.default_leadtime_to_ship ?? null

  const reviews = await listProductReviews(product.id)

  return (
    <div className="flex flex-col gap-8" data-testid="product-details-body">
      <ProductTabContent
        product={product}
        seller={seller}
        leadtimeDays={leadtimeDays}
      />

      <ProductReviews reviews={reviews} seller={seller} />

      <MeetYourSeller seller={seller} user={user} product={product} />

      <ProductDetailsFooter
        tags={product?.tags || []}
        posted={product?.created_at}
      />
    </div>
  )
}
