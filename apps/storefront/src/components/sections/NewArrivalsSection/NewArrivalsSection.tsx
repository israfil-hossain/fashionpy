import { HomeProductsCarousel } from "@/components/organisms"
import { SectionHeading } from "@/components/molecules/SectionHeading/SectionHeading"
import { listProducts } from "@/lib/data/products"

interface NewArrivalsSectionProps {
  locale?: string
}

export const NewArrivalsSection = async ({
  locale = "bd",
}: NewArrivalsSectionProps) => {
  const {
    response: { products },
  } = await listProducts({
    countryCode: locale,
    queryParams: {
      limit: 8,
      order: "-created_at",
    },
  })

  return (
    <section data-testid="new-arrivals">
      <SectionHeading title="New Arrivals" />
      <div className="mt-5">
        <HomeProductsCarousel
          locale={locale}
          sellerProducts={products}
          home={true}
        />
      </div>
    </section>
  )
}
