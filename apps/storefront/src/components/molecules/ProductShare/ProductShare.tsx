"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { CopyIcon, ShareIcon } from "@/icons"

const WhatsAppGlyph = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
)

const MessengerGlyph = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.99-.88c.17-.07.35-.09.52-.04.91.25 1.88.38 2.9.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2Zm6 7.46-2.94 4.66c-.47.74-1.47.93-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.47-.74 1.47-.93 2.17-.4l2.34 1.75c.21.16.5.16.72 0l3.16-2.4c.42-.32.97.18.69.63Z" />
  </svg>
)

const ACTIONS = [
  { id: "copy", label: "Copy link" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "messenger", label: "Messenger" },
] as const

/**
 * PDP share row: copy the product link, or open WhatsApp / Messenger
 * share dialogs pre-filled with the product title + URL.
 */
export const ProductShare = ({ title }: { title: string }) => {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState("")

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const shareText = `${title} ${url}`

  const handleAction = async (id: (typeof ACTIONS)[number]["id"]) => {
    if (id === "copy") {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
      } catch {
        // Clipboard unavailable (insecure context) — ignore silently
      }
      return
    }
    const target =
      id === "whatsapp"
        ? `https://wa.me/?text=${encodeURIComponent(shareText)}`
        : `https://www.messenger.com/share/?link=${encodeURIComponent(url)}`
    window.open(target, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      className="flex items-center gap-3"
      data-testid="product-share"
    >
      <span className="label-md text-secondary flex items-center gap-1.5">
        <ShareIcon size={16} />
        Share
      </span>
      <div className="flex items-center gap-1">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleAction(action.id)}
            aria-label={action.label}
            title={action.label}
            className={cn(
              "flex items-center gap-1.5 rounded-xs border border-tertiary px-2 py-1.5 label-sm text-primary transition-colors hover:bg-component-secondary",
              action.id === "copy" && copied && "text-positive-on-primary border-positive"
            )}
            data-testid={`share-${action.id}`}
          >
            {action.id === "copy" ? (
              <CopyIcon size={14} />
            ) : action.id === "whatsapp" ? (
              <WhatsAppGlyph size={14} />
            ) : (
              <MessengerGlyph size={14} />
            )}
            <span>{action.id === "copy" && copied ? "Copied!" : action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
