import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { linkSalesChannelsToStockLocationWorkflow } from "@medusajs/medusa/core-flows"
import { HttpTypes, SellerStatus } from "@mercurjs/types"

import { VendorCreateSellerAccountType } from "./validators"
import { createSellerAccountWorkflow } from "../../../workflows/seller"
import { createSellerStockLocationsWorkflow } from "../../../workflows/stock-location"

// The stock-location address table requires address_1, which an onboarding
// seller may legitimately have skipped.
const DEFAULT_WAREHOUSE_ADDRESS_LINE = "Main Warehouse"

const createDefaultStockLocation = async (
  container: MedusaContainer,
  seller: { id: string; name: string },
  address: VendorCreateSellerAccountType["address"]
) => {
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [store],
  } = await query.graph({
    entity: "store",
    fields: ["default_sales_channel_id"],
  })

  const { result: locations } = await createSellerStockLocationsWorkflow(
    container
  ).run({
    input: {
      seller_id: seller.id,
      locations: [
        {
          name: `${seller.name} Warehouse`,
          address: {
            address_1:
              address?.address_1 || DEFAULT_WAREHOUSE_ADDRESS_LINE,
            city: address?.city || undefined,
            country_code: address?.country_code || "bd",
            postal_code: address?.postal_code || undefined,
            province: address?.province || undefined,
          },
        },
      ],
    },
  })

  const location = locations[0]

  const defaultSalesChannelId = (
    store as { default_sales_channel_id?: string | null } | undefined
  )?.default_sales_channel_id
  if (defaultSalesChannelId) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: location.id,
        add: [defaultSalesChannelId],
      },
    })
  }

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  return location
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorSellerMemberListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const memberId = req.auth_context?.actor_id

  // The onboarding wizard calls this with a token issued at registration,
  // before app_metadata carries a member id. 401 here would make the client
  // drop the auth token mid-signup, so report "no sellers yet" instead.
  if (!memberId) {
    res.json({
      seller_members: [],
      count: 0,
      offset: req.queryConfig.pagination?.skip ?? 0,
      limit: req.queryConfig.pagination?.take ?? 0,
    })
    return
  }

  const { data: sellerMembers, metadata } = await query.graph({
    entity: "seller_member",
    fields: req.queryConfig.fields,
    filters: {
      member_id: memberId,
      seller: {
        status: {
          $ne: SellerStatus.TERMINATED,
        },
      },
    },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    seller_members: sellerMembers,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateSellerAccountType>,
  res: MedusaResponse<HttpTypes.VendorSellerResponse>
) => {
  const {
    address,
    professional_details,
    payment_details,
    member_email,
    first_name,
    last_name,
    additional_data,
    ...sellerData
  } = req.validatedBody

  const memberId = req.auth_context.actor_id || undefined

  if (!memberId && !member_email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "member_email is required when creating a seller without an existing member"
    )
  }

  const { result: seller } = await createSellerAccountWorkflow(req.scope).run({
    input: {
      auth_identity_id: req.auth_context.auth_identity_id,
      member_id: memberId,
      seller: sellerData,
      member_email,
      first_name: first_name ?? undefined,
      last_name: last_name ?? undefined,
      address,
      professional_details,
      payment_details,
      additional_data,
    },
  })

  try {
    await createDefaultStockLocation(req.scope, seller, address)
  } catch (error) {
    req.scope
      .resolve(ContainerRegistrationKeys.LOGGER)
      .error(
        `Failed to provision the default stock location for seller ${seller.id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
  }

  res.status(201).json({ seller })
}
