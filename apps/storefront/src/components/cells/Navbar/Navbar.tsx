import { HttpTypes } from "@medusajs/types"
import { ArrowRightIcon, DiscountIcon } from "@/icons"
import { CategoryNavbar } from "@/components/molecules"
import { ParentCategoryLinks } from "@/components/molecules/ParentCategoryLinks/ParentCategoryLinks"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

export const Navbar = ({
  categories,
  parentCategories,
}: {
  categories: HttpTypes.StoreProductCategory[]
  parentCategories: HttpTypes.StoreProductCategory[]
}) => {
  return (
    <div
      className="header-nav hidden h-11 items-center border-b border-neutral-100 bg-white px-4 lg:flex lg:px-16"
      data-testid="navbar"
    >
      <div className="mx-auto flex w-full items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <ParentCategoryLinks
            parentCategories={parentCategories}
            categories={categories}
          />
          <CategoryNavbar
            categories={categories}
            parentCategories={parentCategories}
          />
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <LocalizedClientLink
            href="/categories"
            className="label-md flex items-center gap-1 text-primary transition-opacity hover:opacity-70"
            data-testid="nav-all"
          >
            All
            <ArrowRightIcon size={14} color="currentColor" />
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/categories?sortBy=discount"
            className="label-md flex items-center gap-1 font-semibold text-[rgb(var(--brand-500))] transition-opacity hover:opacity-70"
            data-testid="nav-flash-deals"
          >
            <DiscountIcon size={15} color="currentColor" />
            Flash Deals
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
