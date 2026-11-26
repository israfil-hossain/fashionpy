import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { UserNavigation } from '@/components/molecules/UserNavigation/UserNavigation';
import { UserPanelBell } from '@/components/molecules/UserPanelBell/UserPanelBell';
import { UserPanelIdentity } from '@/components/molecules/UserPanelIdentity/UserPanelIdentity';
import { retrieveCustomer } from "@/lib/data/customer"
import { getLoyaltySummary } from "@/lib/data/rewards"
import { redirect } from "next/navigation"

export default function UserPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <UserPageContent />
    </Suspense>
  )
}

async function UserPageContent() {
  const user = await retrieveCustomer()

  if (!user) {
    redirect("/login")
  }

  const { available_points } = await getLoyaltySummary()

  return (
    <main className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <UserPanelIdentity user={user} points={available_points} />
            <UserPanelBell />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <h1 className="heading-xl uppercase">Welcome {user.first_name}</h1>
          </div>
          <p className="label-md">Your account is ready to go!</p>
        </div>
      </div>
    </main>
  )
}
