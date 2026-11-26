import { ProfileIcon } from "@/icons"
import { HttpTypes } from "@medusajs/types"

export const UserPanelIdentity = ({
  user,
  points,
}: {
  user: HttpTypes.StoreCustomer | null
  points: number
}) => {
  if (!user) return null

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ")

  return (
    <div
      className="flex items-center gap-3"
      data-testid="user-panel-identity"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--brand-25))]">
        <ProfileIcon size={24} color="rgb(var(--brand-500))" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-primary">
            {name || "Your account"}
          </p>
          <span className="rounded-full bg-[rgb(var(--brand-25))] px-2 py-0.5 text-[11px] font-medium text-[rgb(var(--brand-600))]">
            {points} Points
          </span>
        </div>
        <p className="truncate text-xs text-secondary">{user.email}</p>
      </div>
    </div>
  )
}
