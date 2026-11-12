import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules, PayoutStatus, PayoutStatusReason } from "@mercurjs/types"
import {
  captureCodPaymentWorkflow,
  createOrderPayoutsWorkflow,
  createPayoutAccountWorkflow,
} from "@mercurjs/core/workflows"

import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import { eventually } from "../../../helpers/eventually"
import {
  completeSplitOrderCheckout,
  seedSellerOfferWithShipping,
} from "../../../helpers/split-order-checkout"

jest.setTimeout(600000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - COD capture and payout flow", () => {
      let appContainer: MedusaContainer
      let sellerSeed: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>
      let storeHeaders: { headers: Record<string, string> }
      let customerEmail: string
      let region: { id: string }
      let salesChannel: { id: string }
      let payoutService: any
      let commissionService: any
      let query: any
      let payoutAccountId: string

      beforeAll(async () => {
        appContainer = getContainer()
        payoutService = appContainer.resolve(MercurModules.PAYOUT)
        commissionService = appContainer.resolve(MercurModules.COMMISSION)
        query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const customerResult = await createCustomerUser(appContainer, {
          email: "cod-payout-buyer@test.com",
          first_name: "COD",
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
          .createSalesChannels({ name: "COD Payout Channel" })

        region = await appContainer
          .resolve<IRegionModuleService>(Modules.REGION)
          .createRegions({
            name: "COD Payout Region",
            currency_code: "usd",
            countries: ["us"],
          })

        await appContainer.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.REGION]: { region_id: region.id },
          [Modules.PAYMENT]: { payment_provider_id: "pp_cod" },
        })

        sellerSeed = await seedSellerOfferWithShipping({
          container: appContainer,
          api,
          salesChannelId: salesChannel.id,
          email: "cod-payout-seller@test.com",
          name: "CODPayout",
          stocked: 10,
          offerPrice: 10000,
        })

        const account = await createPayoutAccountWorkflow(appContainer).run({
          input: { seller_id: sellerSeed.sellerId, data: {}, context: {} },
        })
        payoutAccountId = account.result.id

        const [defaultRate] = await commissionService.listCommissionRates({
          is_default: true,
        })
        await commissionService.updateCommissionRates({
          id: defaultRate.id,
          value: 10,
        })
      })

      const checkoutWithCod = async () => {
        const order = await completeSplitOrderCheckout({
          container: appContainer,
          api,
          storeHeaders,
          regionId: region.id,
          salesChannelId: salesChannel.id,
          offerId: sellerSeed.offer.id,
          email: customerEmail,
          paymentProviderId: "pp_cod",
        })

        const {
          data: [orderRow],
        } = await query.graph({
          entity: "order",
          fields: [
            "id",
            "total",
            "currency_code",
            "items.id",
            "cart.payment_collection.payments.id",
            "cart.payment_collection.payments.provider_id",
            "cart.payment_collection.payments.captured_at",
          ],
          filters: { id: order.id },
        })
        return orderRow
      }

      const fulfillAndBook = async (order: any) => {
        const items: { id: string; quantity: number }[] = (
          await api.get(`/vendor/orders/${order.id}?fields=*items`, sellerSeed.headers)
        ).data.order.items
        const [stockLocation] = (
          await api.get(`/vendor/stock-locations`, sellerSeed.headers)
        ).data.stock_locations

        const fulfillment = (
          await api.post(
            `/vendor/orders/${order.id}/fulfillments`,
            {
              items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
              requires_shipping: true,
              location_id: stockLocation.id,
            },
            sellerSeed.headers
          )
        ).data.fulfillment

        // A pp_cod order books its shipment as COD automatically: the cash is
        // collected on the platform's courier account.
        const booking = await api.post(
          `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/courier`,
          { provider: "system" },
          sellerSeed.headers
        )
        expect(booking.status).toEqual(201)

        return { fulfillment, shipment: booking.data.shipment }
      }

      const markDelivered = async (order: any, fulfillmentId: string) => {
        const delivered = await api.post(
          `/vendor/orders/${order.id}/fulfillments/${fulfillmentId}/mark-as-delivered`,
          {},
          sellerSeed.headers
        )
        expect(delivered.status).toEqual(200)
      }

      const getOrderPayments = async (orderId: string) => {
        const {
          data: [order],
        } = await query.graph({
          entity: "order",
          fields: [
            "id",
            "total",
            "payment_collections.payments.id",
            "payment_collections.payments.captured_at",
          ],
          filters: { id: orderId },
        })
        return order as any
      }

      const commissionOf = async (order: any) => {
        const { data: lines } = await query.graph({
          entity: "commission_line",
          fields: ["amount"],
          filters: { item_id: order.items.map((item: any) => item.id) },
        })
        return lines.reduce(
          (acc: number, line: any) => acc + Number(line.amount),
          0
        )
      }

      const listPayouts = (orderId: string) =>
        payoutService.listPayouts({ order_id: orderId })

      it("captures a delivered COD order, holds the payout until remittance, then pays the net share", async () => {
        const order = await checkoutWithCod()
        const cartPayment = order.cart.payment_collection.payments[0]
        expect(cartPayment.provider_id).toEqual("pp_cod")
        expect(cartPayment.captured_at).toBeFalsy()

        const { fulfillment } = await fulfillAndBook(order)

        // Capture gate: without delivery the cash does not exist yet.
        const waiting = await captureCodPaymentWorkflow(appContainer).run({
          input: { payment_id: cartPayment.id },
        })
        expect(waiting.result.action).toEqual("wait")

        await markDelivered(order, fulfillment.id)

        const captured = await captureCodPaymentWorkflow(appContainer).run({
          input: { payment_id: cartPayment.id },
        })
        expect(captured.result.action).toEqual("capture")

        // The split runs off the payment.captured subscriber.
        await eventually(
          async () => {
            const fresh = await getOrderPayments(order.id)
            expect(fresh.payment_collections?.[0]?.payments?.[0]?.captured_at).toBeTruthy()
          },
          { timeout: 20000 }
        )

        const commission = await commissionOf(order)
        expect(commission).toBeGreaterThan(0)

        await createOrderPayoutsWorkflow(appContainer).run({
          input: { order_ids: [order.id], required_fulfillment_status: "delivered" },
        })

        const [held] = await listPayouts(order.id)
        expect(held.status).toEqual(PayoutStatus.ON_HOLD)
        expect(held.status_reason).toEqual(PayoutStatusReason.COD_NOT_REMITTED)
        expect(Number(held.amount)).toBe(0)

        const shipments = (
          await api.get(`/admin/courier-shipments?order_id=${order.id}`, adminHeaders)
        ).data.courier_shipments
        expect(shipments).toHaveLength(1)
        expect(Number(shipments[0].cod_amount)).toBe(Math.round(Number(order.total)))
        expect(shipments[0].cod_remitted_at).toBeFalsy()

        const remitted = await api.post(
          `/admin/courier-shipments/${shipments[0].id}/remittance`,
          { reference: "BATCH-1" },
          adminHeaders
        )
        expect(remitted.status).toEqual(200)
        expect(remitted.data.shipment.cod_remitted_at).toBeTruthy()
        expect(remitted.data.shipment.cod_remittance_reference).toEqual("BATCH-1")

        const payouts = await listPayouts(order.id)
        expect(payouts).toHaveLength(1)
        expect(payouts[0].id).toEqual(held.id)
        expect(payouts[0].status).toEqual(PayoutStatus.PAID)
        // Total minus the 10% item commission — the platform keeps the cut.
        expect(Number(payouts[0].amount)).toEqual(
          Math.round(Number(order.total) - commission)
        )
      }, 300000)

      it("refuses to remit a shipment that collected no COD cash", async () => {
        const order = await checkoutWithCod()
        const { shipment } = await fulfillAndBook(order)

        await appContainer
          .resolve(MercurModules.COURIER)
          .updateCourierShipments({ id: shipment.id, cod_amount: 0 })

        const response = await api
          .post(
            `/admin/courier-shipments/${shipment.id}/remittance`,
            {},
            adminHeaders
          )
          .catch((e: any) => e.response)
        expect(response.status).toEqual(400)
      }, 300000)

      describe("manual disbursement", () => {
        const createProcessingPayout = async (amount = 50) => {
          const payout = await payoutService.createPayouts({
            account_id: payoutAccountId,
            amount,
            currency_code: "usd",
            status: PayoutStatus.PROCESSING,
          })
          return payout[0] ?? payout
        }

        it("marks a processing payout paid with the operator's reference", async () => {
          const payout = await createProcessingPayout()

          const response = await api.post(
            `/admin/payouts/${payout.id}/mark-paid`,
            { reference: "BKASH-TRX-1" },
            adminHeaders
          )
          expect(response.status).toEqual(200)

          const [updated] = await payoutService.listPayouts({ id: payout.id })
          expect(updated.status).toEqual(PayoutStatus.PAID)
          expect(updated.data.reference).toEqual("BKASH-TRX-1")
          expect(updated.data.marked_paid_at).toBeTruthy()
        })

        it("refuses to mark a payout that is not processing", async () => {
          const payout = await createProcessingPayout()
          await api.post(
            `/admin/payouts/${payout.id}/mark-paid`,
            {},
            adminHeaders
          )

          const response = await api
            .post(`/admin/payouts/${payout.id}/mark-paid`, {}, adminHeaders)
            .catch((e: any) => e.response)
          expect(response.status).toEqual(409)
        })

        it("marks a batch of processing payouts paid in one call", async () => {
          const first = await createProcessingPayout(40)
          const second = await createProcessingPayout(60)

          const response = await api.post(
            `/admin/payouts/mark-paid`,
            { ids: [first.id, second.id] },
            adminHeaders
          )
          expect(response.status).toEqual(200)
          expect(response.data.result.paid).toHaveLength(2)

          const paid = await payoutService.listPayouts({
            id: [first.id, second.id],
          })
          expect(paid.every((p: any) => p.status === PayoutStatus.PAID)).toBe(true)
        })

        it("exports the paid batch as CSV with the seller's destination", async () => {
          const payout = await createProcessingPayout()
          await api.post(
            `/admin/payouts/${payout.id}/mark-paid`,
            { reference: "BANK-55" },
            adminHeaders
          )

          const detailsResponse = await api.post(
            `/vendor/sellers/${sellerSeed.sellerId}/payment-details`,
            {
              country_code: "bd",
              holder_name: "COD Payout Seller",
              payout_method: "bank",
              account_number: "1234567890",
            },
            sellerSeed.headers
          )
          expect(detailsResponse.status).toEqual(200)

          const response = await api.post(
            `/admin/payouts/export`,
            { status: "paid" },
            adminHeaders
          )
          expect(response.status).toEqual(200)
          expect(String(response.headers["content-type"])).toContain("text/csv")
          const csv = String(response.data)
          expect(csv).toContain("payout_id,display_id,seller")
          expect(csv).toContain("CODPayout")
          expect(csv).toContain("COD Payout Seller")
          expect(csv).toContain("1234567890")
          // The transfer reference is not part of the destination columns.
          expect(csv).not.toContain("BANK-55")
        })
      })

      it("stores the seller's payout destination on their payout account", async () => {
        const detailsResponse = await api.post(
          `/vendor/sellers/${sellerSeed.sellerId}/payment-details`,
          {
            country_code: "bd",
            holder_name: "Wallet Seller",
            payout_method: "bkash",
            wallet_number: "01711111111",
          },
          sellerSeed.headers
        )
        expect(detailsResponse.status).toEqual(200)

        const {
          data: [account],
        } = await query.graph({
          entity: "payout_account",
          fields: ["id", "data", "details_submitted"],
          filters: { id: payoutAccountId },
        })

        expect(account.data.payout_details).toMatchObject({
          payout_method: "bkash",
          holder_name: "Wallet Seller",
          wallet_number: "01711111111",
        })

        const {
          data: [sellerRow],
        } = await query.graph({
          entity: "seller",
          fields: ["id", "payment_details.payout_method", "payment_details.wallet_number"],
          filters: { id: sellerSeed.sellerId },
        })
        expect(sellerRow.payment_details.payout_method).toEqual("bkash")
        expect(sellerRow.payment_details.wallet_number).toEqual("01711111111")
      })
    })
  },
})
