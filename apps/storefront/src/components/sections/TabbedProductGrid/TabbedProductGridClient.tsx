"use client"

import { useState } from "react"
import clsx from "clsx"

import { ProductCard } from "@/components/organisms"
import type { ProductGridTab } from "./TabbedProductGrid"

export const TabbedProductGridClient = ({
  tabs,
}: {
  tabs: ProductGridTab[]
}) => {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "")
  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0]

  if (!activeTab) return null

  return (
    <section data-testid="tabbed-product-grid">
      <div className="sticky top-[72px] z-30 pb-2 pt-1 lg:top-[112px]">
        <div
          className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-full border border-gray-200 bg-white p-1.5 shadow-sm"
          role="tablist"
          aria-label="Product categories"
          data-testid="product-grid-tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={tab.key === activeTab.key}
              onClick={() => setActiveKey(tab.key)}
              className={clsx(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm !font-medium transition-colors",
                tab.key === activeTab.key
                  ? "bg-[rgb(var(--brand-500))] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
              data-testid={`product-grid-tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab.products.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-6">
          {activeTab.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              imageAspect="portrait"
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-gray-500">
          No products found here yet.
        </p>
      )}
    </section>
  )
}
