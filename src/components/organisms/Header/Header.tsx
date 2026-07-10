import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { CartDropdown, MobileNavbar, Navbar } from "@/components/cells"
import { HeartIcon, MessageIcon } from "@/icons"
import { listCategories } from "@/lib/data/categories"
import { PARENT_CATEGORIES } from "@/const"
import { retrieveCart } from "@/lib/data/cart"
import { UserDropdown } from "@/components/cells/UserDropdown/UserDropdown"
import { retrieveCustomer } from "@/lib/data/customer"
import { getUserWishlists } from "@/lib/data/wishlist"
import { Wishlist } from "@/types/wishlist"
import { Badge } from "@/components/atoms"
import CountrySelector from "@/components/molecules/CountrySelector/CountrySelector"
import { listRegions } from "@/lib/data/regions"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { MessageButton } from "@/components/molecules/MessageButton/MessageButton"
import { AnnouncementBar } from "../AnnouncementBar/AnnouncementBar"
import { NavbarSearch } from "@/components/molecules"

export const Header = async () => {
  const cart = await retrieveCart().catch(() => null)
  const user = await retrieveCustomer()
  let wishlist: Wishlist[] = []
  if (user) {
    const response = await getUserWishlists()
    wishlist = response.wishlists
  }

  const regions = await listRegions()

  const wishlistCount = wishlist?.[0]?.products.length || 0

  const { categories, parentCategories } = (await listCategories({
    headingCategories: PARENT_CATEGORIES,
  })) as {
    categories: HttpTypes.StoreProductCategory[]
    parentCategories: HttpTypes.StoreProductCategory[]
  }

  return (
    <header className="h-[120px] flex flex-col">
      {/* Marketing Announcement Bar - 28px */}
      <AnnouncementBar />

      {/* Main Header Section - 52px */}
      <div className="flex h-[52px] lg:px-8 px-4 items-center border-b">
        {/* Left Section: Search Bar */}
        <div className="flex items-center flex-1">
          <div className="hidden md:flex w-full max-w-lg lg:max-w-xl">
            <NavbarSearch />
          </div>
          <div className="md:hidden">
            <MobileNavbar
              parentCategories={parentCategories}
              childrenCategories={categories}
            />
          </div>
        </div>

        {/* Center Section: Logo */}
        <div className="flex justify-center items-center px-4">
          <LocalizedClientLink href="/">
            
            <Image
              src="/fashionpy.png"
              width={90}
              height={28}
              alt="Fashionpy"
              priority
              className=""
            />
          </LocalizedClientLink>
        </div>

        {/* Right Section: Country, Profile, Cart */}
        <div className="flex items-center justify-end gap-2 lg:gap-3 flex-1">
          <CountrySelector regions={regions} />
          <UserDropdown user={user} />
          <CartDropdown cart={cart} />
        </div>
      </div>

      {/* Navigation Bar - 40px */}
      <Navbar categories={categories} />
    </header>
  )
}
