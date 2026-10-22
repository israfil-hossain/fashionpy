import Image from "next/image"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { listCategories } from "@/lib/data/categories"

export const CategoryStrip = async () => {
  const { parentCategories } = await listCategories()

  if (!parentCategories.length) return null

  return (
    <section
      className="w-full px-4 lg:px-16"
      data-testid="category-strip"
    >
      <div className="rounded-xl bg-white px-4 py-5 shadow-sm">
        <div className="no-scrollbar flex items-start gap-4 overflow-x-auto pb-1 sm:gap-6">
          {parentCategories.map((category) => (
            <LocalizedClientLink
              key={category.id}
              href={`/categories/${category.handle}`}
              className="group flex w-[88px] shrink-0 flex-col items-center gap-2 text-center"
            >
              <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-100">
                <Image
                  src={`/images/categories/${category.handle}.png`}
                  alt={category.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <span className="line-clamp-2 text-xs font-medium text-gray-700 transition-colors group-hover:text-[rgb(var(--brand-600))]">
                {category.name}
              </span>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}
