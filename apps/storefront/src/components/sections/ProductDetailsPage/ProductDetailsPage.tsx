import { ProductDetails } from '@/components/organisms/ProductDetails/ProductDetails';
import { ProductGallery } from '@/components/organisms/ProductGallery/ProductGallery';
import { ProductInfoColumn } from '@/components/cells/ProductInfoColumn/ProductInfoColumn';
import { ProductBuyBox } from '@/components/cells/ProductBuyBox/ProductBuyBox';
import { Breadcrumbs } from '@/components/atoms/Breadcrumbs/Breadcrumbs';
import { ProductBackLink } from '@/components/molecules/ProductBackLink/ProductBackLink';
import { listProducts } from "@/lib/data/products"
import { listOffers } from "@/lib/data/offers"
import { retrieveCustomer } from "@/lib/data/customer"
import {
  getBuyboxWinner,
  rankOffers,
  StoreOffer,
} from "@/lib/helpers/buybox"
import { HomeProductSection } from "../HomeProductSection/HomeProductSection"
import NotFound from "@/app/not-found"
import { RecentlyViewedSection } from "@/components/sections/RecentlyViewed/RecentlyViewedSection"
import { getUserWishlists } from "@/lib/data/wishlist"
import { Wishlist } from "@/types/wishlist"
import { HttpTypes } from "@medusajs/types"

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

  if ((prod as { store_status?: string }).store_status === "SUSPENDED") {
    return NotFound()
  }

  const [{ offers }, user] = await Promise.all([
    listOffers({ productId: prod.id, countryCode: locale }),
    userPromise,
  ])

  const storeOffers = offers as StoreOffer[]
  const seller = getBuyboxWinner(rankOffers(storeOffers))?.seller

  let wishlist: Wishlist[] = []
  if (user) {
    try {
      const response = await getUserWishlists()
      wishlist = response.wishlists
    } catch {
      wishlist = []
    }
  }

  // "More from this shop": other products this seller offers, re-fetched by
  // handle so cards get full variant prices (offer.product is partial).
  let sellerProducts: HttpTypes.StoreProduct[] = []
  if (seller?.id) {
    const { offers: sellerOffers } = await listOffers({
      sellerId: seller.id,
      countryCode: locale,
      limit: 12,
    })
    const seen = new Set<string>([prod.handle])
    const handles: string[] = []
    for (const offer of sellerOffers as StoreOffer[]) {
      const h = offer.product?.handle
      if (h && !seen.has(h)) {
        seen.add(h)
        handles.push(h)
      }
      if (handles.length >= 8) break
    }
    if (handles.length) {
      const { response } = await listProducts({
        countryCode: locale,
        queryParams: { handle: handles, limit: handles.length },
      })
      sellerProducts = response.products
    }
  }

  const category = prod.categories?.[0]
  const breadcrumbItems = [
    { label: "Home", path: "/" },
    ...(category
      ? [{ label: category.name, path: `/categories/${category.handle}` }]
      : []),
    { label: prod.title, path: `/products/${prod.handle}` },
  ]

  return (
    <>
      <div
        className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
        data-testid="product-page-chrome"
      >
        <div className="hidden md:block">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <ProductBackLink />
      </div>

      <div
        className="flex flex-col gap-6 lg:flex-row lg:gap-8"
        data-testid="product-details-page"
      >
        <div
          className="min-w-0 lg:w-[48%]"
          data-testid="product-gallery-container"
        >
          <ProductGallery
            images={prod?.images || []}
            productId={prod.id}
            user={user}
            wishlist={wishlist}
          />
        </div>

        <div
          className="min-w-0 lg:w-[28%]"
          data-testid="product-details-container"
        >
          <ProductInfoColumn product={prod} seller={seller} />
        </div>

        <div
          className="min-w-0 lg:w-[24%]"
          data-testid="product-buybox-container"
        >
          <ProductBuyBox
            product={prod}
            locale={locale}
            user={user}
            offers={storeOffers}
            seller={seller}
          />
        </div>
      </div>

      <div className="mt-8" data-testid="product-details-lower">
        <ProductDetails product={prod} offers={storeOffers} user={user} />
      </div>

      {sellerProducts.length > 0 && (
        <div className="my-8">
          <HomeProductSection
            heading="More from this shop"
            products={sellerProducts}
            locale={locale}
          />
        </div>
      )}
      <div className="my-8">
        <RecentlyViewedSection currentHandle={prod.handle} locale={locale} />
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
