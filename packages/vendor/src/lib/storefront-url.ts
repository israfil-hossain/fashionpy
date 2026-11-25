declare const __STOREFRONT_URL__: string
declare const __STOREFRONT_LOCALE__: string

export const getStorefrontUrl = (): string => {
  const configured =
    typeof __STOREFRONT_URL__ !== "undefined" ? __STOREFRONT_URL__ : ""
  return (configured || "http://localhost:3000").replace(/\/$/, "")
}

export const getStorefrontLocale = (): string => {
  const configured =
    typeof __STOREFRONT_LOCALE__ !== "undefined" ? __STOREFRONT_LOCALE__ : ""
  return configured || "bd"
}
