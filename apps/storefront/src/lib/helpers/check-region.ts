import { listRegions } from "../data/regions"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'bd'

export const checkRegion = async (locale: string) => {
  try {
    const regions = await listRegions()
    const countries = regions
      ?.map((r) => {
        return r.countries?.map((c) => c.iso_2)
      })
      .flat() ?? []

    if (!countries.length) {
      return locale === DEFAULT_REGION
    }

    return countries.includes(locale)
  } catch {
    // API may be booting or briefly unreachable — don't 500 the layout.
    // Let the request through; region validation resumes once the API is back.
    return true
  }
}
