import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import footerLinks from "@/data/footerLinks"
import { Newsletter } from "../Newsletter/Newsletter"
import { SellNowButton } from "@/components/cells/SellNowButton/SellNowButton"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary mt-16">
      {/* Sell Now Section */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 py-8 px-4 lg:px-8">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Start Selling on Fashionpy
            </h3>
            <p className="text-white/90 text-base md:text-lg">
              Join thousands of sellers and grow your business with us
            </p>
          </div>
          <div className="flex-shrink-0">
            <SellNowButton />
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <Newsletter />

      {/* Main Footer Content */}
      <div className="bg-gradient-to-b from-brand-25 to-white py-12 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* PAGES Column */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">
                PAGES
              </h3>
              <nav className="space-y-3" aria-label="Pages navigation">
                {footerLinks.pages.map(({ label, path }) => (
                  <LocalizedClientLink
                    key={label}
                    href={path}
                    className="block text-gray-700 hover:text-brand-500 transition-colors duration-200 text-base"
                  >
                    {label}
                  </LocalizedClientLink>
                ))}
              </nav>
            </div>

            {/* CATEGORY Column */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">
                CATEGORY
              </h3>
              <nav className="space-y-3" aria-label="Category navigation">
                {footerLinks.category.map(({ label, path }) => (
                  <LocalizedClientLink
                    key={label}
                    href={path}
                    className="block text-gray-700 hover:text-brand-500 transition-colors duration-200 text-base"
                  >
                    {label}
                  </LocalizedClientLink>
                ))}
              </nav>
            </div>

            {/* BRAND Column */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">
                BRAND
              </h3>
              <nav className="space-y-3" aria-label="Brand navigation">
                {footerLinks.brand.map(({ label, path }, index) => (
                  <a
                    key={`${label}-${index}`}
                    href={path}
                    className="block text-gray-700 hover:text-brand-500 transition-colors duration-200 text-base"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            {/* FOLLOW US Column */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">
                FOLLOW US
              </h3>
              <nav className="space-y-3" aria-label="Social media navigation">
                {footerLinks.followUs.map(({ label, path }) => (
                  <a
                    aria-label={`Follow us on ${label}`}
                    title={`Follow us on ${label}`}
                    key={label}
                    href={path}
                    className="block text-gray-700 hover:text-brand-500 transition-colors duration-200 text-base"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Bottom Copyright Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <LocalizedClientLink
              href="/privacy-policy"
              className="text-gray-600 hover:text-brand-500 transition-colors duration-200 text-sm"
            >
              Privacy Policy
            </LocalizedClientLink>
            <p className="text-gray-600 text-sm text-center">
              Copyright © {currentYear} Fashionpy, All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
