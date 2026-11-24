"use client"

import { Badge } from '@/components/atoms/Badge/Badge';
import { Divider } from '@/components/atoms/Divider/Divider';
import { LogoutButton } from '@/components/atoms/LogoutButton/LogoutButton';
import { NavigationItem } from '@/components/atoms/NavigationItem/NavigationItem';
import { Dropdown } from '@/components/molecules/Dropdown/Dropdown';
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ProfileIcon } from "@/icons"
import { HttpTypes } from "@medusajs/types"
import { useMessagesUnread } from "@/lib/hooks/useMessagesUnread"
import { useState } from "react"

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

  const unreadCount = useMessagesUnread()

  return (
    <div
      className="relative"
      onMouseOver={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
    >
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
                <Badge className="absolute top-3 left-24 w-4 h-4 p-0">
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
