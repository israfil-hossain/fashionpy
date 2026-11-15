import { PromoCodeCard } from "@/components/organisms/PromoCodeCard/PromoCodeCard"
import { SectionHeading } from "@/components/molecules/SectionHeading/SectionHeading"
import { listHomePromotions } from "@/lib/data/promotions"

export const PromoCodeSection = async () => {
  const promotions = await listHomePromotions()

  if (!promotions.length) {
    return null
  }

  return (
    <section data-testid="promo-code-section">
      <SectionHeading title="Current Offers" />
      <div className="mt-5 flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3 xl:grid-cols-4">
        {promotions.map((promotion) => (
          <PromoCodeCard key={promotion.id} promotion={promotion} />
        ))}
      </div>
    </section>
  )
}
