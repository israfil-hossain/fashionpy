import { HttpTypes } from "@medusajs/types"
import { CategoryNavbar } from "@/components/molecules"
import { ParentCategoryLinks } from "@/components/molecules/ParentCategoryLinks/ParentCategoryLinks"

export const Navbar = ({
  categories,
  parentCategories,
}: {
  categories: HttpTypes.StoreProductCategory[]
  parentCategories: HttpTypes.StoreProductCategory[]
}) => {
  return (
    <div
      className="hidden lg:flex h-10 items-center border-t border-white/15 bg-[rgb(var(--brand-500))] px-4 lg:px-16 nav-brand"
      data-testid="navbar"
    >
      <div className="flex items-center gap-4 mx-auto">
        <ParentCategoryLinks
          parentCategories={parentCategories}
          categories={categories}
        />
        <CategoryNavbar
          categories={categories}
          parentCategories={parentCategories}
        />
      </div>
    </div>
  )
}
