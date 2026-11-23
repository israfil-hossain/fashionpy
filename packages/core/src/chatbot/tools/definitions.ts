import { ChatToolDefinition } from "../providers/types"

export const CHATBOT_TOOLS: ChatToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search published marketplace products by free-text query (e.g. facewash). Results are shown to the customer as product cards. Only call for a NEW query — never re-run a search whose results are already visible in the conversation; refer to those products by name instead, unless the customer explicitly asks to see them again.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search term" },
          limit: { type: "integer", minimum: 1, maximum: 12, default: 8 },
        },
        required: ["q"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product",
      description: "Fetch a single product by id or handle for details.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          handle: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_cart",
      description: "Return the current cart state (items, totals) if any.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description:
        "Add a product variant to the cart. Requires an offer_id (from search/get_product results when available). Customer must be logged in.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
          variant_id: { type: "string" },
          offer_id: { type: "string", description: "Seller offer id" },
          quantity: { type: "integer", minimum: 1, maximum: 20, default: 1 },
          title: { type: "string" },
          unit_price: { type: "integer", description: "Unit price in minor units" },
        },
        required: ["offer_id", "quantity", "title", "unit_price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_addresses",
      description: "List the logged-in customer's saved addresses.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "set_shipping_address",
      description:
        "Set the cart shipping address from a saved address_id, or create a new address.",
      parameters: {
        type: "object",
        properties: {
          address_id: { type: "string" },
          first_name: { type: "string" },
          last_name: { type: "string" },
          address_1: { type: "string" },
          city: { type: "string" },
          country_code: { type: "string" },
          phone: { type: "string" },
          postal_code: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_shipping_options",
      description: "List available shipping options and prices for the cart.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "set_shipping_method",
      description: "Pick a shipping option for the cart by option_id.",
      parameters: {
        type: "object",
        properties: { option_id: { type: "string" } },
        required: ["option_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_payment_methods",
      description: "List payment providers available on the cart (e.g. cash on delivery).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "set_payment_method",
      description: "Select a payment provider for the cart (e.g. pp_cod for cash on delivery).",
      parameters: {
        type: "object",
        properties: { provider_id: { type: "string" } },
        required: ["provider_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "review_order",
      description:
        "Build the order review summary (items, shipping, payment, totals). Call before place_order and show it to the customer for confirmation.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "place_order",
      description:
        "COMPLETE the checkout and place the order. ONLY call after the customer has explicitly confirmed the review summary (said yes/confirm/order it). Requires login.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_my_orders",
      description: "List the logged-in customer's recent order groups with status.",
      parameters: { type: "object", properties: { limit: { type: "integer", default: 5 } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_order_status",
      description:
        "Get order + fulfillment + delivery/courier status for a specific order group id, or the most recent order if omitted.",
      parameters: {
        type: "object",
        properties: { order_group_id: { type: "string" } },
      },
    },
  },
]

export function toolNames(): string[] {
  return CHATBOT_TOOLS.map((t) => t.function.name)
}
