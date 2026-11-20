import { UserDropdown } from "@/components/cells/UserDropdown/UserDropdown"
import { CustomerTalkJsProvider } from "@/components/providers/TalkJs/CustomerTalkJsProvider"
import { retrieveCustomer } from "@/lib/data/customer"

export const HeaderAccount = async () => {
  const user = await retrieveCustomer().catch(() => null)
  const isLoggedIn = Boolean(user)

  return (
    <CustomerTalkJsProvider>
      <UserDropdown isLoggedIn={isLoggedIn} />
    </CustomerTalkJsProvider>
  )
}

export const HeaderAccountFallback = () => <UserDropdown isLoggedIn={false} />
