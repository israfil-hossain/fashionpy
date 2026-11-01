'use client'

import { Badge } from "@/components/atoms"
import { MessageIcon } from "@/icons"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"
import { useMessagesUnread } from "@/lib/hooks/useMessagesUnread"

export const MessageButton = ({ iconColor }: { iconColor?: string }) => {
  const unreadCount = useMessagesUnread()

  return (
    <LocalizedClientLink href="/user/messages" className="relative">
      <MessageIcon size={20} color={iconColor} />
      {unreadCount > 0 && (
        <Badge className="absolute -top-2 -right-2 w-4 h-4 p-0">
          {unreadCount}
        </Badge>
      )}
    </LocalizedClientLink>
  )
}
