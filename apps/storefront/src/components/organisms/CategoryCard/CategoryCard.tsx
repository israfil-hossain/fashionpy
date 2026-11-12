import { HttpTypes } from "@medusajs/types"

import { CategoryImage } from "@/components/atoms/CategoryImage/CategoryImage"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { getCategoryImage } from "@/lib/helpers/category-image"

export const CategoryCard = ({
  category,
  imageSrc,
}: {
  category: HttpTypes.StoreProductCategory
  imageSrc?: string
}) => {
  return (
    <div
      className="group hover:rounded-lg transition-colors duration-200 w-full bg-gray-100 p-4"
      data-testid="category-card"
    >
      <LocalizedClientLink href={`/categories/${category.handle}`}>
        <CategoryImage
          src={imageSrc ?? getCategoryImage(category)}
          alt={category.name}
          width={200}
          height={200}
          className="object-cover rounded-lg mb-3"
          priority
        />
        <h3 className="text-sm font-medium text-primary">{category.name}</h3>
        <span className="mt-2 text-blue-600 hover:text-blue-800 transition-colors text-sm">
          View All
        </span>
      </LocalizedClientLink>
    </div>
  )
}
