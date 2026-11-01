import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { Text } from "@medusajs/ui"

import { SingleColumnPage } from "../../../components/layout/pages"
import { useHeroBanner } from "../../../hooks/api/hero-banners"
import { BannerFormContainer } from "../components/banner-form"

export const BannerEditPage = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { hero_banner, isLoading, isError, error } = useHeroBanner(id!)

  if (isError) throw error

  return (
    <SingleColumnPage data-testid="banner-edit-page">
      {isLoading || !hero_banner ? (
        <div className="p-6"><Text>{t("general.loading")}</Text></div>
      ) : (
        <BannerFormContainer
          title={t("marketplace.banners.edit")}
          initial={hero_banner}
        />
      )}
    </SingleColumnPage>
  )
}

export const Component = BannerEditPage
