export function assetUrl(path: string): string {
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(path)) {
    return path
  }
  const base = (typeof __BASE__ !== "undefined" ? __BASE__ : "/").replace(
    /\/+$/,
    ""
  )
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${cleanPath}`
}
