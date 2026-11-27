import { UserPanelBell } from "@/components/molecules/UserPanelBell/UserPanelBell"
import { UserPanelIdentity } from "@/components/molecules/UserPanelIdentity/UserPanelIdentity"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { retrieveCustomer } from "@/lib/data/customer"
import { getLoyaltySummary } from "@/lib/data/rewards"

export const UserSidebar = async () => {
  const user = await retrieveCustomer().catch(() => null)

  if (!user) {
    return <UserNavigation />
  }

  const { available_points } = await getLoyaltySummary()

  return (
    <div className="flex flex-col gap-3" data-testid="user-sidebar">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <UserPanelIdentity user={user} points={available_points} />
        <UserPanelBell />
      </div>
      <UserNavigation />
    </div>
  )
}
