'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  listBangladeshDistricts,
  listBangladeshDivisions,
  listBangladeshUpazilas,
  type BangladeshLocationOption,
} from '@/lib/data/bangladesh-locations'

export type BangladeshLocationValues = {
  division: string
  district: string
  upazila: string
}

const selectClass =
  'label-sm h-10 w-full rounded-sm border border-primary bg-component px-3 text-primary'

export const BangladeshLocationSelects = ({
  values,
  onChange,
}: {
  values: BangladeshLocationValues
  onChange: (values: BangladeshLocationValues) => void
}) => {
  const [divisions, setDivisions] = useState<BangladeshLocationOption[]>([])
  const [districts, setDistricts] = useState<BangladeshLocationOption[]>([])
  const [upazilas, setUpazilas] = useState<BangladeshLocationOption[]>([])

  useEffect(() => {
    let cancelled = false
    listBangladeshDivisions().then(options => {
      if (!cancelled) setDivisions(options)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!values.division) {
      setDistricts([])
      setUpazilas([])
      return
    }
    listBangladeshDistricts(values.division).then(options => {
      if (!cancelled) setDistricts(options)
    })
    return () => {
      cancelled = true
    }
  }, [values.division])

  useEffect(() => {
    let cancelled = false
    if (!values.district) {
      setUpazilas([])
      return
    }
    listBangladeshUpazilas(values.district).then(options => {
      if (!cancelled) setUpazilas(options)
    })
    return () => {
      cancelled = true
    }
  }, [values.district])

  const labelFor = useMemo(
    () => (options: BangladeshLocationOption[], value: string) =>
      options.find(option => option.name_en === value)?.name_en ||
      options.find(option => option.slug === value)?.name_en ||
      value,
    []
  )

  return (
    <div className="col-span-full grid grid-cols-1 gap-4 lg:grid-cols-3">
      <label className="flex flex-col gap-2">
        <span className="label-md text-secondary">Division</span>
        <select
          className={selectClass}
          aria-label="Division"
          data-testid="shipping-division-select"
          value={values.division}
          onChange={event => {
            onChange({
              division: event.target.value,
              district: '',
              upazila: '',
            })
          }}
        >
          <option value="">Select division</option>
          {divisions.map(option => (
            <option key={option.slug} value={option.name_en}>
              {option.name_en}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="label-md text-secondary">District</span>
        <select
          className={selectClass}
          aria-label="District"
          data-testid="shipping-district-select"
          value={values.district}
          disabled={!values.division}
          onChange={event => {
            onChange({
              division: values.division,
              district: event.target.value,
              upazila: '',
            })
          }}
        >
          <option value="">Select district</option>
          {districts.map(option => (
            <option key={option.slug} value={option.name_en}>
              {option.name_en}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="label-md text-secondary">Thana / Upazila</span>
        <select
          className={selectClass}
          aria-label="Thana"
          data-testid="shipping-upazila-select"
          value={values.upazila}
          disabled={!values.district}
          onChange={event => {
            onChange({
              division: values.division,
              district: values.district,
              upazila: event.target.value,
            })
          }}
        >
          <option value="">Select thana</option>
          {upazilas.map(option => (
            <option key={option.slug} value={option.name_en}>
              {option.name_en}
            </option>
          ))}
        </select>
      </label>
      <input
        type="hidden"
        name="shipping_address.province"
        value={labelFor(divisions, values.division)}
        readOnly
      />
      <input
        type="hidden"
        name="shipping_address.city"
        value={labelFor(districts, values.district)}
        readOnly
      />
      <input
        type="hidden"
        name="shipping_address.metadata"
        value={JSON.stringify({
          division: labelFor(divisions, values.division),
          district: labelFor(districts, values.district),
          thana: labelFor(upazilas, values.upazila),
        })}
        readOnly
      />
    </div>
  )
}
