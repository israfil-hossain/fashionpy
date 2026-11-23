import { useRef, useState } from "react"
import { Button, Input, Text, toast } from "@medusajs/ui"
import { Sparkles } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"

import { useTabbedForm } from "@components/tabbed-form/tabbed-form"
import { aiQuotaQueryKeys, useAiProductDraft, useAiQuota } from "@hooks/api"
import { sdk } from "@lib/client"
import { ProductCreateSchemaType } from "../../../../types"
import { applyScrapedDraft } from "../../../../utils"

const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/heic"]
const MAX_IMAGE_DIMENSION = 1024

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not decode the image"))
    image.src = src
  })

const readFileAsDataUrl = async (file: File) => {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(image.width, image.height)
    )
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas is unavailable")
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.85)
  } catch {
    // Formats the browser cannot decode (e.g. HEIC) still go through; the
    // server accepts base64 data URLs directly.
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("Could not read the image"))
      reader.readAsDataURL(file)
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

type DraftWithOrganization = Parameters<typeof applyScrapedDraft>[1] & {
  tags?: string[]
  category_names?: string[]
}

export const ProductCreateAiSection = () => {
  const { t } = useTranslation()
  const form = useTabbedForm<ProductCreateSchemaType>()
  const ai = useAiProductDraft()
  const queryClient = useQueryClient()
  const { quota, remaining } = useAiQuota()
  const fileInput = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState("")
  const [uploading, setUploading] = useState(false)

  const applyOrganization = async (
    draft: DraftWithOrganization
  ): Promise<string[]> => {
    const categoryName = draft.category_names?.[0]
    if (categoryName && !form.getValues("category_id")) {
      try {
        const { product_categories } = await sdk.vendor.productCategories.query({
          q: categoryName,
          limit: 10,
        })
        const match =
          (product_categories ?? []).find(
            (category) =>
              category.name?.toLowerCase() === categoryName.toLowerCase()
          ) ?? product_categories?.[0]
        if (match?.id) {
          form.setValue("category_id", match.id, { shouldDirty: true })
        }
      } catch {
        // Category is optional; keep the rest of the draft.
      }
    }

    if (draft.tags?.length) {
      try {
        const { product_tags } = await sdk.vendor.productTags.query({
          limit: 200,
        })
        const byValue = new Map(
          (product_tags ?? []).map(
            (tag) => [tag.value.toLowerCase(), tag.id] as const
          )
        )
        const resolved: string[] = []
        const unmatched: string[] = []
        for (const tag of draft.tags) {
          const id = byValue.get(tag.toLowerCase())
          if (id) {
            resolved.push(id)
          } else {
            unmatched.push(tag)
          }
        }

        if (resolved.length) {
          const existing = form.getValues("tags") ?? []
          form.setValue("tags", [...new Set([...existing, ...resolved])], {
            shouldDirty: true,
          })
        }

        return unmatched
      } catch {
        // Tags are optional; never block the draft on a tag lookup.
        return draft.tags
      }
    }

    return []
  }

  const applyAndAnnounce = async (
    product: DraftWithOrganization,
    quota?: { remaining: number; quota: number }
  ) => {
    applyScrapedDraft(form, product)
    const unmatchedTags = await applyOrganization(product)

    const sizes = product.option_axes.find(
      (axis) => axis.title.toLowerCase() === "size"
    )?.values

    toast.success(
      t("products.create.ai.success", {
        title: product.title || t("products.create.ai.untitled"),
      }),
      {
        description: [
          product.option_axes.length
            ? t("products.create.ai.variantsInfo", {
                count: product.option_axes.reduce(
                  (sum, axis) => sum * axis.values.length,
                  1
                ),
              })
            : null,
          sizes?.length
            ? t("products.create.ai.sizesInfo", { sizes: sizes.join(", ") })
            : null,
          unmatchedTags.length
            ? t("products.create.ai.unmatchedTagsInfo", {
                count: unmatchedTags.length,
                tags: unmatchedTags.join(", "),
              })
            : null,
          quota
            ? t("products.create.ai.quotaInfo", {
                remaining: quota.remaining,
                quota: quota.quota,
              })
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
      }
    )

    void queryClient.invalidateQueries({ queryKey: aiQuotaQueryKeys.all })
  }

  const generate = async (payload: {
    image_urls?: string[]
    image_data_urls?: string[]
    source_url?: string
  }) => {
    try {
      const { product, ai_quota } = await ai.mutateAsync(payload)
      await applyAndAnnounce(product, ai_quota)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("products.create.ai.failed")
      )
    }
  }

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!SUPPORTED_FORMATS.includes(file.type)) {
      toast.error(t("products.create.ai.invalidFile"))
      return
    }

    setUploading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const { product, ai_quota } = await ai.mutateAsync({
        image_data_urls: [dataUrl],
      })
      await applyAndAnnounce(product, ai_quota)

      // Persist the photo only after a draft exists; the model reads the data
      // URL directly so local/private storage URLs never need to be fetched.
      try {
        const uploaded = await sdk.vendor.uploads.mutate({ files: [file] })
        const imageUrl = uploaded.files?.[0]?.url
        if (imageUrl) {
          const existing = (form.getValues("media") ?? []).filter(
            (item) => item.url !== imageUrl
          )
          form.setValue(
            "media",
            [
              { url: imageUrl, isThumbnail: true, file: null },
              ...existing.map((item) => ({ ...item, isThumbnail: false })),
            ],
            { shouldDirty: true }
          )
        }
      } catch {
        toast.error(t("products.create.ai.uploadFailed"))
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("products.create.ai.failed")
      )
    } finally {
      setUploading(false)
    }
  }

  const handleUrl = () => {
    const target = url.trim()
    if (target) {
      void generate({ source_url: target })
    }
  }

  const busy = uploading || ai.isPending

  return (
    <div
      className="flex flex-col gap-y-3 rounded-lg border border-dashed border-ui-border-base bg-ui-bg-subtle p-4"
      data-testid="product-create-ai-section"
    >
      <div className="flex flex-col gap-y-1">
        <Text size="small" weight="plus">
          {t("products.create.ai.label")}
        </Text>
        <Text size="xsmall" className="text-ui-fg-subtle">
          {t("products.create.ai.hint")}
        </Text>
        {typeof quota === "number" && typeof remaining === "number" ? (
          <Text
            size="xsmall"
            className="text-ui-fg-subtle"
            data-testid="product-create-ai-quota"
          >
            {t("products.create.ai.quotaInfo", { remaining, quota })}
          </Text>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept={SUPPORTED_FORMATS.join(",")}
          aria-label={t("products.create.ai.upload")}
          className="hidden"
          onChange={handleFile}
          data-testid="product-create-ai-file-input"
        />
        <Button
          type="button"
          variant="primary"
          isLoading={busy}
          onClick={() => fileInput.current?.click()}
          data-testid="product-create-ai-upload-button"
        >
          <Sparkles />
          {t("products.create.ai.upload")}
        </Button>
        <Text size="xsmall" className="text-ui-fg-subtle">
          {t("products.create.ai.or")}
        </Text>
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={t("products.create.ai.urlPlaceholder")}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              handleUrl()
            }
          }}
          data-testid="product-create-ai-url-input"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleUrl}
          isLoading={busy}
          disabled={!url.trim()}
        >
          {t("products.create.ai.generate")}
        </Button>
      </div>

      <Text size="xsmall" className="text-ui-fg-subtle">
        {t("products.create.ai.note")}
      </Text>
    </div>
  )
}
