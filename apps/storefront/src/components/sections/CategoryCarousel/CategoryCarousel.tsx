import { Carousel } from "@/components/cells"
import { listCategories } from "@/lib/data/categories"
import { CategoryCard } from "@/components/organisms/CategoryCard/CategoryCard"
import { getCategoryImage } from "@/lib/helpers/category-image"

export const CategoryCarousel = async () => {
  const { categories } = await listCategories()

  return (
    <section className="py-8">
      <Carousel
        align="start"
        items={categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            imageSrc={getCategoryImage(category)}
          />
        ))}
      />
    </section>
  )
}
