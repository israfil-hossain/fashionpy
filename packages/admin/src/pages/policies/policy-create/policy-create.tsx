import { SingleColumnPage } from "../../../components/layout/pages"
import { PolicyForm } from "../components/policy-form"

export const PolicyCreatePage = () => {
  return (
    <SingleColumnPage data-testid="policy-create-page">
      <PolicyForm />
    </SingleColumnPage>
  )
}

export const Component = PolicyCreatePage
