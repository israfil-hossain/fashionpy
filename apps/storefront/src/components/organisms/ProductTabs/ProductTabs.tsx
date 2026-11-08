"use client"

import { useEffect, useState } from "react"
import { TabsTrigger } from "@/components/atoms/TabsTrigger/TabsTrigger"
import { cn } from "@/lib/utils"

type TabKey = "about" | "delivery"

const DELIVERY_HASH = "product-delivery-tab"

const tabFromHash = (): TabKey =>
  typeof window !== "undefined" && window.location.hash === `#${DELIVERY_HASH}`
    ? "delivery"
    : "about"

/**
 * In-page About / Delivery tabs for the PDP. Local state only — no URL
 * sync (unlike the seller-page TabsList which is route-driven), except
 * `#product-delivery-tab` deep-links (buy-box teaser) which open Delivery.
 */
export const ProductTabs = ({
  about,
  delivery,
}: {
  about: React.ReactNode
  delivery: React.ReactNode
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("about")

  useEffect(() => {
    setActiveTab(tabFromHash())
    const onHash = () => setActiveTab(tabFromHash())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  return (
    <div data-testid="product-tabs">
      <div
        className="flex gap-4 border-b"
        role="tablist"
        aria-label="Product information"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "about"}
          onClick={() => setActiveTab("about")}
          className="cursor-pointer"
          data-testid="product-tab-about"
        >
          <TabsTrigger isActive={activeTab === "about"}>
            About this item
          </TabsTrigger>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "delivery"}
          onClick={() => setActiveTab("delivery")}
          className="cursor-pointer"
          data-testid="product-tab-delivery"
        >
          <TabsTrigger isActive={activeTab === "delivery"}>
            Delivery and returns
          </TabsTrigger>
        </button>
      </div>

      <div
        role="tabpanel"
        className={cn("mt-4", activeTab !== "about" && "hidden")}
        data-testid="product-tab-panel-about"
      >
        {about}
      </div>
      <div
        role="tabpanel"
        className={cn("mt-4", activeTab !== "delivery" && "hidden")}
        id="product-delivery-tab"
        data-testid="product-tab-panel-delivery"
      >
        {delivery}
      </div>
    </div>
  )
}
