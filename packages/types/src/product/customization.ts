export const CUSTOMIZATION_METADATA_KEY = "customization"

export type CustomizationFieldType = "text" | "file"

export type CustomizationField = {
  key: string
  label: string
  type: CustomizationFieldType
  required?: boolean
  max_length?: number
  extra_price?: number
}

export type ProductCustomization = {
  enabled: boolean
  fields: CustomizationField[]
}

export type CustomizationValues = Record<
  string,
  string | { url: string; name?: string }
>

export const parseProductCustomization = (
  value: unknown
): ProductCustomization | null => {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  if (record.enabled !== true) return null
  if (!Array.isArray(record.fields)) return null

  const fields: CustomizationField[] = []
  for (const entry of record.fields) {
    if (!entry || typeof entry !== "object") return null
    const field = entry as Record<string, unknown>
    if (
      typeof field.key !== "string" ||
      !field.key ||
      typeof field.label !== "string" ||
      !field.label ||
      (field.type !== "text" && field.type !== "file")
    ) {
      return null
    }
    fields.push({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required === true,
      max_length:
        typeof field.max_length === "number" ? field.max_length : undefined,
      extra_price:
        typeof field.extra_price === "number" ? field.extra_price : undefined,
    })
  }

  return { enabled: true, fields }
}

export const validateCustomizationValues = (
  config: ProductCustomization,
  values: CustomizationValues
): Record<string, string> => {
  const errors: Record<string, string> = {}

  for (const field of config.fields) {
    const value = values[field.key]
    if (field.required) {
      const missing =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "object" && !value.url)
      if (missing) {
        errors[field.key] = `${field.label} is required`
        continue
      }
    }

    if (
      field.type === "text" &&
      typeof value === "string" &&
      field.max_length &&
      value.length > field.max_length
    ) {
      errors[field.key] = `${field.label} must be ${field.max_length} characters or fewer`
    }
  }

  return errors
}

export const customizationExtraPrice = (
  config: ProductCustomization
): number =>
  config.fields.reduce((total, field) => total + (field.extra_price ?? 0), 0)

export const customizationFingerprint = (
  values: CustomizationValues
): string => {
  const entries = Object.keys(values)
    .sort()
    .map(key => {
      const value = values[key]
      if (typeof value === "string") return `${key}:${value}`
      return `${key}:${value?.url ?? ""}`
    })
  return entries.join("|")
}
