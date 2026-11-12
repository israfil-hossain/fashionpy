import { AdminOrder } from "@medusajs/types"
import { Button, Container, Heading, StatusBadge, Text, toast, usePrompt } from "@medusajs/ui"
import { PermissionAction } from "@mercurjs/dashboard-shared"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"

import {
  AdminCourierShipment,
  useCourierShipments,
  useMarkCodRemitted,
} from "../../../../../hooks/api/courier"
import { getLocaleAmount } from "../../../../../lib/money-amount-helpers"

/** Nothing was collected for these, so there is no cash to remit. */
const REMITTANCE_EXEMPT_STATUSES = ["canceled", "failed", "returned"]

const STATUS_COLOR: Record<string, "green" | "blue" | "orange" | "red" | "grey"> = {
  delivered: "green",
  picked_up: "blue",
  in_transit: "blue",
  out_for_delivery: "orange",
  pending: "grey",
  returned: "red",
  canceled: "red",
  failed: "red",
}

const awaitingRemittance = (shipment: AdminCourierShipment) =>
  Number(shipment.cod_amount ?? 0) > 0 &&
  !REMITTANCE_EXEMPT_STATUSES.includes(shipment.status) &&
  !shipment.cod_remitted_at

const MarkRemittedAction = ({ shipment }: { shipment: AdminCourierShipment }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync, isPending } = useMarkCodRemitted(shipment.id)

  const handleMarkRemitted = async () => {
    const confirmed = await prompt({
      title: t("courier.shipments.markRemittedTitle"),
      description: t("courier.shipments.markRemittedDescription"),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await mutateAsync(
      {},
      {
        onSuccess: () => toast.success(t("courier.shipments.markRemittedToast")),
        onError: (error) => toast.error(error.message),
      }
    )
  }

  return (
    <PermissionAction permission="payouts:edit">
      <Button
        variant="secondary"
        size="small"
        isLoading={isPending}
        onClick={handleMarkRemitted}
        data-testid={`mark-remitted-${shipment.id}`}
      >
        {t("courier.shipments.markRemitted")}
      </Button>
    </PermissionAction>
  )
}

const ShipmentRow = ({
  shipment,
  currencyCode,
}: {
  shipment: AdminCourierShipment
  currencyCode: string
}) => {
  const { t } = useTranslation()
  const remitted = awaitingRemittance(shipment)

  return (
    <div
      className="grid grid-cols-2 items-center gap-y-2 px-6 py-4 md:grid-cols-5"
      data-testid={`courier-shipment-${shipment.id}`}
    >
      <div className="flex flex-col gap-y-1">
        <Text size="small" weight="plus" leading="compact">
          {shipment.provider} · {shipment.consignment_id}
        </Text>
        {shipment.tracking_code && (
          <Text size="small" className="text-ui-fg-subtle">
            {shipment.tracking_code}
          </Text>
        )}
      </div>
      <div>
        <StatusBadge color={STATUS_COLOR[shipment.status] ?? "grey"}>
          {shipment.status.replace(/_/g, " ")}
        </StatusBadge>
      </div>
      <Text size="small">
        {shipment.cod_amount
          ? getLocaleAmount(Number(shipment.cod_amount), currencyCode)
          : "—"}
      </Text>
      <Text size="small" className="text-ui-fg-subtle">
        {shipment.cod_remitted_at
          ? t("courier.shipments.remittedAt", {
              date: format(new Date(shipment.cod_remitted_at), "PP p"),
            })
          : Number(shipment.cod_amount ?? 0) > 0 &&
              !REMITTANCE_EXEMPT_STATUSES.includes(shipment.status)
            ? t("courier.shipments.notRemitted")
            : "—"}
      </Text>
      <div className="flex justify-end">
        {remitted && <MarkRemittedAction shipment={shipment} />}
      </div>
    </div>
  )
}

/**
 * COD shipments of the order with their remittance state. The remittance is
 * the fact the payout gate waits on, so recording it releases the seller's
 * held share (the endpoint re-decides the payout server-side).
 */
export const OrderCourierSection = ({ order }: { order: AdminOrder }) => {
  const { t } = useTranslation()

  const { courier_shipments, isLoading } = useCourierShipments(
    { order_id: order.id },
    { enabled: !!order.id }
  )

  if (isLoading || !courier_shipments?.length) {
    return null
  }

  const hasAwaiting = courier_shipments.some(awaitingRemittance)

  return (
    <Container className="divide-y p-0" data-testid="order-courier-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("courier.shipments.header")}</Heading>
      </div>
      {hasAwaiting && (
        <div className="bg-ui-bg-component px-6 py-3">
          <Text size="small" className="text-ui-fg-subtle">
            {t("courier.shipments.awaitingRemittance")}
          </Text>
        </div>
      )}
      {courier_shipments.map((shipment) => (
        <ShipmentRow
          key={shipment.id}
          shipment={shipment}
          currencyCode={order.currency_code}
        />
      ))}
    </Container>
  )
}
