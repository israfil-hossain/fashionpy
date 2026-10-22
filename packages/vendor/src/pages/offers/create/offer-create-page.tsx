import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { RouteFocusModal } from "../../../components/modals"
import { CreateOfferForm } from "./create-offer-form"

export const OfferCreatePage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get("product_id")

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("offers.create.header")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("offers.create.description")}</span>
      </RouteFocusModal.Description>
      <CreateOfferForm
        defaultValues={{
          selected_product_ids: productId ? [productId] : [],
        }}
      />
    </RouteFocusModal>
  )
}

export const Component = OfferCreatePage
