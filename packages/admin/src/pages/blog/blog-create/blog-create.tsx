import { SingleColumnPage } from "../../../components/layout/pages"
import { BlogForm } from "../components/blog-form"

export const BlogCreatePage = () => {
  return (
    <SingleColumnPage data-testid="blog-create-page">
      <BlogForm />
    </SingleColumnPage>
  )
}

export const Component = BlogCreatePage
