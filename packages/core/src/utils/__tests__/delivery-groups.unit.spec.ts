import { quoteBangladeshDelivery } from "../delivery-groups"

const buildContainer = (data: Record<string, unknown[]>) => {
  const query = {
    graph: jest.fn(async ({ entity }: { entity: string }) => ({
      data: data[entity] ?? [],
    })),
  }
  return {
    resolve: jest.fn(() => query),
    query,
  }
}

const makeItem = (overrides: Record<string, unknown> = {}) => ({
  id: "item_1",
  quantity: 1,
  variant: { weight: 0.5 },
  offer: {
    id: "offer_1",
    seller_id: "seller_1",
    inventory_items: [
      {
        requires_shipping: true,
        location_levels: [
          { location_id: "sloc_1", available_quantity: 10 },
        ],
      },
    ],
  },
  ...overrides,
})

const makeOption = (id: string, sellerId: string, locationId: string) => ({
  id,
  seller: { id: sellerId },
  service_zone: { fulfillment_set: { location: { id: locationId } } },
})

describe("Bangladesh delivery grouping", () => {
  const store = {
    id: "store_1",
    default_location_id: "sloc_default",
    metadata: {
      delivery_pricing: {
        dhaka_base: 60,
        outside_dhaka_base: 120,
        extra_kg_increment: 15,
        weight_bands: [
          { up_to_kg: 0.5, increment: 0 },
          { up_to_kg: 1, increment: 10 },
          { up_to_kg: 2, increment: 30 },
        ],
      },
    },
  }

  it("charges each seller store separately outside Dhaka", async () => {
    const container = buildContainer({
      cart: [
        {
          id: "cart_1",
          currency_code: "bdt",
          shipping_address: { city: "Chattogram" },
          items: [
            makeItem(),
            makeItem({
              id: "item_2",
              offer: {
                id: "offer_2",
                seller_id: "seller_2",
                inventory_items: [
                  {
                    requires_shipping: true,
                    location_levels: [
                      { location_id: "sloc_2", available_quantity: 10 },
                    ],
                  },
                ],
              },
            }),
          ],
        },
      ],
      store: [store],
      shipping_option: [
        makeOption("opt_1", "seller_1", "sloc_1"),
        makeOption("opt_2", "seller_2", "sloc_2"),
      ],
      stock_location_seller: [
        { stock_location_id: "sloc_default" },
      ],
    })

    const quote = await quoteBangladeshDelivery(container as never, {
      cart_id: "cart_1",
      option_ids: ["opt_1", "opt_2"],
    })

    expect(quote?.amountByOption).toEqual({ opt_1: 120, opt_2: 120 })
    expect(quote?.groups).toHaveLength(2)
    expect(quote?.groups.every((group) => group.type === "seller_store")).toBe(true)
  })

  it("applies product and seller overrides to the base but keeps weight increments", async () => {
    const container = buildContainer({
      cart: [
        {
          id: "cart_2",
          currency_code: "bdt",
          shipping_address: { city: "Chattogram" },
          items: [makeItem({ variant: { weight: 1.5 } })],
        },
      ],
      store: [store],
      shipping_option: [makeOption("opt_1", "seller_1", "sloc_1")],
      seller: [
        { id: "seller_1", metadata: { delivery_pricing: { outside_dhaka_base: 150 } } },
      ],
      offer: [
        { id: "offer_1", metadata: { delivery_pricing: { outside_dhaka_base: 200 } } },
      ],
    })

    const quote = await quoteBangladeshDelivery(container as never, {
      cart_id: "cart_2",
      option_ids: ["opt_1"],
    })

    expect(quote?.groups[0].charge).toMatchObject({
      base: 200,
      weight_increment: 30,
      amount: 230,
    })
  })

  it("groups warehouse items into a single carrier charge", async () => {
    const warehouseStore = {
      ...store,
      metadata: {
        ...store.metadata,
        delivery_pricing: {
          ...(store.metadata.delivery_pricing as Record<string, unknown>),
          platform_warehouse_location_id: "sloc_warehouse",
        },
      },
    }
    const warehouseItem = (id: string, sellerId: string) => ({
      id,
      quantity: 1,
      variant: { weight: 0.5 },
      offer: {
        id: `offer_${sellerId}`,
        seller_id: sellerId,
        inventory_items: [
          {
            requires_shipping: true,
            location_levels: [
              { location_id: "sloc_warehouse", available_quantity: 10 },
            ],
          },
        ],
      },
    })

    const container = buildContainer({
      cart: [
        {
          id: "cart_3",
          currency_code: "bdt",
          shipping_address: { city: "Dhaka" },
          items: [warehouseItem("item_1", "seller_1"), warehouseItem("item_2", "seller_2")],
        },
      ],
      store: [warehouseStore],
      shipping_option: [
        makeOption("opt_1", "seller_1", "sloc_warehouse"),
        makeOption("opt_2", "seller_2", "sloc_warehouse"),
      ],
    })

    const quote = await quoteBangladeshDelivery(container as never, {
      cart_id: "cart_3",
      option_ids: ["opt_1", "opt_2"],
    })

    expect(quote?.groups).toHaveLength(1)
    expect(quote?.groups[0].type).toBe("platform_warehouse")
    expect(quote?.groups[0].weight_kg).toBe(1)
    expect(quote?.groups[0].charge.amount).toBe(70)
    expect(quote?.amountByOption).toEqual({ opt_1: 70, opt_2: 0 })
    expect(quote?.carrierByGroup.platform_warehouse).toBe("opt_1")
  })

  it("returns null for non-BDT carts", async () => {
    const container = buildContainer({
      cart: [{ id: "cart_4", currency_code: "usd", items: [] }],
    })
    expect(
      await quoteBangladeshDelivery(container as never, {
        cart_id: "cart_4",
        option_ids: [],
      })
    ).toBeNull()
  })
})
