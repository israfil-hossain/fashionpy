import {
  ProductDetailsFooter,
  ProductDetailsHeader,
  ProductDetailsSeller,
  ProductDetailsShipping,
  ProductPageDetails,
  ProductAdditionalAttributes,
} from "@/components/cells"

import { retrieveCustomer } from "@/lib/data/customer"
import { getUserWishlists } from "@/lib/data/wishlist"
import { Wishlist } from "@/types/wishlist"
import {
  getBuyboxWinner,
  rankOffers,
  StoreOffer,
} from "@/lib/helpers/buybox"
import { AdditionalAttributeProps } from "@/types/product"
import { HttpTypes } from "@medusajs/types"

export const ProductDetails = async ({
  product,
  locale,
  offers = [],
}: {
  product: HttpTypes.StoreProduct & {
    attribute_values?: AdditionalAttributeProps[]
  }
  locale: string
  offers?: StoreOffer[]
}) => {
  const user = await retrieveCustomer()

  let wishlist: Wishlist[] = []
  if (user) {
    try {
      const response = await getUserWishlists()
      wishlist = response.wishlists
    } catch {
      wishlist = []
    }
  }

  // Master products have no seller; the seller shown comes from the buybox
  // winning offer.
  const seller = getBuyboxWinner(rankOffers(offers))?.seller

  return (
    <div>
      <ProductDetailsHeader
        product={product}
        locale={locale}
        user={user}
        offers={offers}
        seller={seller}
        wishlist={wishlist}
      />
      <ProductPageDetails details={product?.description || ""} />
      <ProductAdditionalAttributes
        attributes={product?.attribute_values || []}
      />
      <ProductDetailsShipping />
      <ProductDetailsSeller seller={seller} />
      <ProductDetailsFooter
        tags={product?.tags || []}
        posted={product?.created_at}
      />
    </div>
  )
}
