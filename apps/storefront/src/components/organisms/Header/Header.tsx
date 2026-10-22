import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { CartDropdown, MobileNavbar, Navbar } from "@/components/cells"
import { UserDropdown } from "@/components/cells/UserDropdown/UserDropdown"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { HeaderSearch } from "@/components/molecules/HeaderSearch/HeaderSearch"
import { MessageButton } from "@/components/molecules/MessageButton/MessageButton"
import { HeartIcon, SearchIcon } from "@/icons"
import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import { retrieveStoreSettings } from "@/lib/data/store-settings"
import { AnnouncementBar } from "../AnnouncementBar/AnnouncementBar"

const vendorUrl = process.env.NEXT_PUBLIC_VENDOR_URL || "http://localhost:7002"

export const Header = async ({ locale }: { locale: string }) => {
  const user = await retrieveCustomer().catch(() => null)
  const isLoggedIn = Boolean(user)

  const settings = await retrieveStoreSettings()
  const announcement = settings?.announcement ?? { enabled: false, message: "", amount: null, link_label: null, link_href: null, starts_at: null, ends_at: null }

  const { categories, parentCategories } = (await listCategories({
    query: { include_ancestors_tree: true }
  })) as {
    categories: HttpTypes.StoreProductCategory[]
    parentCategories: HttpTypes.StoreProductCategory[]
  }

  return (
    <>
      <header
        className="sticky top-0 z-50"
        data-testid="header"
      >
        <AnnouncementBar locale={locale} announcement={announcement} />

        <div
          className="bg-[rgb(var(--brand-500))] text-white"
          data-testid="header-top"
        >
          <div className="flex h-16 w-full items-center gap-3 px-4 lg:px-16">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="lg:hidden">
                <MobileNavbar
                  parentCategories={parentCategories}
                  categories={categories}
                />
              </div>
              <LocalizedClientLink
                href="/"
                data-testid="header-logo-link"
                aria-label="FashionPy home"
              >
                <Image
                  src="/fashionpy.svg"
                  width={160}
                  height={40}
                  alt="FashionPy"
                  className="h-9 w-auto lg:h-12"
                  priority
                />
              </LocalizedClientLink>
            </div>

            <div
              className="hidden w-full max-w-[560px] md:block"
              data-testid="navbar-search-desktop"
            >
              <HeaderSearch />
            </div>

            <div
              className="flex flex-1 items-center justify-end gap-3 lg:gap-4"
              data-testid="header-actions"
            >
              <LocalizedClientLink
                href="/categories"
                aria-label="Search products"
                className="md:hidden"
                data-testid="header-search-link"
              >
                <SearchIcon size={20} color="#ffffff" />
              </LocalizedClientLink>

              {isLoggedIn && <MessageButton iconColor="#ffffff" />}

              <div
                className="hidden items-center gap-1.5 md:flex"
                data-testid="header-seller-links"
              >
                <a
                  href={`${vendorUrl}/register`}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[rgb(var(--brand-600))] transition-colors hover:bg-white/90"
                  data-testid="header-become-seller"
                >
                  Become a Seller
                </a>
                <a
                  href={`${vendorUrl}/login`}
                  className="rounded-full border border-white/60 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/10"
                  data-testid="header-login-seller"
                >
                  Login as Seller
                </a>
              </div>

              <LocalizedClientLink
                href="/user/wishlist"
                aria-label="Go to wishlist"
                className="hidden sm:block"
                data-testid="header-wishlist"
              >
                <HeartIcon size={20} color="#ffffff" />
              </LocalizedClientLink>

              <CartDropdown iconColor="#ffffff" />
              <UserDropdown isLoggedIn={isLoggedIn} iconColor="#ffffff" />
            </div>
          </div>
        </div>

        <Navbar categories={categories} parentCategories={parentCategories} />
      </header>
    </>
  )
}
