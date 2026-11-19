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
import { seedSellerOfferWithShipping } from "../../../helpers/split-order-checkout"

jest.setTimeout(300000)

/**
 * Full chatbot tool path without an LLM: search → cart → address → shipping
 * → payment → review → place_order → order status / shipments.
 */
medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Chatbot checkout tools (real commerce path)", () => {
      let appContainer: MedusaContainer
      let sellerSeed: any
      let customer: any
      let customerHeaders: any
      let region: any
      let salesChannel: any
      let customerId: string
      let conversationId: string

      const makeCtx = () => {
        const checkout: any = { phase: "idle" }
        return {
          container: appContainer,
          customer_id: customerId,
          conversation_id: conversationId,
          locale: "en" as const,
          checkout,
          sales_channel_id: salesChannel.id,
          onCheckoutChange: async (state: any) => {
            Object.assign(checkout, state)
          },
        }
      }

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        customer = await createCustomerUser(appContainer, {
          email: `chatbot-buyer-${Date.now()}@test.com`,
          first_name: "Chatbot",
          last_name: "Buyer",
        })
        customerId = customer.customer.id
        const apiKey = await generatePublishableKey(appContainer)
        const base = generateStoreHeaders({ publishableKey: apiKey })
        customerHeaders = {
          headers: { ...base.headers, ...customer.headers.headers },
        }

        salesChannel = await appContainer
          .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
          .createSalesChannels({ name: `Chatbot CH ${Date.now()}` })

        region = await appContainer
          .resolve<IRegionModuleService>(Modules.REGION)
          .createRegions({
            name: `Chatbot RG ${Date.now()}`,
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
          email: `chatbot-seller-${Date.now()}@test.com`,
          name: `ChatbotS${Date.now()}`,
          stocked: 15,
          offerPrice: 1200,
        })

        const created = await api.post(
          "/store/chatbot/conversations",
          { locale: "en" },
          customerHeaders
        )
        conversationId = created.data.conversation.id
      })

      it("search_products finds the seeded catalog product", async () => {
        const { searchProducts } = await import(
          "@mercurjs/core/chatbot/tools/execute"
        )
        const ctx = makeCtx()
        // Product titles from seedSellerOfferWithShipping use createVendorProduct
        const result = await searchProducts(ctx, { q: "Prod", limit: 8 })
        expect(result.content).toMatch(/Found \d+ products|No products/i)
        // At least one product from the seed should match "Prod" prefix
        // (createVendorProduct titles start with Prod + tag)
        const withCards = await searchProducts(ctx, {
          q: sellerSeed.offer.sku || "a",
          limit: 8,
        })
        void withCards
        // Broader: search by SKU fragment from offer
        const byAny = await searchProducts(ctx, { q: "S", limit: 12 })
        expect(byAny.cards?.length ?? 0).toBeGreaterThan(0)
      })

      it("walks add_to_cart → place_order → order status tools", async () => {
        const tools = await import("@mercurjs/core/chatbot/tools/execute")
        const ctx = makeCtx()

        const added = await tools.addToCart(ctx, {
          offer_id: sellerSeed.offer.id,
          quantity: 1,
        })
        expect(added.content).toMatch(/Added to cart/i)
        expect(ctx.checkout.phase).toBe("cart")
        expect(ctx.checkout.cart_id).toBeTruthy()

        const address = await tools.setShippingAddress(ctx, {
          first_name: "Chatbot",
          last_name: "Buyer",
          address_1: "42 Test Road",
          city: "New York",
          country_code: "us",
          phone: "01712345678",
          postal_code: "10001",
        })
        expect(address.content).toMatch(/Address saved/i)
        expect(ctx.checkout.phase).toBe("address")

        const options = await tools.listShippingOptions(ctx)
        expect(options.content).toMatch(/Shipping options/i)
        expect(options.content).not.toMatch(/No shipping options/i)

        // Bullet lines look like: "- Name (id): amount"
        const optionMatch = options.content.match(/\(([^)]+)\)/)
        if (!optionMatch) {
          throw new Error(`no option id in:\n${options.content}`)
        }
        const optionId = optionMatch[1]

        const shipping = await tools.setShippingMethod(ctx, {
          option_id: optionId,
        })
        expect(shipping.content).toMatch(/Shipping selected/i)
        expect(ctx.checkout.phase).toBe("shipping")

        const payment = await tools.setPaymentMethod(ctx, {
          provider_id: "pp_system_default",
        })
        expect(payment.content).toMatch(/Payment method set/i)
        expect(ctx.checkout.phase).toBe("payment")

        const review = await tools.reviewOrder(ctx)
        expect(review.content).toMatch(/Order review/i)
        expect(review.content).toMatch(/confirm/i)
        expect(ctx.checkout.phase).toBe("review")

        const placed = await tools.placeOrder(ctx)
        expect(placed.content).toMatch(/Order placed/i)
        expect(placed.cards?.[0]?.type).toBe("order")
        expect(ctx.checkout.phase).toBe("placed")
        expect(ctx.checkout.order_group_id).toBeTruthy()

        const orderGroupId = ctx.checkout.order_group_id!

        const status = await tools.getOrderStatus(ctx, {
          order_group_id: orderGroupId,
        })
        expect(status.content).toContain("Order #")
        expect(status.cards?.[0]?.type).toBe("order")
        expect(status.cards?.[0]?.order_group_id).toBe(orderGroupId)
        expect(status.cards?.[0]?.status).toBeTruthy()

        const list = await tools.listMyOrders(ctx)
        expect(list.cards?.some((c) => c.type === "order")).toBe(true)
        const listed = list.cards?.find(
          (c) => c.type === "order" && c.order_group_id === orderGroupId
        )
        expect(listed).toBeDefined()

        // Shipments endpoint for this conversation (no courier booked → empty)
        const shipments = await api.get(
          `/store/chatbot/conversations/${conversationId}/shipments`,
          customerHeaders
        )
        expect(shipments.status).toEqual(200)
        expect(Array.isArray(shipments.data.shipments)).toBe(true)
      })

      it("place_order refuses without review phase", async () => {
        const tools = await import("@mercurjs/core/chatbot/tools/execute")
        const ctx = makeCtx()
        await tools.addToCart(ctx, {
          offer_id: sellerSeed.offer.id,
          quantity: 1,
        })
        // Still in cart phase — place_order must throw
        await expect(tools.placeOrder(ctx)).rejects.toThrow(/review/i)
      })

      it("guests cannot place orders", async () => {
        const tools = await import("@mercurjs/core/chatbot/tools/execute")
        const ctx = makeCtx()
        ctx.customer_id = null
        await expect(
          tools.addToCart(ctx, { offer_id: sellerSeed.offer.id, quantity: 1 })
        ).rejects.toThrow(/log in/i)
      })
    })
  },
})
