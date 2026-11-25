import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"

import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../helpers/create-admin-user"
import { createShippingProfile } from "../../helpers/create-shipping-profile"
import { createCustomerUser } from "../../helpers/create-customer-user"
import { createVendorProduct } from "../../helpers/create-product"
import { createSellerUser } from "../../helpers/create-seller-user"

const approveSeller = async (container: MedusaContainer, sellerId: string) => {
  const sellerModule = container.resolve(MercurModules.SELLER) as {
    updateSellers: (data: { id: string; status: SellerStatus }) => Promise<unknown>
  }
  await sellerModule.updateSellers({ id: sellerId, status: SellerStatus.OPEN })
}

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Bangladesh delivery charges", () => {
      let appContainer: MedusaContainer
      let storeHeaders: any
      let region: any
      let salesChannel: any
      let counter = 0

      const setDeliveryConfig = async (config: Record<string, unknown>) => {
        const storeModule = appContainer.resolve(Modules.STORE) as any
        const [store] = await storeModule.listStores({}, { take: 1 })
        await storeModule.updateStores(store.id, {
          metadata: {
            ...(store.metadata ?? {}),
            delivery_pricing: config,
          },
        })
      }

      const seedSeller = async (opts: {
        email: string
        name: string
        offerPrice: number
        outsideDhakaOverride?: number
      }) => {
        const result = await createSellerUser(appContainer, {
          email: opts.email,
          name: opts.name,
        })
        await approveSeller(appContainer, (result.seller as any).id)
        const headers = result.headers
        const suffix = `_${opts.name}_${Date.now()}_${++counter}`

        const stockLocation = (
          await api.post(
            `/vendor/stock-locations`,
            { name: `Warehouse${suffix}` },
            headers
          )
        ).data.stock_location

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
          { name: `FS${suffix}`, type: "shipping" },
          headers
        )
        const fulfillmentSet = (
          await api.get(
            `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
            headers
          )
        ).data.stock_location.fulfillment_sets[0]
        const serviceZone = (
          await api.post(
            `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
            {
              name: `SZ${suffix}`,
              geo_zones: [{ type: "country", country_code: "bd" }],
            },
            headers
          )
        ).data.fulfillment_set.service_zones.find(
          (z: any) => z.name === `SZ${suffix}`
        )
        const shippingProfile = await createShippingProfile(appContainer, {
          name: `SP${suffix}`,
        })

        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
          { add: ["manual_manual"] },
          headers
        )
        await api.post(
          `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          headers
        )

        const shippingOption = (
          await api.post(
            `/vendor/shipping-options`,
            {
              name: `Ship${suffix}`,
              service_zone_id: serviceZone.id,
              shipping_profile_id: shippingProfile.id,
              provider_id: "manual_manual",
              price_type: "flat",
              type: {
                label: "Standard",
                description: "Standard shipping",
                code: "standard",
              },
              prices: [{ currency_code: "bdt", amount: 999 }],
              rules: [
                {
                  attribute: "enabled_in_store",
                  value: "true",
                  operator: "eq",
                },
              ],
            },
            headers
          )
        ).data.shipping_option

        const product = await createVendorProduct(api, headers, {
          title: `Prod${suffix}`,
          sku: `V${suffix}`,
        })

        await api.post(
          `/vendor/sales-channels/${salesChannel.id}/products`,
          { add: [product.id] },
          headers
        )

        const offer = (
          await api.post(
            `/vendor/offers`,
            {
              sku: `OF${suffix}`,
              variant_id: product.variants[0].id,
              shipping_profile_id: shippingProfile.id,
              inventory_items: [
                {
                  title: `Inv${suffix}`,
                  required_quantity: 1,
                  stock_levels: [
                    {
                      location_id: stockLocation.id,
                      stocked_quantity: 20,
                    },
                  ],
                },
              ],
              prices: [{ amount: opts.offerPrice, currency_code: "bdt" }],
              metadata: opts.outsideDhakaOverride
                ? {
                    delivery_pricing: {
                      outside_dhaka_base: opts.outsideDhakaOverride,
                    },
                  }
                : undefined,
            },
            headers
          )
        ).data.offer

        return {
          sellerId: result.seller.id,
          headers,
          product,
          variant: product.variants[0],
          offer,
          shippingProfile,
          shippingOptionId: shippingOption.id as string,
        }
      }

      const createCart = async (city: string) => {
        const cart = (
          await api.post(
            `/store/carts`,
            {
              region_id: region.id,
              sales_channel_id: salesChannel.id,
              currency_code: "bdt",
              email: "deliverybuyer@test.com",
              shipping_address: {
                first_name: "Delivery",
                last_name: "Buyer",
                address_1: "123 Test St",
                city,
                country_code: "bd",
                postal_code: "1000",
              },
              billing_address: {
                first_name: "Delivery",
                last_name: "Buyer",
                address_1: "123 Test St",
                city,
                country_code: "bd",
                postal_code: "1000",
              },
            },
            storeHeaders
          )
        ).data.cart
        return cart
      }

      const addShippingMethod = async (cartId: string, optionId: string) => {
        const res = await api.post(
          `/store/carts/${cartId}/shipping-methods`,
          { option_id: optionId },
          storeHeaders
        )
        return res.data.cart.shipping_methods as any[]
      }

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const customerResult = await createCustomerUser(appContainer, {
          email: "deliverybuyer@test.com",
          first_name: "Delivery",
          last_name: "Buyer",
        })

        const apiKey = await generatePublishableKey(appContainer)
        const baseStoreHeaders = generateStoreHeaders({
          publishableKey: apiKey,
        })
        storeHeaders = {
          headers: {
            ...baseStoreHeaders.headers,
            ...customerResult.headers.headers,
          },
        }

        const salesChannelModule =
          appContainer.resolve<ISalesChannelModuleService>(
            Modules.SALES_CHANNEL
          )
        salesChannel = await salesChannelModule.createSalesChannels({
          name: "Delivery Store",
        })

        const regionModule = appContainer.resolve<IRegionModuleService>(
          Modules.REGION
        )
        region = await regionModule.createRegions({
          name: "Bangladesh",
          currency_code: "bdt",
          countries: ["bd"],
        })

        await setDeliveryConfig({
          dhaka_base: 80,
          outside_dhaka_base: 120,
          extra_kg_increment: 15,
          warehouse_fee: 12,
          weight_bands: [
            { up_to_kg: 0.5, increment: 0 },
            { up_to_kg: 1, increment: 10 },
            { up_to_kg: 2, increment: 30 },
          ],
        })
      })

      it("charges the default zone base per seller store, ignoring the flat option price", async () => {
        const sellerA = await seedSeller({
          email: "bd-seller-a@test.com",
          name: "BDSellerA",
          offerPrice: 1000,
        })
        const sellerB = await seedSeller({
          email: "bd-seller-b@test.com",
          name: "BDSellerB",
          offerPrice: 2000,
        })

        const cart = await createCart("Chattogram")
        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: sellerA.offer.id, quantity: 1 },
          storeHeaders
        )
        await api.post(
          `/store/carts/${cart.id}/line-items`,
          { offer_id: sellerB.offer.id, quantity: 1 },
          storeHeaders
        )

        const methods = await addShippingMethod(
          cart.id,
          sellerA.shippingOptionId
        )
        const methodsAfterSecond = await addShippingMethod(
          cart.id,
          sellerB.shippingOptionId
        )

        expect(methodsAfterSecond).toHaveLength(2)
        expect(
          methodsAfterSecond.map((method) => Number(method.amount)).sort()
        ).toEqual([120, 120])
        expect(methods[0].amount).toBeDefined()
      })

      it("uses the Dhaka base and honours a per-product outside-Dhaka override", async () => {
        const seller = await seedSeller({
          email: "bd-seller-override@test.com",
          name: "BDSellerOverride",
          offerPrice: 1000,
          outsideDhakaOverride: 150,
        })

        const dhakaCart = await createCart("Dhaka")
        await api.post(
          `/store/carts/${dhakaCart.id}/line-items`,
          { offer_id: seller.offer.id, quantity: 1 },
          storeHeaders
        )
        const dhakaMethods = await addShippingMethod(
          dhakaCart.id,
          seller.shippingOptionId
        )
        expect(Number(dhakaMethods[0].amount)).toBe(80)

        const outsideCart = await createCart("Sylhet")
        await api.post(
          `/store/carts/${outsideCart.id}/line-items`,
          { offer_id: seller.offer.id, quantity: 1 },
          storeHeaders
        )
        const outsideMethods = await addShippingMethod(
          outsideCart.id,
          seller.shippingOptionId
        )
        expect(Number(outsideMethods[0].amount)).toBe(150)
      })
    })
  },
})
