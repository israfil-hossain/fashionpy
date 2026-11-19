import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { Text } from "@medusajs/ui"

import { SingleColumnPage } from "../../../components/layout/pages"
import { usePolicy } from "../../../hooks/api/policies"
import { PolicyForm } from "../components/policy-form"

export const PolicyEditPage = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { policy_page, isLoading, isError, error } = usePolicy(id!)

  if (isError) throw error

  return (
    <SingleColumnPage data-testid="policy-edit-page">
      {isLoading || !policy_page ? (
        <div className="p-6">
          <Text>{t("general.loading")}</Text>
        </div>
      ) : (
        <PolicyForm initial={policy_page} />
      )}
    </SingleColumnPage>
  )
}

export const Component = PolicyEditPage
