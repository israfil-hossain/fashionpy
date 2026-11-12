import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { useMarkPayoutPaid } from "../../../../hooks/api/payouts"
import { AdminPayout } from "../../../../lib/payouts"

export const useMarkPaidPayoutAction = (payout: AdminPayout) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useMarkPayoutPaid(payout.id)

  const canMarkPaid = payout.status === "processing"

  const handleMarkPaid = async () => {
    const confirmed = await prompt({
      title: t("payouts.markPaid.title"),
      description: t("payouts.markPaid.description"),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => toast.success(t("payouts.markPaid.successToast")),
      onError: (error) => toast.error(error.message),
    })
  }

  return { handleMarkPaid, canMarkPaid }
}
