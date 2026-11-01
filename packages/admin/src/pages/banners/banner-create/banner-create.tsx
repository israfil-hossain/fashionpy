import { useTranslation } from "react-i18next"

import { SingleColumnPage } from "../../../components/layout/pages"
import { BannerFormContainer } from "../components/banner-form"

export const BannerCreatePage = () => {
  const { t } = useTranslation()

  return (
    <SingleColumnPage data-testid="banner-create-page">
      <BannerFormContainer title={t("marketplace.banners.create")} />
    </SingleColumnPage>
  )
}

export const Component = BannerCreatePage
