'use server'

import fallback from '@/data/bangladesh-locations.json'

export type BangladeshLocationOption = {
  slug: string
  name_en: string
  name_bn: string
}

const API = process.env.BANGLADESH_LOCATIONS_API || 'https://deshapi.riadul.com/v1'
const fallbackData = fallback as {
  divisions: Array<
    BangladeshLocationOption & {
      districts: Array<BangladeshLocationOption & { upazilas: BangladeshLocationOption[] }>
    }
  >
}

const fetchOptions = async (path: string): Promise<BangladeshLocationOption[]> => {
  try {
    const response = await fetch(`${API}${path}`, {
      next: { revalidate: 86400 },
    })

    if (!response.ok) {
      throw new Error(`Bangladesh locations API responded ${response.status}`)
    }

    const payload = (await response.json()) as {
      success?: boolean
      data?: BangladeshLocationOption[]
    }

    if (!payload.success || !Array.isArray(payload.data)) {
      throw new Error('Unexpected Bangladesh locations API response')
    }

    return payload.data
  } catch (error) {
    console.error('[bangladesh-locations] using bundled fallback:', error)
    return []
  }
}

const onlyFields = (options: BangladeshLocationOption[]) =>
  options.map(({ slug, name_en, name_bn }) => ({ slug, name_en, name_bn }))

export const listBangladeshDivisions = async (): Promise<
  BangladeshLocationOption[]
> => {
  const remote = await fetchOptions('/divisions')
  return remote.length
    ? onlyFields(remote)
    : onlyFields(fallbackData.divisions)
}

export const listBangladeshDistricts = async (
  division: string
): Promise<BangladeshLocationOption[]> => {
  const divisionRecord = fallbackData.divisions.find(
    item => item.slug === division || item.name_en === division
  )

  const remote = await fetchOptions(`/districts?division=${divisionRecord?.slug ?? division}`)
  if (remote.length) {
    return onlyFields(remote)
  }

  return onlyFields(divisionRecord?.districts ?? [])
}

export const listBangladeshUpazilas = async (
  district: string
): Promise<BangladeshLocationOption[]> => {
  let districtRecord:
    | (BangladeshLocationOption & { upazilas: BangladeshLocationOption[] })
    | undefined

  for (const division of fallbackData.divisions) {
    districtRecord = division.districts.find(
      item => item.slug === district || item.name_en === district
    )
    if (districtRecord) break
  }

  const remote = await fetchOptions(`/upazilas?district=${districtRecord?.slug ?? district}`)
  if (remote.length) {
    return onlyFields(remote)
  }

  return onlyFields(districtRecord?.upazilas ?? [])
}
