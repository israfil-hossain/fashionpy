import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { isEmpty } from 'lodash';

import { LoginForm } from '@/components/molecules/LoginForm/LoginForm';
import { ParcelAccordion } from '@/components/molecules/ParcelAccordion/ParcelAccordion';
import { UserSidebar } from '@/components/molecules/UserSidebar/UserSidebar';
import { OrderTabs } from '@/components/molecules/OrderTabs/OrderTabs';
import { OrdersPagination } from '@/components/organisms/OrdersPagination/OrdersPagination';
import { retrieveCustomer } from '@/lib/data/customer';
import { getReturns, listOrderGroups } from '@/lib/data/orders';
import { matchesOrderTab, ORDER_TABS, type OrderForTab, type OrderStageRecord, type OrderTabKey } from '@/lib/helpers/order-tabs';

const LIMIT = 10;

export default function UserPage(props: {
  searchParams: Promise<{ page: string; tab?: string }>;
}) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <UserPageContent {...props} />
    </Suspense>
  )
}

async function UserPageContent({
  searchParams
}: {
  searchParams: Promise<{ page: string; tab?: string }>;
}) {
  const user = await retrieveCustomer();

  if (!user) return <LoginForm />;

  const { page, tab } = await searchParams;
  const currentPage = +page || 1;
  const offset = (+currentPage - 1) * LIMIT;
  const activeTab: OrderTabKey = ORDER_TABS.some(item => item.key === tab)
    ? (tab as OrderTabKey)
    : "all";

  const [{ groups: allGroups }, returns] = await Promise.all([
    listOrderGroups(100, 0),
    getReturns().catch(() => ({ order_return_requests: [] })),
  ]);

  const stages: Record<string, OrderStageRecord> = {};
  for (const record of returns.order_return_requests ?? []) {
    const orderId =
      typeof record.order_id === "string"
        ? record.order_id
        : typeof record.order === "string"
        ? record.order
        : null;
    if (orderId) stages[orderId] = record as OrderStageRecord;
  }

  const filteredGroups = allGroups.filter(group => {
    const order = (group.orders?.[0] ?? {}) as OrderForTab;
    const stage = Object.values(stages).find(
      record => record.order_id === group.id
    );
    return matchesOrderTab(order, activeTab, stage);
  });

  const count = filteredGroups.length;
  const pages = Math.ceil(count / LIMIT) || 1;
  const processedOrders = filteredGroups.slice(offset, offset + LIMIT);

  return (
    <main
      className="container"
      data-testid="orders-page"
    >
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-8">
        <UserSidebar />
        <div
          className="space-y-8 md:col-span-3"
          data-testid="orders-container"
        >
          <div className="flex items-center gap-3">
            <h1 className="heading-md uppercase">My Orders</h1>
          </div>
          <OrderTabs active={activeTab} />
          {isEmpty(filteredGroups) ? (
            <div
              className="text-center"
              data-testid="orders-empty-state"
            >
              <h3
                className="heading-lg uppercase text-primary"
                data-testid="no-orders-heading"
              >
                No orders
              </h3>
              <p
                className="mt-2 text-lg text-secondary"
                data-testid="no-orders-description"
              >
                You haven&apos;t placed any order yet. Once you place an order, it will appear here.
              </p>
            </div>
          ) : (
            <>
              <div
                className="w-full max-w-full"
                data-testid="orders-list"
              >
                {processedOrders.map(orderGroup => (
                  <ParcelAccordion
                    key={orderGroup.id}
                    orderId={orderGroup.id}
                    orderDisplayId={`#${orderGroup.display_id}`}
                    createdAt={orderGroup.created_at}
                    total={Number(orderGroup.total) || 0}
                    orders={orderGroup.orders || []}
                    currency_code={
                      typeof orderGroup.orders[0]?.currency_code === 'string'
                        ? orderGroup.orders[0].currency_code
                        : 'bdt'
                    }
                  />
                ))}
              </div>
              <OrdersPagination pages={pages} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
