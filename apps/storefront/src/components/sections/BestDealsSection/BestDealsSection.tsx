import { ProductCard } from "@/components/organisms"
import { SectionHeading } from "@/components/molecules/SectionHeading/SectionHeading"
import { listProducts } from "@/lib/data/products"
import { getProductPrice } from "@/lib/helpers/get-product-price"

interface BestDealsSectionProps {
  locale?: string
}

export const BestDealsSection = async ({
  locale = "bd",
}: BestDealsSectionProps) => {
  const {
    response: { products },
  } = await listProducts({
    countryCode: locale,
    queryParams: {
      limit: 50,
    },
  })

  // Compute discount from numeric prices (formatted strings don't parse) and
  // sort by biggest discount
  const withDiscount = products
    .map((product) => {
      const { cheapestPrice } = getProductPrice({ product })
      const orig = cheapestPrice?.original_price_number
      const curr = cheapestPrice?.calculated_price_number
      if (!orig || !curr || orig <= curr) return null
      return { product, discountPct: Math.round(((orig - curr) / orig) * 100) }
    })
    .filter(
      (
        deal
      ): deal is { product: (typeof products)[number]; discountPct: number } =>
        deal !== null && deal.discountPct >= 10
    )
    .sort((a, b) => b.discountPct - a.discountPct)

  const topDeals = withDiscount.slice(0, 5)

  if (!topDeals.length) return null

  return (
    <section data-testid="exclusive-deals">
      <SectionHeading title="Exclusive Deals" />
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {topDeals.map(({ product }) => (
          <ProductCard
            key={product.id}
            product={product}
            imageAspect="portrait"
          />
        ))}
      </div>
    </section>
  )
}
