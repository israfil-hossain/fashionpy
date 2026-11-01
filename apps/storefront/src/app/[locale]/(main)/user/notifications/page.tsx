import { LoginForm, UserNavigation } from '@/components/molecules'
import { NotificationsList } from '@/components/molecules/NotificationsList/NotificationsList'
import { retrieveCustomer } from '@/lib/data/customer'
import { listNotifications } from '@/lib/data/notifications'

export default async function NotificationsPage() {
  const user = await retrieveCustomer().catch(() => null)

  if (!user) return <LoginForm />

  let notifications: Awaited<ReturnType<typeof listNotifications>>['notifications'] =
    []
  try {
    const response = await listNotifications({ limit: 50, offset: 0 })
    notifications = response.notifications
  } catch {
    notifications = []
  }

  return (
    <main className="container" data-testid="notifications-page">
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-8">
        <UserNavigation />
        <div className="space-y-6 md:col-span-3">
          <h1 className="heading-lg text-primary uppercase">Notifications</h1>
          <NotificationsList notifications={notifications} />
        </div>
      </div>
    </main>
  )
}
