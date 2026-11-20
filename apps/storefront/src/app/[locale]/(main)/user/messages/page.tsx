import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { UserPanelBell } from "@/components/molecules/UserPanelBell/UserPanelBell"
import { UserMessagesSection } from "@/components/sections/UserMessagesSection/UserMessagesSection"
import { retrieveCustomer } from "@/lib/data/customer"
import { getMessagingThread, listMessagingConversations } from "@/lib/data/messages"

type MessagesSearchParams = {
  c?: string
  order?: string
}

export default function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<MessagesSearchParams>
}) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <MessagesPageContent searchParams={searchParams} />
    </Suspense>
  )
}

async function MessagesPageContent({
  searchParams,
}: {
  searchParams: Promise<MessagesSearchParams>
}) {
  const user = await retrieveCustomer()

  if (!user) return <LoginForm />

  const params = await searchParams
  const activeId = params.c || undefined
  const orderContextId = params.order || undefined

  const conversations = await listMessagingConversations().catch(() => [])
  const thread = activeId ? await getMessagingThread(activeId) : null

  return (
    <main className="container" data-testid="messages-page">
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-8">
        <UserNavigation />
        <div className="space-y-4 md:col-span-3">
          <div className="flex items-center gap-3">
            <UserPanelBell />
            <h1 className="heading-md uppercase">Messages</h1>
          </div>
          <UserMessagesSection
            conversations={conversations}
            activeId={activeId}
            threadMessages={thread?.messages ?? []}
            orderContextId={orderContextId}
          />
        </div>
      </div>
    </main>
  )
}
