import { HttpTypes } from "@medusajs/types"

import {
  collectCategorySubtreeIds,
  listCategories,
} from "@/lib/data/categories"
import { listProducts } from "@/lib/data/products"

import { TabbedProductGridClient } from "./TabbedProductGridClient"

export type ProductGridTab = {
  key: string
  label: string
  products: HttpTypes.StoreProduct[]
}

export const TabbedProductGrid = async ({ locale }: { locale: string }) => {
  const { parentCategories } = await listCategories()

  const forYou = await listProducts({
    countryCode: locale,
    queryParams: { limit: 18, order: "-created_at" },
  })

  const tabs: ProductGridTab[] = [
    { key: "for-you", label: "For You", products: forYou.response.products },
  ]

  const categoryTabs = await Promise.all(
    parentCategories.map(async (category) => {
      const categoryIds = collectCategorySubtreeIds(category)
      const { response } = await listProducts({
        countryCode: locale,
        category_id: categoryIds,
        queryParams: { limit: 18 },
      })
      return {
        key: category.handle,
        label: category.name,
        products: response.products,
      }
    })
  )

  tabs.push(...categoryTabs)

  return <TabbedProductGridClient tabs={tabs} />
}
