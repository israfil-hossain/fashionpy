import { LoginForm } from "@/components/molecules"
import { UserSidebar } from "@/components/molecules/UserSidebar/UserSidebar"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { Button } from "@/components/atoms"
import { retrieveCustomer } from "@/lib/data/customer"
import {
  getLoyaltySummary,
  getLoyaltyTransactions,
} from "@/lib/data/rewards"

export default async function VouchersPage() {
  const user = await retrieveCustomer()

  if (!user) return <LoginForm />

  const [{ account, available_points }, transactions] = await Promise.all([
    getLoyaltySummary(),
    getLoyaltyTransactions(),
  ])

  return (
    <main className="container" data-testid="vouchers-page">
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-8">
        <UserSidebar />
        <div className="space-y-6 md:col-span-3">
          <div className="flex items-center gap-3">
            <h1 className="heading-md uppercase">Vouchers &amp; Points</h1>
          </div>

          <section
            className="rounded-sm border p-5"
            data-testid="points-balance"
          >
            <p className="label-md text-secondary">Available points</p>
            <p className="mt-1 text-3xl font-bold text-primary">
              {available_points}
            </p>
            <p className="mt-2 label-sm text-secondary">
              Earn 5 points for every 100 BDT spent. 100 points = 10 BDT off,
              capped at 10% of your order subtotal.
            </p>
            <LocalizedClientLink href="/cart" className="mt-4 inline-block">
              <Button>Use points at checkout</Button>
            </LocalizedClientLink>
          </section>

          <section data-testid="points-transactions">
            <h2 className="heading-sm uppercase">Points history</h2>
            <div className="mt-3 divide-y rounded-sm border">
              {transactions.length ? (
                transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div>
                      <p className="label-md uppercase text-primary">
                        {transaction.type}
                      </p>
                      <p className="label-sm text-secondary">
                        {transaction.status}
                      </p>
                    </div>
                    <p
                      className={`label-md font-medium ${
                        transaction.points_delta >= 0
                          ? "text-positive"
                          : "text-negative"
                      }`}
                    >
                      {transaction.points_delta > 0 ? "+" : ""}
                      {transaction.points_delta}
                    </p>
                  </div>
                ))
              ) : (
                <p className="px-4 py-6 text-center label-md text-secondary">
                  No points activity yet.
                </p>
              )}
            </div>
          </section>

          {account?.status === "suspended" && (
            <p className="label-sm text-negative">
              Your points account is currently suspended.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
