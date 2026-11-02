import { ProductDetails } from '@/components/organisms/ProductDetails/ProductDetails';
import { ProductGallery } from '@/components/organisms/ProductGallery/ProductGallery';
import { listProducts } from "@/lib/data/products"
import { listOffers } from "@/lib/data/offers"
import { retrieveCustomer } from "@/lib/data/customer"
import { StoreOffer } from "@/lib/helpers/buybox"
import { HomeProductSection } from "../HomeProductSection/HomeProductSection"
import NotFound from "@/app/not-found"
import { RecentlyViewedSection } from "@/components/sections/RecentlyViewed/RecentlyViewedSection"
import { getUserWishlists } from "@/lib/data/wishlist"
import { Wishlist } from "@/types/wishlist"

export const ProductDetailsPage = async ({
  handle,
  locale,
}: {
  handle: string
  locale: string
}) => {
  const userPromise = retrieveCustomer()

  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
  }).then(({ response }) => response.products[0])

  if (!prod) return null

  if (prod.store_status === "SUSPENDED") {
    return NotFound()
  }

  const [{ offers }, user] = await Promise.all([
    listOffers({ productId: prod.id, countryCode: locale }),
    userPromise,
  ])

  let wishlist: Wishlist[] = []
  if (user) {
    try {
      const response = await getUserWishlists()
      wishlist = response.wishlists
    } catch {
      wishlist = []
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row lg:gap-12" data-testid="product-details-page">
        <div className="md:w-1/2 md:px-2" data-testid="product-gallery-container">
          <ProductGallery images={prod?.images || []} />
        </div>
        <div className="md:w-1/2 md:px-2" data-testid="product-details-container">
          <ProductDetails
            product={prod}
            locale={locale}
            offers={offers as StoreOffer[]}
            user={user}
            wishlist={wishlist}
          />
        </div>
      </div>
      <div className="my-8">
        <HomeProductSection
          heading="Similar items"
          products={prod.seller?.products}
          locale={locale}
        />
        <RecentlyViewedSection recordedIds={[prod.id]} />
      </div>
    </>
  )
}

export const ProductDetailsPageSkeleton = () => (
  <div
    aria-busy="true"
    className="flex flex-col md:flex-row lg:gap-12"
    data-testid="product-details-page-skeleton"
  >
    <div className="md:w-1/2 md:px-2">
      <div className="aspect-square w-full animate-pulse rounded-sm bg-component-secondary" />
    </div>
    <div className="md:w-1/2 md:px-2">
      <div className="h-64 w-full animate-pulse rounded-sm border bg-component-secondary" />
    </div>
  </div>
)
