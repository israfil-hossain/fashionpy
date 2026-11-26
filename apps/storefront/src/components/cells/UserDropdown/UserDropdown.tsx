"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { HttpTypes } from "@medusajs/types"

import { Badge } from "@/components/atoms/Badge/Badge"
import { Divider } from "@/components/atoms/Divider/Divider"
import { LogoutButton } from "@/components/atoms/LogoutButton/LogoutButton"
import { NavigationItem } from "@/components/atoms/NavigationItem/NavigationItem"
import { Dropdown } from "@/components/molecules/Dropdown/Dropdown"
import { NotificationsButton } from "@/components/molecules/NotificationsButton/NotificationsButton"
import { ProfileIcon } from "@/icons"
import { useDismissOnOutside } from "@/hooks/useDismissOnOutside"
import { startOrderConversation } from "@/lib/data/messages"
import { useMessagesUnread } from "@/lib/hooks/useMessagesUnread"
import { toast } from "@/lib/helpers/toast"

export const UserDropdown = ({
  isLoggedIn,
  user,
  points = 0,
  iconColor,
  label,
}: {
  isLoggedIn: boolean
  user?: HttpTypes.StoreCustomer | null
  points?: number
  iconColor?: string
  label?: string
}) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [openingSupport, setOpeningSupport] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useDismissOnOutside(containerRef, open, () => setOpen(false))

  const unreadCount = useMessagesUnread()
  const name = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  const displayName = name || "Your account"

  const openHelpline = async () => {
    if (openingSupport) return
    setOpeningSupport(true)
    const result = await startOrderConversation({ mode: "support" })
    setOpeningSupport(false)

    if (result.success && result.conversationId) {
      setOpen(false)
      router.push(`/user/messages?c=${result.conversationId}`)
    } else {
      toast.error({
        title: "Helpline unavailable",
        description: result.message || "Please try again in a moment.",
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onFocus={(event) => {
        if (!(event.target as HTMLElement).closest("[data-dropdown-toggle]")) {
          setOpen(true)
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        className="flex flex-col items-center gap-1"
        aria-label="Open profile menu"
        aria-expanded={open}
        data-dropdown-toggle=""
        data-testid="user-dropdown-toggle"
        onClick={() => setOpen((value) => !value)}
      >
        <ProfileIcon size={20} color={iconColor} />
        {label && (
          <span className="hidden text-[11px] font-medium lg:block">
            {label}
          </span>
        )}
      </button>

      <Dropdown show={open}>
        {isLoggedIn ? (
          <div className="w-[260px] p-1">
            <div
              className="flex items-start gap-3 border-b px-4 py-4"
              data-testid="user-dropdown-identity"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--brand-25))]">
                <ProfileIcon size={22} color="rgb(var(--brand-500))" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary">
                  {displayName}
                </p>
                <p className="truncate text-xs text-secondary">
                  {user?.email}
                </p>
                <span
                  className="mt-1 inline-flex items-center gap-1 rounded-full bg-[rgb(var(--brand-25))] px-2 py-0.5 text-[11px] font-medium text-[rgb(var(--brand-600))]"
                  data-testid="user-dropdown-points"
                >
                  {points} Points
                </span>
              </div>
              <NotificationsButton iconColor="rgb(var(--brand-500))" />
            </div>

            <NavigationItem href="/user/orders">My Orders</NavigationItem>
            <NavigationItem href="/user/wishlist">My Wishlist</NavigationItem>
            <NavigationItem href="/user/vouchers">Vouchers</NavigationItem>
            <NavigationItem href="/user/addresses">
              My Addresses
            </NavigationItem>
            <NavigationItem href="/user/settings#account-information">
              Account Information
            </NavigationItem>
            <NavigationItem href="/user/settings">Settings</NavigationItem>
            <NavigationItem href="/user/messages" className="relative">
              Messages
              {unreadCount > 0 && (
                <Badge className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 p-0">
                  {unreadCount}
                </Badge>
              )}
            </NavigationItem>
            <button
              type="button"
              onClick={() => void openHelpline()}
              disabled={openingSupport}
              className="label-md my-3 flex w-full items-center justify-between px-4 py-3 uppercase disabled:opacity-60 md:my-0"
              data-testid="user-dropdown-helpline"
            >
              FashionPy Helpline
            </button>
            <Divider />
            <LogoutButton />
          </div>
        ) : (
          <div className="w-[200px] p-1">
            <NavigationItem href="/login">Login</NavigationItem>
            <NavigationItem href="/register">Register</NavigationItem>
          </div>
        )}
      </Dropdown>
    </div>
  )
}
