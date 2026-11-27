import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { LoginForm } from '@/components/molecules/LoginForm/LoginForm';
import { ProfileDetails } from '@/components/molecules/ProfileDetails/ProfileDetails';
import { UserSidebar } from '@/components/molecules/UserSidebar/UserSidebar';
import { ProfilePassword } from "@/components/molecules/ProfileDetails/ProfilePassword"
import { retrieveCustomer } from "@/lib/data/customer"

export default function ReviewsPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <ReviewsPageContent />
    </Suspense>
  )
}

async function ReviewsPageContent() {
  const user = await retrieveCustomer()

  if (!user) return <LoginForm />

  return (
    <main className="container" data-testid="profile-settings-page">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserSidebar />
        <div className="md:col-span-3" data-testid="profile-settings-container">
          <div className="mb-8 flex items-center gap-3">
            <h1 className="heading-md uppercase">Settings</h1>
          </div>
          <ProfileDetails user={user} />
          <ProfilePassword user={user} />
        </div>
      </div>
    </main>
  )
}
