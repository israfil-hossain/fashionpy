"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { ORDER_TABS } from "@/lib/helpers/order-tabs"

export const OrderTabs = ({ active }: { active: string }) => (
  <div
    className="flex gap-5 overflow-x-auto border-b"
    role="tablist"
    aria-label="Order stages"
    data-testid="order-tabs"
  >
    {ORDER_TABS.map(tab => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        aria-selected={active === tab.key}
        onClick={() => {
          const params = new URLSearchParams(window.location.search)
          params.set("tab", tab.key)
          params.delete("page")
          window.history.pushState(null, "", `?${params.toString()}`)
          window.dispatchEvent(new PopStateEvent("popstate"))
        }}
        className={cn(
          "shrink-0 border-b-2 pb-2 text-sm font-medium transition-colors",
          active === tab.key
            ? "border-[rgb(var(--brand-500))] text-primary"
            : "border-transparent text-secondary hover:text-primary"
        )}
        data-testid={`order-tab-${tab.key}`}
      >
        {tab.label}
      </button>
    ))}
  </div>
)
