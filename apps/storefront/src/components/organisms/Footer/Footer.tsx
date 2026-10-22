import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import footerLinks from "@/data/footerLinks"
import { Newsletter } from "../Newsletter/Newsletter"
import { SellNowButton } from "@/components/cells/SellNowButton/SellNowButton"
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon, XIcon, MessageIcon } from "@/icons"
import type { ComponentType } from "react"

type IconComponentType = ComponentType<{ className?: string }>

const SOCIAL_ICONS: Record<string, IconComponentType> = {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
  XIcon,
  MessageIcon,
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  const { brand, policies, seller, followUs } = footerLinks

  return (
    <footer className="bg-primary mt-16" data-testid="footer">
      {/* Brand CTA Bar */}
      <div className="bg-gradient-to-r from-[rgb(var(--brand-600))] to-[rgb(var(--brand-500))] py-8 px-4 lg:px-8">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3">
              <img
                src="/f_logo.svg"
                alt="FashionPy"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  FashionPy
                </h3>
                
              </div>
            </div>
            {/* <div className="flex self-end">
              {brand[0].badges.map((badge) => (
                <LocalizedClientLink
                  key={badge.label}
                  href={badge.href}
                  className="inline-block rounded-full px-3 py-1 text-xs font-medium text-white hover:bg-white hover:text-black transition-colors mb-2"
                >
                  {badge.label}
                </LocalizedClientLink>
              ))}
            </div> */}
          </div>
          <SellNowButton />
        </div>
      </div>

      <Newsletter />

      <div className="bg-gradient-to-b from-[rgb(var(--brand-25))] to-white py-12 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">
                FashionPy Policies
              </h3>
              <nav className="space-y-3" aria-label="Policies navigation">
                {policies.map(({ label, path }) => (
                  <LocalizedClientLink
                    key={label}
                    href={path}
                    className="block text-gray-700 hover:text-[rgb(var(--brand-500))] transition-colors duration-200 text-base"
                  >
                    {label}
                  </LocalizedClientLink>
                ))}
              </nav>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">
                FashionPy Seller
              </h3>
              <nav className="space-y-3" aria-label="Seller navigation">
                {seller.map(({ label, path }) => (
                  <LocalizedClientLink
                    key={label}
                    href={path}
                    className="block text-gray-700 hover:text-[rgb(var(--brand-500))] transition-colors duration-200 text-base"
                  >
                    {label}
                  </LocalizedClientLink>
                ))}
              </nav>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">
                Follow Us
              </h3>
              <nav className="space-y-3" aria-label="Social media navigation">
                {followUs.map(({ label, path, icon }) => {
                  const IconComponent = SOCIAL_ICONS[icon] ?? FacebookIcon
                  return (
                    <a
                      aria-label={`Follow us on ${label}`}
                      title={`Follow us on ${label}`}
                      key={label}
                      href={path}
                      data-testid={`footer-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="block text-gray-700 hover:text-[rgb(var(--brand-500))] transition-colors duration-200 text-base flex space-x-2 items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconComponent className="h-5 w-5 mr-2" />
                      {label}
                    </a>
                  )
                })}
              </nav>
            </div>
          </div>

          <div
            className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4"
            data-testid="footer-copyright"
          >
            <LocalizedClientLink
              href="/privacy-policy"
              className="text-gray-600 hover:text-[rgb(var(--brand-500))] transition-colors duration-200 text-sm"
            >
              Privacy Policy
            </LocalizedClientLink>
            <p className="text-gray-600 text-sm text-center">
              Copyright © {currentYear} FashionPy, All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}