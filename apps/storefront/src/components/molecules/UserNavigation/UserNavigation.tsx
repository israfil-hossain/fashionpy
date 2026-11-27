"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState, type ComponentType } from "react"

import {
  BellIcon,
  DiscountIcon,
  HeadphoneIcon,
  HeartIcon,
  LocationIcon,
  LogoutIcon,
  MessageIcon,
  OrderIcon,
  ProfileIcon,
  SettingsIcon,
} from "@/icons"

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

type NavigationIcon = ComponentType<{
  size?: number
  color?: string
  className?: string
}>

const navigationItems: Array<{
  label: string
  href: string
  icon: NavigationIcon
}> = [
  { label: "My Orders", href: "/user/orders", icon: OrderIcon },
  { label: "My Wishlist", href: "/user/wishlist", icon: HeartIcon },
  { label: "Vouchers", href: "/user/vouchers", icon: DiscountIcon },
  { label: "My Addresses", href: "/user/addresses", icon: LocationIcon },
  {
    label: "Account Information",
    href: "/user/settings#account-information",
    icon: ProfileIcon,
  },
  { label: "Settings", href: "/user/settings", icon: SettingsIcon },
  { label: "Notifications", href: "/user/notifications", icon: BellIcon },
  { label: "Messages", href: "/user/messages", icon: MessageIcon },
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
          <span className="flex items-center gap-3">
            <item.icon size={18} color="currentColor" />
            {item.label}
          </span>
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
        className="label-md my-3 flex w-full items-center gap-3 px-4 py-3 uppercase disabled:opacity-60 md:my-0"
        data-testid="user-navigation-helpline"
      >
        <HeadphoneIcon size={18} color="currentColor" />
        FashionPy Helpline
      </button>
      <Divider className="my-2" />
      <LogoutButton className="flex w-full items-center gap-3 px-4 text-left">
        <LogoutIcon size={18} color="currentColor" />
        Logout
      </LogoutButton>
    </Card>
  )
}
