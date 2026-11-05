import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { Text } from "@medusajs/ui"

import { SingleColumnPage } from "../../../components/layout/pages"
import { useBlogPost } from "../../../hooks/api/blogs"
import { BlogForm } from "../components/blog-form"

export const BlogEditPage = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { blog_post, isLoading, isError, error } = useBlogPost(id!)

  if (isError) throw error

  return (
    <SingleColumnPage data-testid="blog-edit-page">
      {isLoading || !blog_post ? (
        <div className="p-6">
          <Text>{t("general.loading")}</Text>
        </div>
      ) : (
        <BlogForm initial={blog_post} />
      )}
    </SingleColumnPage>
  )
}

export const Component = BlogEditPage
