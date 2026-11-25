"use client"

import { Badge } from '@/components/atoms/Badge/Badge';
import { Divider } from '@/components/atoms/Divider/Divider';
import { LogoutButton } from '@/components/atoms/LogoutButton/LogoutButton';
import { NavigationItem } from '@/components/atoms/NavigationItem/NavigationItem';
import { Dropdown } from '@/components/molecules/Dropdown/Dropdown';
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { CollapseIcon, ProfileIcon } from "@/icons"
import { HttpTypes } from "@medusajs/types"
import { useMessagesUnread } from "@/lib/hooks/useMessagesUnread"
import { useDismissOnOutside } from "@/hooks/useDismissOnOutside"
import { useRef, useState } from "react"

export const UserDropdown = ({
  isLoggedIn,
  iconColor,
  label,
}: {
  isLoggedIn: boolean
  iconColor?: string
  label?: string
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useDismissOnOutside(containerRef, open, () => setOpen(false))

  const unreadCount = useMessagesUnread()

  return (
    <div
      ref={containerRef}
      className="relative"
      onPointerOver={(event) => {
        if (
          event.pointerType === "mouse" &&
          !(event.target as HTMLElement).closest("[data-dropdown-toggle]")
        ) {
          setOpen(true)
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          setOpen(false)
        }
      }}
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
      <div className="flex items-center gap-1">
        <LocalizedClientLink
          href={isLoggedIn ? "/user" : "/login"}
          className="flex flex-col items-center gap-1"
          aria-label="Go to user profile"
        >
          <ProfileIcon size={20} color={iconColor} />
          {label && (
            <span className="hidden text-[11px] font-medium lg:block">
              {label}
            </span>
          )}
        </LocalizedClientLink>
        <button
          type="button"
          className="flex h-6 w-5 items-center justify-center sm:hidden"
          aria-label={open ? "Close profile menu" : "Open profile menu"}
          aria-expanded={open}
          data-dropdown-toggle=""
          data-testid="user-dropdown-toggle"
          onClick={(event) => {
            event.preventDefault()
            setOpen((value) => !value)
          }}
        >
          <CollapseIcon
            size={16}
            color={iconColor ?? "currentColor"}
            className={open ? "rotate-180" : ""}
          />
        </button>
      </div>
      <Dropdown show={open}>
        {isLoggedIn ? (
          <div className="p-1">
            <div className="lg:w-[200px]">
              <h3 className="uppercase heading-xs border-b p-4">
                Your account
              </h3>
            </div>
            <NavigationItem href="/user/orders">Orders</NavigationItem>
            <NavigationItem href="/user/messages" className="relative">
              Messages
              {unreadCount > 0 && (
                <Badge className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 p-0">
                  {unreadCount}
                </Badge>
              )}
            </NavigationItem>
            {/* <NavigationItem href="/user/returns">Returns</NavigationItem> */}
            <NavigationItem href="/user/addresses">Addresses</NavigationItem>
            <NavigationItem href="/user/reviews">Reviews</NavigationItem>
            <NavigationItem href="/user/wishlist">Wishlist</NavigationItem>
            <Divider />
            <NavigationItem href="/user/settings">Settings</NavigationItem>
            <LogoutButton />
          </div>
        ) : (
          <div className="p-1">
            <NavigationItem href="/login">Login</NavigationItem>
            <NavigationItem href="/register">Register</NavigationItem>
          </div>
        )}
      </Dropdown>
    </div>
  )
}
