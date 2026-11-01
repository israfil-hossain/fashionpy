import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"

import { fanOutNotification } from "@mercurjs/core/utils/fan-out-notification"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../helpers/create-admin-user"
import { createCustomerUser } from "../../helpers/create-customer-user"
import { createSellerUser } from "../../helpers/create-seller-user"

jest.setTimeout(300000)

const seedAdminNotification = async (
  container: MedusaContainer,
  overrides: Record<string, unknown> = {}
) => {
  const service = container.resolve(MercurModules.NOTIFICATION_FEED)
  const [notification] = await service.createNotificationFeeds([
    {
      recipient_type: "admin",
      recipient_id: "user_missing",
      event: "seller.created",
      title: "New seller awaiting approval",
      body: "A new seller registered and is waiting for review.",
      link: "/stores/sel_missing",
      resource_type: "seller",
      resource_id: "sel_missing",
      ...overrides,
    },
  ])
  return notification
}

const seedVendorNotification = async (
  container: MedusaContainer,
  sellerId: string,
  memberId: string,
  overrides: Record<string, unknown> = {}
) => {
  const service = container.resolve(MercurModules.NOTIFICATION_FEED)
  const [notification] = await service.createNotificationFeeds([
    {
      recipient_type: "vendor",
      recipient_id: memberId,
      seller_id: sellerId,
      event: "order.placed",
      title: "New order received",
      body: "Order #1001 was placed for your store.",
      link: "/orders/ord_1",
      ...overrides,
    },
  ])
  return notification
}

const seedCustomerNotification = async (
  container: MedusaContainer,
  customerId: string,
  overrides: Record<string, unknown> = {}
) => {
  const service = container.resolve(MercurModules.NOTIFICATION_FEED)
  const [notification] = await service.createNotificationFeeds([
    {
      recipient_type: "customer",
      recipient_id: customerId,
      event: "order_group.created",
      title: "Order confirmed",
      body: "Your order #1001 has been placed.",
      link: "/user/orders/og_1",
      ...overrides,
    },
  ])
  return notification
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    let appContainer: MedusaContainer

    beforeAll(async () => {
      appContainer = getContainer()
    })

    describe("Admin - Notifications", () => {
      let adminUser: { id: string }

      beforeEach(async () => {
        const { user } = await createAdminUser(dbConnection, adminHeaders, appContainer)
        adminUser = user
      })

      describe("GET /admin/notifications", () => {
        it("lists the operator's notifications with an unread count", async () => {
          await seedAdminNotification(appContainer, {
            recipient_id: adminUser.id,
          })

          const response = await api.get("/admin/notifications", adminHeaders)

          expect(response.status).toEqual(200)
          expect(response.data.notifications).toHaveLength(1)
          expect(response.data.notifications[0].title).toEqual(
            "New seller awaiting approval"
          )
          expect(response.data.unread_count).toEqual(1)
        })

        it("does not return other users' notifications", async () => {
          await seedAdminNotification(appContainer, {
            recipient_id: "user_other",
          })

          const response = await api.get("/admin/notifications", adminHeaders)

          expect(response.status).toEqual(200)
          expect(response.data.notifications).toHaveLength(0)
          expect(response.data.unread_count).toEqual(0)
        })

        it("orders by created_at descending", async () => {
          await seedAdminNotification(appContainer, {
            recipient_id: adminUser.id,
            title: "Older",
            created_at: new Date(Date.now() - 60_000),
          })
          await seedAdminNotification(appContainer, {
            recipient_id: adminUser.id,
            title: "Newer",
          })

          const response = await api.get("/admin/notifications", adminHeaders)

          expect(response.data.notifications[0].title).toEqual("Newer")
        })
      })

      describe("POST /admin/notifications/:id/read", () => {
        it("marks a single notification read", async () => {
          const notification = await seedAdminNotification(appContainer, {
            recipient_id: adminUser.id,
          })

          const response = await api.post(
            `/admin/notifications/${notification.id}/read`,
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.notification.read_at).not.toBeNull()

          const list = await api.get("/admin/notifications", adminHeaders)
          expect(list.data.unread_count).toEqual(0)
        })

        it("returns 404 for another user's notification", async () => {
          const foreign = await seedAdminNotification(appContainer, {
            recipient_id: "user_other",
          })

          const response = await api
            .post(`/admin/notifications/${foreign.id}/read`, {}, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /admin/notifications/read-all", () => {
        it("marks every unread notification read", async () => {
          await seedAdminNotification(appContainer, {
            recipient_id: adminUser.id,
          })
          await seedAdminNotification(appContainer, {
            recipient_id: adminUser.id,
          })

          const response = await api.post(
            "/admin/notifications/read-all",
            {},
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(2)

          const list = await api.get("/admin/notifications", adminHeaders)
          expect(list.data.unread_count).toEqual(0)
        })
      })
    })

    describe("Vendor - Notifications", () => {
      let seller: { id: string }
      let member: { id: string }
      let headers: { headers: Record<string, string> }

      beforeEach(async () => {
        const result = await createSellerUser(appContainer, {
          email: "notify-vendor@test.com",
          name: "Notify Store",
        })
        seller = result.seller
        member = result.member
        headers = result.headers
      })

      describe("GET /vendor/notifications", () => {
        it("lists the member's notifications for the active store", async () => {
          await seedVendorNotification(appContainer, seller.id, member.id)

          const response = await api.get("/vendor/notifications", headers)

          expect(response.status).toEqual(200)
          expect(response.data.notifications).toHaveLength(1)
          expect(response.data.notifications[0].title).toEqual(
            "New order received"
          )
          expect(response.data.unread_count).toEqual(1)
        })

        it("excludes rows that belong to a different store", async () => {
          await seedVendorNotification(
            appContainer,
            "sel_other_store",
            member.id
          )

          const response = await api.get("/vendor/notifications", headers)

          expect(response.status).toEqual(200)
          expect(response.data.notifications).toHaveLength(0)
          expect(response.data.unread_count).toEqual(0)
        })

        it("excludes rows addressed to a different member", async () => {
          await seedVendorNotification(appContainer, seller.id, "mem_other")

          const response = await api.get("/vendor/notifications", headers)

          expect(response.status).toEqual(200)
          expect(response.data.notifications).toHaveLength(0)
        })
      })

      describe("fan-out", () => {
        it("creates one row per active member of the seller", async () => {
          await fanOutNotification(appContainer, {
            audience: "vendor",
            seller_id: seller.id,
            event: "seller.approved",
            title: "Your store is live",
            link: "/settings",
          })

          const service = appContainer.resolve(MercurModules.NOTIFICATION_FEED)
          const rows = await service.listNotificationFeeds({
            recipient_type: "vendor",
            seller_id: seller.id,
          })

          expect(rows).toHaveLength(1)
          expect(rows[0].recipient_id).toEqual(member.id)
          expect(rows[0].event).toEqual("seller.approved")
        })

        it("skips vendors without a seller id", async () => {
          await fanOutNotification(appContainer, {
            audience: "vendor",
            event: "seller.approved",
            title: "Your store is live",
          })

          const service = appContainer.resolve(MercurModules.NOTIFICATION_FEED)
          const rows = await service.listNotificationFeeds({
            event: "seller.approved",
          })

          expect(rows).toHaveLength(0)
        })
      })

      describe("read state", () => {
        it("marks one notification read without touching the others", async () => {
          const first = await seedVendorNotification(
            appContainer,
            seller.id,
            member.id,
            { title: "First" }
          )
          await seedVendorNotification(appContainer, seller.id, member.id, {
            title: "Second",
          })

          const markResponse = await api.post(
            `/vendor/notifications/${first.id}/read`,
            {},
            headers
          )
          expect(markResponse.status).toEqual(200)
          expect(markResponse.data.notification.read_at).not.toBeNull()

          const list = await api.get("/vendor/notifications", headers)
          expect(list.data.unread_count).toEqual(1)
          const firstRow = list.data.notifications.find(
            (n: { id: string }) => n.id === first.id
          )
          expect(firstRow.read_at).not.toBeNull()
        })

        it("returns 404 when marking another seller's notification read", async () => {
          const foreign = await seedVendorNotification(
            appContainer,
            "sel_foreign",
            member.id
          ) as { id: string }

          const response = await api
            .post(`/vendor/notifications/${foreign.id}/read`, {}, headers)
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })

        it("marks all notifications read", async () => {
          await seedVendorNotification(appContainer, seller.id, member.id)
          await seedVendorNotification(appContainer, seller.id, member.id)

          const response = await api.post(
            "/vendor/notifications/read-all",
            {},
            headers
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(2)

          const list = await api.get("/vendor/notifications", headers)
          expect(list.data.unread_count).toEqual(0)
        })
      })
    })

    describe("Store - Notifications", () => {
      let customerId: string
      let storeHeaders: { headers: Record<string, string> }

      beforeEach(async () => {
        const customerResult = await createCustomerUser(appContainer, {
          email: "notify-customer@test.com",
          first_name: "Notify",
          last_name: "Customer",
        })
        customerId = customerResult.customer.id

        const publishableKey = await generatePublishableKey(appContainer)
        const baseStoreHeaders = generateStoreHeaders({ publishableKey })
        storeHeaders = {
          headers: {
            ...baseStoreHeaders.headers,
            ...customerResult.headers.headers,
          },
        }
      })

      describe("GET /store/notifications", () => {
        it("requires authentication", async () => {
          const publishableKey = await generatePublishableKey(appContainer)
          const anonymous = generateStoreHeaders({ publishableKey })

          const response = await api
            .get("/store/notifications", anonymous)
            .catch((e) => e.response)

          expect(response.status).toEqual(401)
        })

        it("lists the customer's notifications with an unread count", async () => {
          await seedCustomerNotification(appContainer, customerId)

          const response = await api.get("/store/notifications", storeHeaders)

          expect(response.status).toEqual(200)
          expect(response.data.notifications).toHaveLength(1)
          expect(response.data.notifications[0].title).toEqual(
            "Order confirmed"
          )
          expect(response.data.unread_count).toEqual(1)
        })

        it("does not return other customers' notifications", async () => {
          await seedCustomerNotification(appContainer, "cus_other")

          const response = await api.get("/store/notifications", storeHeaders)

          expect(response.status).toEqual(200)
          expect(response.data.notifications).toHaveLength(0)
          expect(response.data.unread_count).toEqual(0)
        })
      })

      describe("read state", () => {
        it("marks one notification read", async () => {
          const notification = (await seedCustomerNotification(
            appContainer,
            customerId
          )) as { id: string }

          const response = await api.post(
            `/store/notifications/${notification.id}/read`,
            {},
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.notification.read_at).not.toBeNull()

          const list = await api.get("/store/notifications", storeHeaders)
          expect(list.data.unread_count).toEqual(0)
        })

        it("returns 404 for another customer's notification", async () => {
          const foreign = (await seedCustomerNotification(
            appContainer,
            "cus_other"
          )) as { id: string }

          const response = await api.post(
            `/store/notifications/${foreign.id}/read`,
            {},
            storeHeaders
          )
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })

        it("marks all notifications read", async () => {
          await seedCustomerNotification(appContainer, customerId)
          await seedCustomerNotification(appContainer, customerId)

          const response = await api.post(
            "/store/notifications/read-all",
            {},
            storeHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toEqual(2)

          const list = await api.get("/store/notifications", storeHeaders)
          expect(list.data.unread_count).toEqual(0)
        })
      })
    })
  },
})