import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { markOrderFulfillmentAsDeliveredWorkflow } from "@mercurjs/core/workflows"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import {
  completeSplitOrderCheckout,
  seedSellerOfferWithShipping,
} from "../../../helpers/split-order-checkout"

jest.setTimeout(600000)

// The hook accepts a single handler per workflow — registered once here.
const delivered: { order_id: string; fulfillment_id: string }[] = []
markOrderFulfillmentAsDeliveredWorkflow.hooks.fulfillmentDelivered((input) => {
  delivered.push(input)
})

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - courier status webhooks", () => {
      let appContainer: MedusaContainer
      let sellerSeed: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>
      let storeHeaders: { headers: Record<string, string> }
      let customerEmail: string
      let region: { id: string }
      let salesChannel: { id: string }

      const originalFetch = global.fetch

      beforeAll(async () => {
        appContainer = getContainer()
      })

      afterEach(() => {
        global.fetch = originalFetch
      })

      const bookPathaoConsignment = async () => {
        // Pathao booking chain: issue-token → (store_id configured) → orders
        global.fetch = (async (input: any, init?: any) => {
          const url = String(input)
          if (url.includes("issue-token")) {
            return jsonResponse({ access_token: "tok", expires_in: 7200 })
          }
          if (url.includes("/stores")) {
            return jsonResponse({
              data: { data: [{ store_id: 7, store_name: "Main" }] },
            })
          }
          if (url.includes("POST") && url.includes("/orders")) {
            return jsonResponse({
              data: {
                consignment_id: "PTH-WH-1",
                order_status: "created",
                delivery_fee: 120,
              },
            })
          }
          if ((init?.method ?? "GET") === "POST" && url.includes("/orders")) {
            return jsonResponse({
              data: {
                consignment_id: "PTH-WH-1",
                order_status: "created",
                delivery_fee: 120,
              },
            })
          }
          return jsonResponse({ message: `unmocked ${init?.method} ${url}` }, 404)
        }) as typeof fetch

        const customerResult = await createCustomerUser(appContainer, {
          email: "courierwhbuyer@test.com",
          first_name: "Webhook",
          last_name: "Buyer",
        })
        customerEmail = customerResult.customer.email!
        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = {
          headers: {
            ...generateStoreHeaders({ publishableKey: apiKey }).headers,
            ...customerResult.headers.headers,
          },
        }

        salesChannel = await appContainer
          .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
          .createSalesChannels({ name: "Courier Webhook Channel" })

        region = await appContainer
          .resolve<IRegionModuleService>(Modules.REGION)
          .createRegions({
            name: "Courier Webhook Region",
            currency_code: "usd",
            countries: ["us"],
          })

        await appContainer.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.REGION]: { region_id: region.id },
          [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
        })

        sellerSeed = await seedSellerOfferWithShipping({
          container: appContainer,
          api,
          salesChannelId: salesChannel.id,
          email: "courier-wh@test.com",
          name: "CourierWH",
          stocked: 10,
          offerPrice: 1000,
        })

        // connect a Pathao account (store_id set → no stores lookup needed)
        const account = await api.post(
          "/vendor/courier-accounts",
          {
            provider: "pathao",
            data: {
              client_id: "cid",
              client_secret: "sec",
              username: "a@b.com",
              password: "pw",
              store_id: 7,
            },
          },
          sellerSeed.headers
        )
        expect(account.status).toEqual(201)

        const order = await completeSplitOrderCheckout({
          container: appContainer,
          api,
          storeHeaders,
          regionId: region.id,
          salesChannelId: salesChannel.id,
          offerId: sellerSeed.offer.id,
          email: customerEmail,
        })

        const items: { id: string; quantity: number }[] = (
          await api.get(
            `/vendor/orders/${order.id}?fields=*items`,
            sellerSeed.headers
          )
        ).data.order.items
        const [stockLocation] = (
          await api.get(`/vendor/stock-locations`, sellerSeed.headers)
        ).data.stock_locations

        const fulfillment = (
          await api.post(
            `/vendor/orders/${order.id}/fulfillments`,
            {
              items: items.map((item) => ({
                id: item.id,
                quantity: item.quantity,
              })),
              requires_shipping: true,
              location_id: stockLocation.id,
            },
            sellerSeed.headers
          )
        ).data.fulfillment

        const booked = await api.post(
          `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
          { provider: "pathao" },
          sellerSeed.headers
        )
        expect(booked.status).toEqual(201)

        return { order, fulfillment, shipment: booked.data.shipment }
      }

      it("applies a Pathao delivered webhook and fires fulfillmentDelivered exactly once", async () => {
        delivered.length = 0
        const { order, fulfillment, shipment } = await bookPathaoConsignment()
        expect(shipment.consignment_id).toEqual("PTH-WH-1")
        expect(delivered).toEqual([])

        const webhook = await api.post(
          "/hooks/courier/pathao",
          {
            consignment_id: "PTH-WH-1",
            merchant_order_id: order.id,
            order_status: "out for delivery",
            delivery_fee: 120,
          },
          {} // public endpoint — no auth headers
        )
        expect(webhook.status).toEqual(200)

        // status applied → shipment reads out_for_delivery
        let status = ""
        for (let i = 0; i < 20 && status !== "out_for_delivery"; i++) {
          await sleep(500)
          const res = await api.get(
            `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
            sellerSeed.headers
          )
          status = res.data.shipment?.status ?? ""
        }
        expect(status).toEqual("out_for_delivery")
        // nothing delivered yet
        expect(delivered).toEqual([])

        // now the delivered event
        const deliveredHook = await api.post(
          "/hooks/courier/pathao",
          {
            consignment_id: "PTH-WH-1",
            merchant_order_id: order.id,
            order_status: "delivered",
          },
          {}
        )
        expect(deliveredHook.status).toEqual(200)

        for (let i = 0; i < 20 && delivered.length === 0; i++) {
          await sleep(500)
        }
        expect(delivered).toHaveLength(1)
        expect(delivered[0]).toEqual({
          order_id: order.id,
          fulfillment_id: fulfillment.id,
        })

        const fetched = await api.get(
          `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
          sellerSeed.headers
        )
        expect(fetched.data.shipment.status).toEqual("delivered")

        // duplicate delivered webhook → acknowledged, no second money release
        const dup = await api.post(
          "/hooks/courier/pathao",
          {
            consignment_id: "PTH-WH-1",
            merchant_order_id: order.id,
            order_status: "delivered",
          },
          {}
        )
        expect(dup.status).toEqual(200)
        await sleep(3000)
        expect(delivered).toHaveLength(1)
      })

      it("acknowledges webhooks for unknown consignments without side effects", async () => {
        delivered.length = 0
        const response = await api.post(
          "/hooks/courier/pathao",
          { consignment_id: "PTH-UNKNOWN", order_status: "delivered" },
          {}
        )
        expect(response.status).toEqual(200)
        await sleep(2500)
        expect(delivered).toEqual([])
      })

      it("rejects Steadfast webhooks when no webhook token is configured", async () => {
        const response = await api
          .post(
            "/hooks/courier/steadfast",
            {
              notification_type: "delivery_status",
              consignment_id: 1,
              status: "delivered",
            },
            { headers: { authorization: "Bearer anything" } }
          )
          .catch((e) => e)

        expect(response.status ?? response.response?.status).toEqual(401)
      })

      it("404s for unknown courier providers", async () => {
        const response = await api
          .post("/hooks/courier/dhl", { foo: "bar" }, {})
          .catch((e) => e)
        expect(response.status ?? response.response?.status).toEqual(404)
      })
    })
  },
})
