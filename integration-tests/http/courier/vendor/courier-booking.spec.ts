import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
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

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - courier shipment booking", () => {
      let appContainer: MedusaContainer
      let sellerSeed: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>
      let storeHeaders: { headers: Record<string, string> }
      let customerEmail: string
      let region: { id: string }
      let salesChannel: { id: string }

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const customerResult = await createCustomerUser(appContainer, {
          email: "courierbuyer@test.com",
          first_name: "Courier",
          last_name: "Buyer",
        })
        customerEmail = customerResult.customer.email!
        const apiKey = await generatePublishableKey(appContainer)
        const baseStoreHeaders = generateStoreHeaders({ publishableKey: apiKey })
        storeHeaders = {
          headers: {
            ...baseStoreHeaders.headers,
            ...customerResult.headers.headers,
          },
        }

        salesChannel = await appContainer
          .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
          .createSalesChannels({ name: "Courier Booking Channel" })

        region = await appContainer
          .resolve<IRegionModuleService>(Modules.REGION)
          .createRegions({
            name: "Courier Booking Region",
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
          email: "courier-booking@test.com",
          name: "CourierBooking",
          stocked: 10,
          offerPrice: 1000,
        })
      })

      const createFulfillment = async () => {
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

        return { order, fulfillment }
      }

      it("books a consignment on the system provider and attaches tracking", async () => {
        const { order, fulfillment } = await createFulfillment()

        const response = await api
          .post(
            `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
            { provider: "system" },
            sellerSeed.headers
          )
          .catch((e) => {
            console.error(
              "BOOKING-DEBUG status:",
              e.response?.status,
              "body:",
              JSON.stringify(e.response?.data)
            )
            throw e
          })

        expect(response.status).toEqual(201)
        const shipment = response.data.shipment
        expect(shipment).toBeDefined()
        expect(shipment.consignment_id).toMatch(/^sys_/)
        expect(shipment.tracking_code).toBeTruthy()
        expect(shipment.provider).toEqual("system")
        expect(shipment.order_id).toEqual(order.id)
        expect(shipment.fulfillment_id).toEqual(fulfillment.id)
        expect(shipment.cod_amount).toBeNull()

        // GET returns the same shipment
        const fetched = await api.get(
          `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
          sellerSeed.headers
        )
        expect(fetched.status).toEqual(200)
        expect(fetched.data.shipment?.id).toEqual(shipment.id)

        // booking also created the fulfillment shipment (tracking labels)
        const refreshed = await api.get(
          `/vendor/orders/${order.id}?fields=id,*fulfillments.labels,fulfillments.shipped_at`,
          sellerSeed.headers
        )
        const booked = (refreshed.data.order.fulfillments ?? []).find(
          (f: any) => f.id === fulfillment.id
        )
        expect(booked).toBeDefined()
        expect(booked.labels?.length ?? 0).toBeGreaterThan(0)
        expect(booked.labels[0].tracking_number).toEqual(
          shipment.tracking_code
        )
        expect(booked.shipped_at).toBeTruthy()
      })

      it("books COD shipments with the full order total", async () => {
        const { order, fulfillment } = await createFulfillment()

        const response = await api.post(
          `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
          { provider: "system", use_cod: true },
          sellerSeed.headers
        )

        expect(response.status).toEqual(201)
        const fresh = await api.get(
          `/vendor/orders/${order.id}?fields=id,total`,
          sellerSeed.headers
        )
        expect(response.data.shipment.cod_amount).toEqual(
          Math.round(Number(fresh.data.order.total))
        )
        expect(response.data.shipment.cod_amount).toBeGreaterThan(0)
      })

      it("rejects bookings for fulfillments the seller does not own", async () => {
        const { order, fulfillment } = await createFulfillment()

        const other = await (async () => {
          const { createSellerUser } = await import(
            "../../../helpers/create-seller-user"
          )
          return await createSellerUser(appContainer, {
            email: "courier-intruder@test.com",
            name: "Intruder",
          })
        })()

        const error = await api
          .post(
            `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
            { provider: "system" },
            other.headers
          )
          .catch((e) => e)

        expect(error.response?.status ?? error.status).toEqual(404)
      })

      it("GET returns null before a booking exists", async () => {
        const { order, fulfillment } = await createFulfillment()

        const response = await api.get(
          `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
          sellerSeed.headers
        )
        expect(response.status).toEqual(200)
        expect(response.data.shipment).toBeNull()
      })

      it("cancels the courier consignment when the fulfillment is canceled", async () => {
        const { order, fulfillment } = await createFulfillment()

        const booked = await api.post(
          `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
          { provider: "system" },
          sellerSeed.headers
        )
        expect(booked.status).toEqual(201)
        expect(booked.data.shipment.status).toEqual("pending")

        const canceled = await api
          .post(
            `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/cancel`,
            {},
            sellerSeed.headers
          )
          .catch((e) => {
            console.error(
              "CANCEL-DEBUG status:",
              e.response?.status,
              "body:",
              JSON.stringify(e.response?.data)
            )
            throw e
          })
        expect(canceled.status).toEqual(200)

        const fetched = await api.get(
          `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
          sellerSeed.headers
        )
        expect(fetched.status).toEqual(200)
        expect(fetched.data.shipment.status).toEqual("canceled")
        // system provider cancel succeeds → recorded as provider-side cancel
        expect(fetched.data.shipment.data?.provider_canceled).toEqual(true)
      })
    })
  },
})
