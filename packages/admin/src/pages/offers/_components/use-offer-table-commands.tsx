import { toast, usePrompt } from "@medusajs/ui"
import { useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"

import type { Permission } from "@mercurjs/dashboard-sdk"
import type { OfferDTO } from "@mercurjs/types"

import { useBulkDeleteOffers } from "../../../hooks/api/offers"
import { resolveOfferIdsForSelection } from "./resolve-offer-ids"

type OfferTableCommand = {
  label: string
  shortcut: string
  permission?: Permission
  action: (selection: Record<string, boolean>) => Promise<void>
}

export const useOfferTableCommands = (options?: {
  rows?: OfferDTO[]
  onDeleted?: () => void
}): OfferTableCommand[] => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: bulkDelete } = useBulkDeleteOffers()
  const rows = options?.rows ?? []
  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const onDeleted = options?.onDeleted

  return useMemo(
    () => [
      {
        label: t("offers.actions.bulkDelete"),
        shortcut: "d",
        permission: "offers:manage",
        action: async (currentSelection) => {
          const offerIds = resolveOfferIdsForSelection(
            rowsRef.current,
            currentSelection
          )
          if (offerIds.length === 0) {
            return
          }

          const confirmed = await prompt({
            title: t("general.areYouSure"),
            description: t("offers.bulkDelete.description", {
              count: offerIds.length,
              storeName: t("offers.fields.store"),
            }),
            confirmText: t("actions.delete"),
            cancelText: t("actions.cancel"),
            variant: "danger",
          })

          if (!confirmed) {
            return
          }

          const result = await bulkDelete(offerIds)
          if (result.failed.length === 0) {
            toast.success(
              t("offers.bulkDelete.successToast", {
                count: result.succeeded.length,
              }),
            )
            onDeleted?.()
          } else {
            toast.warning(
              t("offers.bulkDelete.errorToast", {
                message: `${result.succeeded.length}/${offerIds.length} succeeded`,
              }),
            )
          }
        },
      },
    ],
    [t, prompt, bulkDelete, onDeleted],
  )
}
