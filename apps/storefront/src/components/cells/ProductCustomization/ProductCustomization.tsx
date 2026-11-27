"use client"

import { useState } from "react"

import {
  customizationFingerprint,
  parseProductCustomization,
  type CustomizationValues,
} from "@mercurjs/types"

import { uploadCustomizationFile } from "@/lib/data/uploads"

export const ProductCustomization = ({
  metadata,
  values,
  onChange,
  errors,
}: {
  metadata: Record<string, unknown> | null | undefined
  values: CustomizationValues
  onChange: (values: CustomizationValues) => void
  errors?: Record<string, string>
}) => {
  const config = parseProductCustomization(metadata?.customization)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  if (!config) return null

  const handleFile = async (key: string, file?: File) => {
    if (!file) return
    setUploading(key)
    setUploadError(null)
    const result = await uploadCustomizationFile(file)
    setUploading(null)

    if ("error" in result) {
      setUploadError(result.error)
      return
    }
    onChange({ ...values, [key]: { url: result.url, name: file.name } })
  }

  const fingerprint = customizationFingerprint(values)

  return (
    <div
      className="mb-4 flex flex-col gap-3 rounded-sm border p-4"
      data-testid="product-customization"
      data-fingerprint={fingerprint}
    >
      <p className="label-md font-medium text-primary">Product customization</p>

      {config.fields.map(field => (
        <div key={field.key} className="flex flex-col gap-1">
          <label
            htmlFor={`customization-${field.key}`}
            className="label-sm text-secondary"
          >
            {field.label}
            {field.required ? " *" : ""}
            {(field.extra_price ?? 0) > 0
              ? ` (+${field.extra_price} BDT)`
              : ""}
          </label>

          {field.type === "text" ? (
            <textarea
              id={`customization-${field.key}`}
              value={
                typeof values[field.key] === "string"
                  ? (values[field.key] as string)
                  : ""
              }
              maxLength={field.max_length}
              rows={3}
              onChange={event =>
                onChange({ ...values, [field.key]: event.target.value })
              }
              className="w-full rounded-sm border px-3 py-2 label-md"
              data-testid={`customization-input-${field.key}`}
            />
          ) : (
            <>
              <input
                id={`customization-${field.key}`}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={event => void handleFile(field.key, event.target.files?.[0])}
                className="label-sm"
                data-testid={`customization-input-${field.key}`}
              />
              {uploading === field.key && (
                <p className="label-sm text-secondary">Uploading…</p>
              )}
              {typeof values[field.key] === "object" && (
                <a
                  href={(values[field.key] as { url: string }).url}
                  target="_blank"
                  rel="noreferrer"
                  className="label-sm text-action underline"
                >
                  View uploaded file
                </a>
              )}
            </>
          )}

          {errors?.[field.key] && (
            <p className="label-sm text-negative" data-testid={`customization-error-${field.key}`}>
              {errors[field.key]}
            </p>
          )}
        </div>
      ))}

      {uploadError && (
        <p className="label-sm text-negative" data-testid="customization-upload-error">
          {uploadError}
        </p>
      )}
    </div>
  )
}
