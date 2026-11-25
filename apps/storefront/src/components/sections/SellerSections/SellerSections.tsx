import { SectionHeading } from "@/components/molecules/SectionHeading/SectionHeading"
import ProductListingNoResultsView from "@/components/molecules/ProductListingNoResultsView/ProductListingNoResultsView"
import { OfferCard } from "@/components/organisms/OfferCard/OfferCard"
import { ProductReviews } from "@/components/organisms/ProductReviews/ProductReviews"
import { SellerOffersListing } from "@/components/sections/SellerOffersListing/SellerOffersListing"
import { listOffers } from "@/lib/data/offers"
import { listSellerReviews } from "@/lib/data/reviews"
import type { StoreOffer } from "@/lib/helpers/buybox"
import type {
  SellerDTO,
  SellerStorefrontLayoutSection,
} from "@mercurjs/types"

const OFFER_BLOCK_LIMIT = 8

const OfferGridBlock = async ({
  sellerId,
  locale,
  title,
  order,
  testId,
}: {
  sellerId: string
  locale: string
  title: string
  order?: string
  testId: string
}) => {
  const { offers } = await listOffers({
    sellerId,
    countryCode: locale,
    limit: OFFER_BLOCK_LIMIT,
    order,
  })

  return (
    <section className="flex flex-col gap-4 py-8" data-testid={testId}>
      <SectionHeading title={title} />
      {offers.length === 0 ? (
        <ProductListingNoResultsView />
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {(offers as StoreOffer[]).map((offer) => (
            <OfferCard key={offer.id} offer={offer} locale={locale} />
          ))}
        </div>
      )}
    </section>
  )
}

const ReviewsBlock = async ({
  seller,
}: {
  seller: SellerDTO
}) => {
  const reviews = await listSellerReviews(seller.id)

  return (
    <section className="py-8" data-testid="seller-storefront-reviews">
      <ProductReviews heading="Reviews" reviews={reviews} seller={seller} />
    </section>
  )
}

const ContactBlock = ({ seller }: { seller: SellerDTO }) => {
  const email = typeof seller.email === "string" ? seller.email : null
  const phone = typeof seller.phone === "string" ? seller.phone : null

  if (!email && !phone) {
    return null
  }

  return (
    <section
      className="flex flex-col items-center gap-2 py-8 label-md"
      data-testid="seller-storefront-contact"
    >
      <SectionHeading title="Contact" />
      <div className="flex flex-wrap justify-center gap-6">
        {email && (
          <a className="text-ui-fg-interactive" href={`mailto:${email}`}>
            {email}
          </a>
        )}
        {phone && (
          <a className="text-ui-fg-interactive" href={`tel:${phone}`}>
            {phone}
          </a>
        )}
      </div>
    </section>
  )
}

export const SellerSections = async ({
  seller,
  locale,
  page,
  sections,
}: {
  seller: SellerDTO
  locale: string
  page: number
  sections: SellerStorefrontLayoutSection[]
}) => {
  const enabled = sections.filter((section) => section.enabled)

  return (
    <div data-testid="seller-storefront-sections">
      {enabled.map((section) => {
        switch (section.id) {
          case "featured_products":
            return (
              <OfferGridBlock
                key={section.id}
                sellerId={seller.id}
                locale={locale}
                title="Featured products"
                testId="seller-storefront-featured-products"
              />
            )
          case "new_arrivals":
            return (
              <OfferGridBlock
                key={section.id}
                sellerId={seller.id}
                locale={locale}
                title="New arrivals"
                order="-created_at"
                testId="seller-storefront-new-arrivals"
              />
            )
          case "all_products":
            return (
              <section
                key={section.id}
                className="py-8"
                data-testid="seller-storefront-all-products"
              >
                <SectionHeading title="All products" />
                <SellerOffersListing
                  seller_id={seller.id}
                  locale={locale}
                  page={page}
                />
              </section>
            )
          case "reviews":
            return <ReviewsBlock key={section.id} seller={seller} />
          case "contact":
            return <ContactBlock key={section.id} seller={seller} />
          default:
            return null
        }
      })}
    </div>
  )
}
