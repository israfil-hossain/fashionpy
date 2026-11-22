import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ProductStatus } from "@mercurjs/types"
import {
  addToCartWorkflow,
  createCartWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
} from "@medusajs/medusa/core-flows"

import { ChatbotCard } from "../../modules/chatbot/types/common"
import { completeCartWithSplitOrdersWorkflow } from "../../workflows/cart"
import { defaultStoreCartFields, refetchCart } from "../../api/store/carts/helpers"
import { listSellerShippingOptionsForCartWorkflow } from "../../workflows/cart/workflows/list-seller-shipping-options-for-cart"
import { addSellerShippingMethodToCartWorkflow } from "../../workflows/cart/workflows/add-seller-shipping-method-to-cart"
import { transition, CheckoutState } from "../state"
import {
  getSearchTerms,
  rankSearchResults,
  type SearchCandidate,
} from "./search-relevance"

export type ToolContext = {
  container: MedusaContainer
  customer_id: string | null
  conversation_id: string
  locale: "en" | "bn"
  checkout: CheckoutState
  /** Optional sales channel for cart creation (defaults to catalog lookup). */
  sales_channel_id?: string | null
  onCheckoutChange: (state: CheckoutState) => Promise<void>
}

export type ToolResult = {
  content: string
  cards?: ChatbotCard[]
}

function requireCustomer(ctx: ToolContext): string {
  if (!ctx.customer_id) {
    throw new Error(
      ctx.locale === "bn"
        ? "অর্ডার করতে অনুগ্রহ করে লগইন করুন।"
        : "Please log in to place an order."
    )
  }
  return ctx.customer_id
}

function requireCart(ctx: ToolContext): string {
  if (!ctx.checkout.cart_id) {
    throw new Error(
      ctx.locale === "bn"
        ? "আপনার কার্ট খালি। আগে পণ্য যোগ করুন।"
        : "Your cart is empty. Add a product first."
    )
  }
  return ctx.checkout.cart_id
}

function formatMoney(amount: number, currency: string): string {
  return `${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`
}

type ProductCandidate = SearchCandidate & {
  id: string
  thumbnail?: string | null
  variants?: Array<{
    id?: string
    prices?: Array<{ amount: number; currency_code?: string | null }>
  }> | null
}

export async function searchProducts(
  ctx: ToolContext,
  args: { q: string; limit?: number }
): Promise<ToolResult> {
  const query = ctx.container.resolve(ContainerRegistrationKeys.QUERY)
  const limit = Math.min(args.limit ?? 8, 12)
  const terms = getSearchTerms(args.q).slice(0, 20)

  if (terms.length === 0) {
    return {
      content:
        ctx.locale === "bn"
          ? `"${args.q}" এর জন্য কোনো পণ্য পাওয়া যায়নি। অন্য কিছু লিখে দেখুন।`
          : `No products found for "${args.q}". Try another search.`,
      cards: [],
    }
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"],
    filters: {
      $or: terms.flatMap((term) => [
        { name: { $ilike: `%${term}%` } },
        { handle: { $ilike: `%${term}%` } },
      ]),
    },
    pagination: { take: 100 },
  })
  const categoryIds = (categories ?? [])
    .map((category: { id?: string }) => category.id)
    .filter((id): id is string => !!id)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "thumbnail",
      "description",
      "status",
      "categories.id",
      "categories.name",
      "categories.handle",
      "type.value",
      "tags.value",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
    filters: {
      status: ProductStatus.PUBLISHED,
      $or: [
        ...terms.flatMap((term) => [
          { title: { $ilike: `%${term}%` } },
          { handle: { $ilike: `%${term}%` } },
          { description: { $ilike: `%${term}%` } },
        ]),
        ...(categoryIds.length ? [{ categories: { id: categoryIds } }] : []),
      ],
    },
    pagination: { take: 200 },
  })

  const ranked = rankSearchResults(
    (products ?? []) as ProductCandidate[],
    args.q,
    limit
  )

  const cards: ChatbotCard[] = ranked.map((p) => {
    const price = p.variants?.[0]?.prices?.[0]
    return {
      type: "product",
      id: p.id,
      title: p.title ?? "",
      handle: p.handle,
      thumbnail: p.thumbnail,
      price: price ? formatMoney(price.amount, price.currency_code ?? "usd") : null,
      currency_code: price?.currency_code ?? null,
      url: p.handle ? `/products/${p.handle}` : null,
    }
  })

  return {
    content:
      cards.length === 0
        ? ctx.locale === "bn"
          ? `"${args.q}" এর জন্য কোনো পণ্য পাওয়া যায়নি। অন্য কিছু লিখে দেখুন।`
          : `No products found for "${args.q}". Try another search.`
        : ctx.locale === "bn"
          ? `${cards.length}টি পণ্য পাওয়া গেছে। নিচে দেখুন।`
          : `Found ${cards.length} products. Take a look.`,
    cards,
  }
}

export async function getProduct(
  ctx: ToolContext,
  args: { id?: string; handle?: string }
): Promise<ToolResult> {
  const query = ctx.container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "thumbnail",
      "description",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
    filters: {
      status: ProductStatus.PUBLISHED,
      ...(args.id ? { id: args.id } : {}),
      ...(args.handle ? { handle: args.handle } : {}),
    },
    pagination: { take: 1 },
  })

  const p = data?.[0]
  if (!p) {
    return {
      content:
        ctx.locale === "bn" ? "পণ্যটি পাওয়া যায়নি।" : "Product not found.",
    }
  }

  const price = p.variants?.[0]?.prices?.[0]
  const card: ChatbotCard = {
    type: "product",
    id: p.id,
    title: p.title,
    handle: p.handle,
    thumbnail: p.thumbnail,
    price: price ? formatMoney(price.amount, price.currency_code ?? "usd") : null,
    currency_code: price?.currency_code ?? null,
    url: p.handle ? `/products/${p.handle}` : null,
  }

  return {
    content: `${p.title}${p.description ? ` — ${String(p.description).slice(0, 160)}` : ""}`,
    cards: [card],
  }
}

async function resolveOffer(
  ctx: ToolContext,
  args: { product_id?: string; variant_id?: string; offer_id?: string }
): Promise<{ id: string; variant_id: string } | null> {
  const query = ctx.container.resolve(ContainerRegistrationKeys.QUERY)

  if (args.offer_id) {
    const { data } = await query.graph({
      entity: "offer",
      fields: ["id", "variant_id", "product_id"],
      filters: { id: args.offer_id },
    })
    return (data?.[0] as any) ?? null
  }

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["id", "variant_id", "product_id", "seller.status"],
    filters: {
      ...(args.variant_id ? { variant_id: args.variant_id } : {}),
      ...(args.product_id ? { product_id: args.product_id } : {}),
      seller: { status: "open" },
    },
    pagination: { take: 1 },
  })

  return (offers?.[0] as any) ?? null
}

export async function getCart(ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.checkout.cart_id) {
    return {
      content:
        ctx.locale === "bn"
          ? "আপনার কার্ট এখন খালি।"
          : "Your cart is currently empty.",
    }
  }

  const cart = await refetchCart(
    ctx.checkout.cart_id,
    ctx.container,
    defaultStoreCartFields
  )

  const items = (cart?.items ?? []).map(
    (i: any) => `${i.title} × ${i.quantity} (${formatMoney(i.total ?? i.unit_price, cart.currency_code)})`
  )

  return {
    content:
      items.length === 0
        ? ctx.locale === "bn"
          ? "কার্ট খালি।"
          : "Cart is empty."
        : `Cart:\n${items.join("\n")}\nTotal: ${formatMoney(cart.total ?? 0, cart.currency_code)}`,
  }
}

export async function addToCart(
  ctx: ToolContext,
  args: {
    product_id?: string
    variant_id?: string
    offer_id?: string
    quantity?: number
    title?: string
    unit_price?: number
  }
): Promise<ToolResult> {
  requireCustomer(ctx)

  const offer = await resolveOffer(ctx, args)
  if (!offer) {
    return {
      content:
        ctx.locale === "bn"
          ? "এই পণ্যটি এখন কেনার জন্য উপলব্ধ নয় (কোনো অফার পাওয়া যায়নি)।"
          : "This product is not available to buy right now (no offer found).",
    }
  }

  let cartId = ctx.checkout.cart_id
  if (!cartId) {
    const query = ctx.container.resolve(ContainerRegistrationKeys.QUERY)
    const regions = await query.graph({
      entity: "region",
      fields: ["id", "currency_code"],
      pagination: { take: 1 },
    })
    const region = regions.data?.[0]
    if (!region) {
      throw new Error("No region configured for checkout")
    }

    // Marketplace carts need a sales channel or offers won't price/resolve.
    let salesChannelId: string | undefined =
      ctx.sales_channel_id ?? undefined
    if (!salesChannelId) {
      try {
        // Prefer the channel the product is published to (from the offer).
        const { data: offerLinks } = await query.graph({
          entity: "offer",
          fields: ["id", "product_id"],
          filters: { id: offer.id },
        })
        const productId = offerLinks?.[0]?.product_id
        if (productId) {
          const { data: channelLinks } = await query.graph({
            entity: "product_sales_channel",
            fields: ["sales_channel_id"],
            filters: { product_id: productId },
            pagination: { take: 1 },
          })
          salesChannelId = channelLinks?.[0]?.sales_channel_id
        }
      } catch {
        salesChannelId = undefined
      }
      if (!salesChannelId) {
        try {
          const channels = await query.graph({
            entity: "sales_channel",
            fields: ["id"],
            pagination: { take: 1 },
          })
          salesChannelId = channels.data?.[0]?.id
        } catch {
          salesChannelId = undefined
        }
      }
    }

    const { result } = await createCartWorkflow(ctx.container).run({
      input: {
        region_id: region.id,
        ...(salesChannelId ? { sales_channel_id: salesChannelId } : {}),
        ...(ctx.customer_id ? { customer_id: ctx.customer_id } : {}),
      },
    })
    cartId = (result as any).id ?? (result as any).cart?.id
    if (!cartId) {
      throw new Error("Cart creation failed")
    }
    await ctx.onCheckoutChange(
      transition(ctx.checkout, "cart", { cart_id: cartId })
    )
    ctx.checkout = { ...ctx.checkout, phase: "cart", cart_id: cartId }
  }

  if (ctx.customer_id) {
    const cartModule = ctx.container.resolve("cart") as any
    try {
      await cartModule.updateCarts([
        { id: cartId, customer_id: ctx.customer_id },
      ])
    } catch {
      // best effort — some Medusa versions reject re-binding
    }
  }

  await addToCartWorkflow(ctx.container).run({
    input: {
      cart_id: cartId,
      items: [
        {
          variant_id: offer.variant_id,
          offer_id: offer.id,
          quantity: args.quantity ?? 1,
          requires_shipping: true,
          metadata: { offer_id: offer.id },
        },
      ],
    },
  })

  const cart = await refetchCart(cartId, ctx.container, defaultStoreCartFields)
  return {
    content:
      ctx.locale === "bn"
        ? `কার্টে যোগ হয়েছে। মোট: ${formatMoney(cart.total ?? 0, cart.currency_code)}`
        : `Added to cart. Total: ${formatMoney(cart.total ?? 0, cart.currency_code)}. Say "ok make order" to checkout.`,
  }
}

export async function listAddresses(ctx: ToolContext): Promise<ToolResult> {
  requireCustomer(ctx)
  const query = ctx.container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "customer_address",
    fields: ["id", "first_name", "last_name", "address_1", "city", "country_code", "phone", "postal_code"],
    filters: { customer_id: ctx.customer_id! },
    pagination: { take: 10 },
  })

  if (!data?.length) {
    return {
      content:
        ctx.locale === "bn"
          ? "কোনো সেভ করা ঠিকানা নেই। নতুন ঠিকানা দিন।"
          : "No saved addresses. Please share a new address.",
    }
  }

  const lines = data.map(
    (a: any, i: number) =>
      `${i + 1}. ${a.first_name} ${a.last_name}, ${a.address_1}, ${a.city}, ${a.country_code} (${a.id})`
  )
  return {
    content:
      (ctx.locale === "bn" ? "আপনার ঠিকানাসমূহ:\n" : "Your addresses:\n") +
      lines.join("\n"),
  }
}

export async function setShippingAddress(
  ctx: ToolContext,
  args: {
    address_id?: string
    first_name?: string
    last_name?: string
    address_1?: string
    city?: string
    country_code?: string
    phone?: string
    postal_code?: string
  }
): Promise<ToolResult> {
  requireCustomer(ctx)
  const cartId = requireCart(ctx)
  const cartModule = ctx.container.resolve("cart") as any

  let address: Record<string, unknown>
  if (args.address_id) {
    const query = ctx.container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "customer_address",
      fields: ["*"],
      filters: { id: args.address_id, customer_id: ctx.customer_id! },
    })
    if (!data?.[0]) {
      throw new Error("Address not found")
    }
    const a = data[0]
    address = {
      first_name: a.first_name,
      last_name: a.last_name,
      address_1: a.address_1,
      address_2: a.address_2,
      city: a.city,
      country_code: a.country_code,
      postal_code: a.postal_code,
      province: a.province,
      phone: a.phone,
    }
    await ctx.onCheckoutChange(
      transition(ctx.checkout, "address", { address_id: args.address_id })
    )
    ctx.checkout = { ...ctx.checkout, phase: "address", address_id: args.address_id }
  } else {
    if (!args.address_1 || !args.city || !args.country_code) {
      throw new Error("address_1, city and country_code are required for a new address")
    }
    address = {
      first_name: args.first_name ?? "Customer",
      last_name: args.last_name ?? "",
      address_1: args.address_1,
      city: args.city,
      country_code: args.country_code,
      postal_code: args.postal_code ?? "",
      phone: args.phone ?? "",
    }
    await ctx.onCheckoutChange(transition(ctx.checkout, "address", {}))
    ctx.checkout = { ...ctx.checkout, phase: "address" }
  }

  await cartModule.updateCarts([
    {
      id: cartId,
      shipping_address: address,
      billing_address: address,
    },
  ])

  return {
    content:
      ctx.locale === "bn"
        ? "ঠিকানা সেট হয়েছে। এখন শিপিং অপশন দেখি।"
        : "Address saved. Let's pick a shipping option.",
  }
}

export async function listShippingOptions(ctx: ToolContext): Promise<ToolResult> {
  const cartId = requireCart(ctx)
  const { result } = await listSellerShippingOptionsForCartWorkflow(
    ctx.container
  ).run({
    input: { cart_id: cartId, fields: ["id", "name", "calculated_price"] },
  })

  // Mercur returns a seller-keyed record `{ [sellerId]: ShippingOption[] }`
  // (same shape the store route serializes); vanilla Medusa returns an array.
  const raw = (result ?? null) as unknown
  const options: any[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.values(raw as Record<string, any[]>).flat()
      : []

  if (!options.length) {
    return {
      content:
        ctx.locale === "bn"
          ? "এই কার্টের জন্য কোনো শিপিং অপশন নেই।"
          : "No shipping options available for this cart.",
    }
  }

  const lines = options.map(
    (o: any) =>
      `- ${o.name} (${o.id}): ${o.calculated_price?.calculated_amount != null ? formatMoney(o.calculated_price.calculated_amount, o.calculated_price.currency_code ?? "usd") : "n/a"}`
  )
  return {
    content:
      (ctx.locale === "bn" ? "শিপিং অপশন:\n" : "Shipping options:\n") +
      lines.join("\n"),
    // Option ids are useful for the model even though they're in the text
    cards: undefined,
  }
}

export async function setShippingMethod(
  ctx: ToolContext,
  args: { option_id: string }
): Promise<ToolResult> {
  const cartId = requireCart(ctx)
  await addSellerShippingMethodToCartWorkflow(ctx.container).run({
    input: {
      cart_id: cartId,
      options: [{ id: args.option_id }],
    },
  })
  await ctx.onCheckoutChange(
    transition(ctx.checkout, "shipping", { shipping_method_id: args.option_id })
  )
  ctx.checkout = {
    ...ctx.checkout,
    phase: "shipping",
    shipping_method_id: args.option_id,
  }

  return {
    content:
      ctx.locale === "bn"
        ? "শিপিং সিলেক্ট হয়েছে। পেমেন্ট পদ্ধতি বেছে নিন।"
        : "Shipping selected. Choose a payment method (e.g. cash on delivery).",
  }
}

export async function listPaymentMethods(ctx: ToolContext): Promise<ToolResult> {
  const cartId = requireCart(ctx)
  const cart = await refetchCart(cartId, ctx.container, [
    "id",
    "payment_collection.payment_sessions.provider_id",
  ])

  const providers = new Set<string>(
    (cart?.payment_collection?.payment_sessions ?? []).map((s: any) => s.provider_id)
  )
  // Known marketplace payment providers
  providers.add("pp_cod")
  if (process.env.STRIPE_SECRET_KEY) {
    providers.add("pp_stripe_stripe")
  }
  providers.add("pp_system_default")

  return {
    content:
      (ctx.locale === "bn" ? "পেমেন্ট পদ্ধতি:\n" : "Payment methods:\n") +
      [...providers].map((p) => `- ${p}${p === "pp_cod" ? " (cash on delivery)" : ""}`).join("\n"),
  }
}

export async function setPaymentMethod(
  ctx: ToolContext,
  args: { provider_id: string }
): Promise<ToolResult> {
  requireCustomer(ctx)
  const cartId = requireCart(ctx)
  const cart = await refetchCart(cartId, ctx.container, [
    "id",
    "total",
    "currency_code",
    "payment_collection.id",
  ])

  if (!cart?.payment_collection?.id) {
    await createPaymentCollectionForCartWorkflow(ctx.container).run({
      input: { cart_id: cartId },
    })
  }

  const refetched = await refetchCart(cartId, ctx.container, [
    "id",
    "total",
    "currency_code",
    "payment_collection.id",
  ])
  const paymentCollectionId = refetched?.payment_collection?.id
  if (!paymentCollectionId) {
    throw new Error("Could not create payment collection for cart")
  }

  await createPaymentSessionsWorkflow(ctx.container).run({
    input: {
      payment_collection_id: paymentCollectionId,
      provider_id: args.provider_id,
      customer_id: ctx.customer_id ?? undefined,
    },
  })

  await ctx.onCheckoutChange(
    transition(ctx.checkout, "payment", { payment_provider_id: args.provider_id })
  )
  ctx.checkout = {
    ...ctx.checkout,
    phase: "payment",
    payment_provider_id: args.provider_id,
  }

  return {
    content:
      ctx.locale === "bn"
        ? `পেমেন্ট সিলেক্ট: ${args.provider_id}। এখন অর্ডার রিভিউ করি।`
        : `Payment method set: ${args.provider_id}. Review the order next.`,
  }
}

export async function reviewOrder(ctx: ToolContext): Promise<ToolResult> {
  const cartId = requireCart(ctx)
  const cart = await refetchCart(cartId, ctx.container, defaultStoreCartFields)

  const items = (cart?.items ?? [])
    .map((i: any) => `- ${i.title} × ${i.quantity}: ${formatMoney(i.total ?? i.unit_price, cart.currency_code)}`)
    .join("\n")
  const shipping = (cart?.shipping_methods ?? [])
    .map((m: any) => m.name)
    .join(", ")
  const address = cart?.shipping_address
    ? `${cart.shipping_address.first_name} ${cart.shipping_address.last_name}, ${cart.shipping_address.address_1}, ${cart.shipping_address.city}`
    : "—"
  const payment =
    (cart?.payment_collection?.payment_sessions ?? []).find(
      (s: any) => s.status === "authorized" || s.status === "pending"
    )?.provider_id ??
    cart?.payment_collection?.payment_sessions?.[0]?.provider_id ??
    "—"

  const summary =
    (ctx.locale === "bn" ? "অর্ডার রিভিউ:\n" : "Order review:\n") +
    `${items}\n` +
    (ctx.locale === "bn" ? `ঠিকানা: ${address}\n` : `Address: ${address}\n`) +
    (ctx.locale === "bn" ? `শিপিং: ${shipping || "—"}\n` : `Shipping: ${shipping || "—"}\n`) +
    (ctx.locale === "bn" ? `পেমেন্ট: ${payment}\n` : `Payment: ${payment}\n`) +
    (ctx.locale === "bn"
      ? `মোট: ${formatMoney(cart?.total ?? 0, cart.currency_code)}\n\nকনফার্ম করতে বলুন "হ্যাঁ" বা "confirm"।`
      : `Total: ${formatMoney(cart?.total ?? 0, cart.currency_code)}\n\nSay "yes" or "confirm" to place the order.`)

  await ctx.onCheckoutChange(transition(ctx.checkout, "review", {}))
  ctx.checkout = { ...ctx.checkout, phase: "review" }

  return { content: summary }
}

export async function placeOrder(ctx: ToolContext): Promise<ToolResult> {
  requireCustomer(ctx)
  const cartId = requireCart(ctx)

  if (ctx.checkout.phase !== "review" && ctx.checkout.phase !== "payment") {
    throw new Error(
      ctx.locale === "bn"
        ? "আগে অর্ডার রিভিউ করুন এবং কনফার্ম করুন।"
        : "Review and confirm the order first."
    )
  }

  const { errors, result } = await completeCartWithSplitOrdersWorkflow(
    ctx.container
  ).run({
    input: { cart_id: cartId as string },
    throwOnError: false,
  })

  if (errors?.[0]) {
    const err = errors[0].error
    throw new Error(err?.message ?? "Checkout failed")
  }

  const orderGroupId = result.order_group_id as string | undefined
  if (!orderGroupId) {
    throw new Error(
      ctx.locale === "bn" ? "অর্ডার তৈরি হয়নি।" : "Order was not created."
    )
  }
  await ctx.onCheckoutChange(
    transition(ctx.checkout, "placed", {
      order_group_id: orderGroupId,
      confirmed: true,
      cart_id: null,
    })
  )
  ctx.checkout = {
    phase: "placed",
    order_group_id: orderGroupId,
    confirmed: true,
    cart_id: null,
  }

  const query = ctx.container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order_group",
    fields: ["id", "display_id", "total"],
    filters: { id: orderGroupId },
  })
  const group = data?.[0]

  const card: ChatbotCard = {
    type: "order",
    order_group_id: orderGroupId,
    display_id: group?.display_id ?? null,
    status: "pending",
    url: `/user/orders/${orderGroupId}`,
  }

  return {
    content:
      ctx.locale === "bn"
        ? `✅ অর্ডার সফল হয়েছে! অর্ডার #${group?.display_id ?? ""}। কনফার্মেশন ইমেইল পাঠানো হয়েছে।`
        : `✅ Order placed! Order #${group?.display_id ?? ""}. A confirmation email is on its way.`,
    cards: [card],
  }
}

export async function listMyOrders(ctx: ToolContext): Promise<ToolResult> {
  requireCustomer(ctx)
  const query = ctx.container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order_group",
    fields: [
      "id",
      "display_id",
      "total",
      "created_at",
      "orders.status",
      "orders.fulfillment_status",
      "orders.payment_status",
      "orders.currency_code",
    ],
    filters: { customer_id: ctx.customer_id! },
    pagination: { take: 5, skip: 0 },
  })

  const groups = data ?? []
  if (!groups.length) {
    return {
      content:
        ctx.locale === "bn" ? "কোনো অর্ডার পাওয়া যায়নি।" : "No orders found.",
    }
  }

  const cards: ChatbotCard[] = groups.map((g: any) => ({
    type: "order",
    order_group_id: g.id,
    display_id: g.display_id,
    status: g.orders?.[0]?.status ?? null,
    fulfillment_status: g.orders?.[0]?.fulfillment_status ?? null,
    payment_status: g.orders?.[0]?.payment_status ?? null,
    total: g.total != null ? formatMoney(g.total, g.orders?.[0]?.currency_code ?? "usd") : null,
    url: `/user/orders/${g.id}`,
  }))

  return {
    content:
      ctx.locale === "bn"
        ? `আপনার সাম্প্রতিক অর্ডারসমূহ (${groups.length}):`
        : `Your recent orders (${groups.length}):`,
    cards,
  }
}

export async function getOrderStatus(
  ctx: ToolContext,
  args: { order_group_id?: string }
): Promise<ToolResult> {
  requireCustomer(ctx)
  const query = ctx.container.resolve(ContainerRegistrationKeys.QUERY)

  const filters: Record<string, unknown> = { customer_id: ctx.customer_id! }
  if (args.order_group_id) {
    filters.id = args.order_group_id
  }

  const { data: groups } = await query.graph({
    entity: "order_group",
    fields: [
      "id",
      "display_id",
      "total",
      "orders.id",
      "orders.display_id",
      "orders.status",
      "orders.fulfillment_status",
      "orders.payment_status",
      "orders.currency_code",
      "orders.items.title",
      "orders.items.quantity",
    ],
    filters,
    pagination: { take: args.order_group_id ? 1 : 1 },
  })

  const group = groups?.[0]
  if (!group) {
    return {
      content:
        ctx.locale === "bn" ? "অর্ডার পাওয়া যায়নি।" : "Order not found.",
    }
  }

  // Courier shipments for delivery status
  let shipments: any[] = []
  try {
    const orderIds = (group.orders ?? []).map((o: any) => o.id)
    if (orderIds.length) {
      const { data: shipRows } = await query.graph({
        entity: "courier_shipment",
        fields: [
          "id",
          "status",
          "tracking_code",
          "tracking_url",
          "provider",
          "order_id",
        ],
        filters: { order_id: orderIds },
      })
      shipments = shipRows ?? []
    }
  } catch {
    shipments = []
  }

  const order = group.orders?.[0]
  const card: ChatbotCard = {
    type: "order",
    order_group_id: group.id,
    display_id: group.display_id,
    status: order?.status ?? null,
    fulfillment_status: order?.fulfillment_status ?? null,
    payment_status: order?.payment_status ?? null,
    total:
      group.total != null
        ? formatMoney(group.total, order?.currency_code ?? "usd")
        : null,
    url: `/user/orders/${group.id}`,
    shipments: shipments.map((s) => ({
      id: s.id,
      status: s.status,
      tracking_number: s.tracking_code,
      tracking_url: s.tracking_url,
      carrier: s.provider,
    })),
  }

  const deliveryLine = shipments.length
    ? shipments.map((s) => `${s.provider}: ${s.status}${s.tracking_code ? ` (${s.tracking_code})` : ""}`).join("; ")
    : (order?.fulfillment_status ?? "not_fulfilled")

  return {
    content:
      (ctx.locale === "bn"
        ? `অর্ডার #${group.display_id}\nঅবস্থা: ${order?.status ?? "—"}\nপেমেন্ট: ${order?.payment_status ?? "—"}\nডেলিভারি: ${deliveryLine}`
        : `Order #${group.display_id}\nStatus: ${order?.status ?? "—"}\nPayment: ${order?.payment_status ?? "—"}\nDelivery: ${deliveryLine}`),
    cards: [card],
  }
}

export async function dispatchTool(
  name: string,
  rawArgs: string,
  ctx: ToolContext
): Promise<ToolResult> {
  let args: Record<string, unknown> = {}
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {}
  } catch {
    args = {}
  }

  switch (name) {
    case "search_products":
      return searchProducts(ctx, args as any)
    case "get_product":
      return getProduct(ctx, args as any)
    case "get_cart":
      return getCart(ctx)
    case "add_to_cart":
      return addToCart(ctx, args as any)
    case "list_addresses":
      return listAddresses(ctx)
    case "set_shipping_address":
      return setShippingAddress(ctx, args as any)
    case "list_shipping_options":
      return listShippingOptions(ctx)
    case "set_shipping_method":
      return setShippingMethod(ctx, args as any)
    case "list_payment_methods":
      return listPaymentMethods(ctx)
    case "set_payment_method":
      return setPaymentMethod(ctx, args as any)
    case "review_order":
      return reviewOrder(ctx)
    case "place_order":
      return placeOrder(ctx)
    case "list_my_orders":
      return listMyOrders(ctx)
    case "get_order_status":
      return getOrderStatus(ctx, args as any)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
