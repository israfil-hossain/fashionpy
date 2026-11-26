import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { ProfileDetails } from "@/components/molecules/ProfileDetails/ProfileDetails"
import { ProfilePassword } from "@/components/molecules/ProfileDetails/ProfilePassword"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { UserPanelBell } from "@/components/molecules/UserPanelBell/UserPanelBell"
import { retrieveCustomer } from "@/lib/data/customer"

export default function ProfilePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <ProfilePageContent />
    </Suspense>
  )
}

async function ProfilePageContent() {
  const user = await retrieveCustomer()

  if (!user) return <LoginForm />

  return (
    <main className="container" data-testid="user-profile-page">
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3" data-testid="user-profile-container">
          <div className="mb-8 flex items-center gap-3">
            <UserPanelBell />
            <h1 className="heading-md uppercase">Profile</h1>
          </div>
          <ProfileDetails user={user} />
          <ProfilePassword user={user} />
        </div>
      </div>
    </main>
  )
}
