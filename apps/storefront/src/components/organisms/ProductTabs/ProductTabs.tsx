"use client"

import { useEffect, useRef, useState } from "react"
import { TabsTrigger } from "@/components/atoms/TabsTrigger/TabsTrigger"
import { cn } from "@/lib/utils"

type TabKey = "about" | "delivery"

const DELIVERY_HASH = "product-delivery-tab"
const ABOUT_HASH = "product-details-section"

/**
 * In-page About / Delivery tabs for the PDP. The description and delivery
 * teasers deep-link here: the hash selects the tab and the matching section is
 * scrolled into view below the sticky header.
 */
export const ProductTabs = ({
  about,
  delivery,
}: {
  about: React.ReactNode
  delivery: React.ReactNode
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("about")
  const [scrollSignal, setScrollSignal] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash
      if (hash === `#${DELIVERY_HASH}`) {
        setActiveTab("delivery")
      } else if (hash === `#${ABOUT_HASH}`) {
        setActiveTab("about")
      } else {
        return
      }
      setScrollSignal(signal => signal + 1)
    }

    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [])

  useEffect(() => {
    if (!scrollSignal) return

    const frame = window.requestAnimationFrame(() => {
      const target =
        activeTab === "delivery"
          ? rootRef.current
          : document.getElementById(ABOUT_HASH)
      target?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, scrollSignal])

  return (
    <div
      ref={rootRef}
      className="scroll-mt-24 lg:scroll-mt-[180px]"
      data-testid="product-tabs"
    >
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
