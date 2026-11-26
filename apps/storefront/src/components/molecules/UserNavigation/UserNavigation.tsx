"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"

import {
  Badge,
  Card,
  Divider,
  LogoutButton,
  NavigationItem,
} from "@/components/atoms"
import { startOrderConversation } from "@/lib/data/messages"
import { toast } from "@/lib/helpers/toast"
import { useMessagesUnread } from "@/lib/hooks/useMessagesUnread"

const navigationItems = [
  { label: "My Orders", href: "/user/orders" },
  { label: "My Wishlist", href: "/user/wishlist" },
  { label: "Vouchers", href: "/user/vouchers" },
  { label: "My Addresses", href: "/user/addresses" },
  { label: "Account Information", href: "/user/settings#account-information" },
  { label: "Settings", href: "/user/settings" },
  { label: "Notifications", href: "/user/notifications" },
  { label: "Messages", href: "/user/messages" },
]

export const UserNavigation = () => {
  const router = useRouter()
  const path = usePathname()
  const unreadCount = useMessagesUnread()
  const [openingSupport, setOpeningSupport] = useState(false)

  const openHelpline = async () => {
    if (openingSupport) return
    setOpeningSupport(true)
    const result = await startOrderConversation({ mode: "support" })
    setOpeningSupport(false)

    if (result.success && result.conversationId) {
      router.push(`/user/messages?c=${result.conversationId}`)
    } else {
      toast.error({
        title: "Helpline unavailable",
        description: result.message || "Please try again in a moment.",
      })
    }
  }

  return (
    <Card className="h-min" data-testid="user-navigation">
      {navigationItems.map((item) => (
        <NavigationItem
          key={item.label}
          href={item.href}
          active={path === item.href}
          className="relative"
        >
          {item.label}
          {item.label === "Messages" && unreadCount > 0 && (
            <Badge className="absolute left-24 top-3 h-4 w-4 p-0">
              {unreadCount}
            </Badge>
          )}
        </NavigationItem>
      ))}
      <button
        type="button"
        onClick={() => void openHelpline()}
        disabled={openingSupport}
        className="label-md my-3 flex w-full items-center justify-between px-4 py-3 uppercase disabled:opacity-60 md:my-0"
        data-testid="user-navigation-helpline"
      >
        FashionPy Helpline
      </button>
      <Divider className="my-2" />
      <LogoutButton className="w-full text-left" />
    </Card>
  )
}
