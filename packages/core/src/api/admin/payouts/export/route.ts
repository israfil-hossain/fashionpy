import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AdminExportPayoutsType } from "../validators"

type PayoutExportRow = {
  id: string
  display_id: number
  amount: string | number
  currency_code: string
  status: string
  order_id: string | null
  created_at: Date | string
  data: Record<string, unknown> | null
  account: {
    id: string
    data: Record<string, unknown> | null
    seller?: {
      id: string
      name: string | null
      payment_details?: {
        payout_method: string | null
        holder_name: string | null
        bank_name: string | null
        wallet_number: string | null
        account_number: string | null
        routing_number: string | null
      } | null
    } | null
  } | null
}

type PayoutDestination = {
  payout_method: string | null
  holder_name: string | null
  bank_name: string | null
  wallet_number: string | null
  account_number: string | null
  routing_number: string | null
}

const EXPORT_FIELDS = [
  "id",
  "display_id",
  "amount",
  "currency_code",
  "status",
  "order_id",
  "created_at",
  "data",
  "account.id",
  "account.data",
  "account.seller.id",
  "account.seller.name",
  "account.seller.payment_details.payout_method",
  "account.seller.payment_details.holder_name",
  "account.seller.payment_details.bank_name",
  "account.seller.payment_details.wallet_number",
  "account.seller.payment_details.account_number",
  "account.seller.payment_details.routing_number",
]

const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ""
  }
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const destinationOf = (row: PayoutExportRow): PayoutDestination => {
  const fromAccount = (row.account?.data?.payout_details ?? null) as
    | Partial<PayoutDestination>
    | null
  const fromSeller = row.account?.seller?.payment_details ?? null

  const source = fromAccount ?? fromSeller ?? {}
  return {
    payout_method: source.payout_method ?? fromSeller?.payout_method ?? null,
    holder_name: source.holder_name ?? fromSeller?.holder_name ?? null,
    bank_name: source.bank_name ?? fromSeller?.bank_name ?? null,
    wallet_number: source.wallet_number ?? fromSeller?.wallet_number ?? null,
    account_number: source.account_number ?? fromSeller?.account_number ?? null,
    routing_number: source.routing_number ?? fromSeller?.routing_number ?? null,
  }
}

/**
 * CSV batch of payouts to execute manually: the operator transfers each row
 * from the platform account, then marks the payout paid in the panel.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminExportPayoutsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const body = req.validatedBody ?? {}

  const header = [
    "payout_id",
    "display_id",
    "seller",
    "seller_id",
    "payout_method",
    "holder_name",
    "bank_name",
    "wallet_number",
    "account_number",
    "routing_number",
    "amount",
    "currency_code",
    "order_id",
    "created_at",
    "status",
  ]

  const sendCsv = (lines: string[]) => {
    res.setHeader("Content-Type", "text/csv; charset=utf-8")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="payouts-${new Date().toISOString().slice(0, 10)}.csv"`
    )
    res.send(lines.join("\n") + "\n")
  }

  const filters: Record<string, unknown> = {}
  if (body.status) {
    filters.status = body.status
  }
  if (body.account_id) {
    filters.account_id = body.account_id
  }
  if (body.seller_id) {
    const { data: links } = await query.graph({
      entity: "seller_payout_account",
      fields: ["payout_account_id"],
      filters: { seller_id: body.seller_id },
    })
    const accountIds = links
      .map((link) => link.payout_account_id)
      .filter((id): id is string => !!id)
    if (!accountIds.length) {
      sendCsv([header.join(",")])
      return
    }
    filters.account_id = accountIds
  }

  const { data: payouts } = await query.graph({
    entity: "payout",
    fields: EXPORT_FIELDS,
    filters,
    pagination: { take: body.limit ?? 1000, order: { created_at: "ASC" } },
  })

  const lines = [header.join(",")]
  for (const raw of payouts) {
    const row = raw as unknown as PayoutExportRow
    const destination = destinationOf(row)
    lines.push(
      [
        row.id,
        row.display_id,
        row.account?.seller?.name ?? "",
        row.account?.seller?.id ?? "",
        destination.payout_method,
        destination.holder_name,
        destination.bank_name,
        destination.wallet_number,
        destination.account_number,
        destination.routing_number,
        row.amount,
        row.currency_code,
        row.order_id ?? "",
        new Date(row.created_at).toISOString(),
        row.status,
      ]
        .map(csvCell)
        .join(",")
    )
  }

  sendCsv(lines)
}
