import { listRegions } from "../data/regions"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

export const checkRegion = async (locale: string) => {
  try {
    const regions = await listRegions()

    if (!regions || regions.length === 0) {
      // If backend is unavailable, accept default region
      return locale === DEFAULT_REGION
    }

    const countries = regions
      ?.map((r) => {
        return r.countries?.map((c) => c.iso_2)
      })
      .flat()

    return countries.includes(locale) ? true : false
  } catch (error) {
    // If error occurs, accept default region to avoid redirect loop
    console.warn("Unable to fetch regions, accepting default region:", DEFAULT_REGION)
    return locale === DEFAULT_REGION
  }
}
