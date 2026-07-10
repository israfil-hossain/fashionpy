import { HttpTypes } from "@medusajs/types"
import { CategoryNavbar } from "@/components/molecules"

export const Navbar = ({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) => {
  return (
    <div className="flex h-10 items-center justify-center px-6 border-b">
      <div className="hidden md:flex items-center">
        <CategoryNavbar categories={categories} />
      </div>
    </div>
  )
}
