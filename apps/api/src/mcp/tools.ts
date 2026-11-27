import { z } from "zod"

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { McpIdentity } from "./auth"

const API_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

type ApiResult = Record<string, unknown>

const callApi = async (
  identity: McpIdentity,
  surface: "vendor" | "admin",
  path: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
): Promise<ApiResult> => {
  const response = await fetch(`${API_URL}/${surface}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${identity.token}`,
      ...(surface === "vendor" && identity.sellerId
        ? { "x-seller-id": identity.sellerId }
        : {}),
      ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
        ? { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = (await response.json().catch(() => ({}))) as ApiResult & {
    message?: string
  }

  if (!response.ok) {
    throw new Error(
      typeof payload.message === "string"
        ? payload.message
        : `FashionPy API returned ${response.status}`
    )
  }

  return payload
}

const textResult = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
})

const requireScope = (identity: McpIdentity, scope: string) => {
  if (!identity.scopes.includes(scope)) {
    throw new Error(`Missing required scope: ${scope}`)
  }
}

export const registerCommonTools = (
  server: McpServer,
  identity: McpIdentity
) => {
  server.registerTool(
    "whoami",
    {
      description: "Show the FashionPy identity and permissions used by this MCP connection.",
      inputSchema: {},
    },
    async () =>
      textResult({
        email: identity.email,
        actor_type: identity.actorType,
        seller_id: identity.sellerId ?? null,
        scopes: identity.scopes,
      })
  )
}

export const registerSellerTools = (
  server: McpServer,
  identity: McpIdentity
) => {
  server.registerTool(
    "list_categories",
    {
      description: "List product categories available to this seller.",
      inputSchema: {},
    },
    async () => {
      requireScope(identity, "products:read")
      const result = await callApi(
        identity,
        "vendor",
        "/product-categories?limit=100"
      )
      return textResult(result.product_categories ?? result)
    }
  )

  server.registerTool(
    "list_shipping_profiles",
    {
      description: "List shipping profiles used when creating offers.",
      inputSchema: {},
    },
    async () => {
      requireScope(identity, "products:read")
      const result = await callApi(
        identity,
        "vendor",
        "/shipping-profiles?limit=100"
      )
      return textResult(result.shipping_profiles ?? result)
    }
  )

  server.registerTool(
    "list_stock_locations",
    {
      description: "List the seller's stock locations for offer inventory.",
      inputSchema: {},
    },
    async () => {
      requireScope(identity, "products:read")
      const result = await callApi(
        identity,
        "vendor",
        "/stock-locations?limit=100"
      )
      return textResult(result.stock_locations ?? result)
    }
  )

  server.registerTool(
    "draft_product_from_source",
    {
      description:
        "Generate a FashionPy product draft from a source URL or image URLs. Does not publish anything.",
      inputSchema: {
        source_url: z.string().url().optional(),
        image_urls: z.array(z.string().url()).max(5).optional(),
        hints: z
          .object({
            category: z.string().optional(),
            brand: z.string().optional(),
            language: z.string().optional(),
            keywords: z.array(z.string()).max(10).optional(),
          })
          .optional(),
      },
    },
    async ({ source_url, image_urls, hints }) => {
      requireScope(identity, "products:write")
      if (!source_url && !image_urls?.length) {
        throw new Error("Provide source_url or at least one image_urls entry")
      }
      const result = await callApi(identity, "vendor", "/products/ai/draft", "POST", {
        ...(source_url ? { source_url } : {}),
        ...(image_urls ? { image_urls } : {}),
        ...(hints ? { hints } : {}),
      })
      return textResult(result)
    }
  )

  server.registerTool(
    "create_product",
    {
      description:
        "Create a seller product. FashionPy always submits it as 'proposed' so an admin can verify it before publishing.",
      inputSchema: {
        title: z.string().min(1),
        description: z.string().optional(),
        handle: z.string().optional(),
        variants: z
          .array(z.object({ title: z.string(), sku: z.string().optional() }))
          .min(1),
        categories: z.array(z.object({ id: z.string() })).optional(),
        image_urls: z.array(z.string().url()).optional(),
      },
    },
    async ({ title, description, handle, variants, categories, image_urls }) => {
      requireScope(identity, "products:write")
      const result = await callApi(identity, "vendor", "/products", "POST", {
        title,
        description,
        handle,
        status: "proposed",
        variants,
        ...(categories ? { categories } : {}),
        ...(image_urls
          ? { images: image_urls.map((url) => ({ url })), thumbnail: image_urls[0] }
          : {}),
      })
      return textResult(result)
    }
  )

  server.registerTool(
    "update_product",
    {
      description: "Update a seller product. Changes are queued for admin review.",
      inputSchema: {
        product_id: z.string().min(1),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["draft", "proposed"]).optional(),
      },
    },
    async ({ product_id, title, description, status }) => {
      requireScope(identity, "products:write")
      const result = await callApi(
        identity,
        "vendor",
        `/products/${encodeURIComponent(product_id)}`,
        "POST",
        {
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          ...(status ? { status } : {}),
        }
      )
      return textResult(result)
    }
  )

  server.registerTool(
    "create_offer",
    {
      description:
        "Add a price and stock to an existing product variant. Requires a shipping profile and stock location id from the list tools.",
      inputSchema: {
        sku: z.string().min(1),
        variant_id: z.string().min(1),
        shipping_profile_id: z.string().min(1),
        stock_location_id: z.string().min(1),
        amount: z.number().positive(),
        currency_code: z.string().min(3),
        stocked_quantity: z.number().int().nonnegative(),
      },
    },
    async ({
      sku,
      variant_id,
      shipping_profile_id,
      stock_location_id,
      amount,
      currency_code,
      stocked_quantity,
    }) => {
      requireScope(identity, "products:write")
      const result = await callApi(identity, "vendor", "/offers", "POST", {
        sku,
        variant_id,
        shipping_profile_id,
        inventory_items: [
          {
            required_quantity: 1,
            stock_levels: [
              { location_id: stock_location_id, stocked_quantity },
            ],
          },
        ],
        prices: [{ amount, currency_code }],
      })
      return textResult(result)
    }
  )
}

export const registerAdminTools = (
  server: McpServer,
  identity: McpIdentity
) => {
  server.registerTool(
    "list_pending_products",
    {
      description: "List products submitted by sellers and awaiting verification.",
      inputSchema: {},
    },
    async () => {
      requireScope(identity, "admin:review")
      const result = await callApi(
        identity,
        "admin",
        "/products?status[]=proposed&limit=100&fields=id,title,status,created_at"
      )
      return textResult(result.products ?? result)
    }
  )

  server.registerTool(
    "confirm_product",
    {
      description:
        "Approve a proposed product and publish it. Requires confirm to be literally true.",
      inputSchema: {
        product_id: z.string().min(1),
        confirm: z.literal(true),
        internal_note: z.string().optional(),
      },
    },
    async ({ product_id, confirm, internal_note }) => {
      requireScope(identity, "admin:review")
      if (confirm !== true) {
        throw new Error("confirm must be true to approve a product")
      }
      const result = await callApi(
        identity,
        "admin",
        `/products/${encodeURIComponent(product_id)}/confirm`,
        "POST",
        { internal_note }
      )
      return textResult(result)
    }
  )

  server.registerTool(
    "reject_product",
    {
      description: "Reject a proposed product with a message for the seller.",
      inputSchema: {
        product_id: z.string().min(1),
        message: z.string().min(1),
      },
    },
    async ({ product_id, message }) => {
      requireScope(identity, "admin:review")
      const result = await callApi(
        identity,
        "admin",
        `/products/${encodeURIComponent(product_id)}/reject`,
        "POST",
        { message }
      )
      return textResult(result)
    }
  )
}
