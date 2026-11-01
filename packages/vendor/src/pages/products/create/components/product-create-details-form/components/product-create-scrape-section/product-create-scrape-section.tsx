import { useState } from "react"
import { Button, Input, Text, toast } from "@medusajs/ui"
import { MagnifyingGlass } from "@medusajs/icons"
import { useTranslation } from "react-i18next"

import { useTabbedForm } from "@components/tabbed-form/tabbed-form"
import { useScrapeProduct } from "@hooks/api"
import { ProductCreateSchemaType } from "../../../../types"
import { applyScrapedDraft } from "../../../../utils"

const formatPrice = (price?: { amount: number; currency_code: string }) =>
  price ? `${price.amount} ${price.currency_code}` : null

export const ProductCreateScrapeSection = () => {
  const { t } = useTranslation()
  const form = useTabbedForm<ProductCreateSchemaType>()
  const scrape = useScrapeProduct()
  const [url, setUrl] = useState("")

  const handleScrape = async () => {
    const target = url.trim()
    if (!target) return

    try {
      const { product } = await scrape.mutateAsync({ url: target })
      applyScrapedDraft(form, product)

      const price = formatPrice(product.reference_price)
      const sizes = product.option_axes.find(
        (axis) => axis.title.toLowerCase() === "size"
      )?.values

      toast.success(
        t("products.create.scrape.success", { title: product.title ?? target }),
        {
          description:
            [
              price ? t("products.create.scrape.priceInfo", { price }) : null,
              product.images.length
                ? t("products.create.scrape.imagesInfo", {
                    count: product.images.length,
                  })
                : null,
              sizes?.length
                ? t("products.create.scrape.sizesInfo", {
                    sizes: sizes.join(", "),
                  })
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || undefined,
        }
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("products.create.scrape.failed")
      )
    }
  }

  return (
    <div
      className="flex flex-col gap-y-2 rounded-lg border border-dashed border-ui-border-base p-4"
      data-testid="product-create-scrape-section"
    >
      <div className="flex flex-col gap-y-1">
        <Text size="small" weight="plus" data-testid="product-create-scrape-label">
          {t("products.create.scrape.label")}
        </Text>
        <Text
          size="xsmall"
          className="text-ui-fg-subtle"
          data-testid="product-create-scrape-hint"
        >
          {t("products.create.scrape.hint")}
        </Text>
      </div>
      <div className="flex items-center gap-x-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("products.create.scrape.placeholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleScrape()
            }
          }}
          data-testid="product-create-scrape-input"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleScrape}
          isLoading={scrape.isPending}
          disabled={!url.trim()}
          data-testid="product-create-scrape-button"
        >
          <MagnifyingGlass />
          {t("products.create.scrape.fetch")}
        </Button>
      </div>
      <Text size="xsmall" className="text-ui-fg-subtle">
        {t("products.create.scrape.priceNote")}
      </Text>
    </div>
  )
}
