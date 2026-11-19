import { redirect } from "next/navigation"

import { CartDrawer } from "@/components/cells/CartDrawer/CartDrawer"
import { LocaleProvider } from "@/components/providers/Locale/LocaleProvider"
import { listCountryCodes } from "@/lib/data/regions"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

// Pages read cart/customer/catalog from the API at request time. Static
// prerender at `next build` has no live backend (and api.fashionpy.com may
// not resolve inside the build sandbox), so force dynamic rendering.
export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  const countryCodes = await listCountryCodes()
  const locales = countryCodes.length ? countryCodes : [DEFAULT_REGION]
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params

  const countryCodes = await listCountryCodes()
  if (countryCodes.length && !countryCodes.includes(locale)) {
    redirect("/")
  }

  return (
    <LocaleProvider locale={locale}>
      {/* Bangla-safe UI font — Funnel Display is Latin-only (no U+0980–09FF). */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      {children}
      <CartDrawer />
    </LocaleProvider>
  )
}
