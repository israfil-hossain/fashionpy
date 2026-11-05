import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import {
  Badge,
  Button,
  Container,
  Heading,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { Plus, Trash, PencilSquare } from "@medusajs/icons"

import { SingleColumnPage } from "../../../components/layout/pages"
import { useBlogPosts, useDeleteBlogPost } from "../../../hooks/api/blogs"

export const BlogListPage = () => {
  const { t } = useTranslation()
  const { blog_posts, isLoading, isError, error, refetch } = useBlogPosts({
    limit: 50,
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const remove = useDeleteBlogPost()

  if (isError) throw error

  const visible = (blog_posts ?? []).filter(
    (p: any) => statusFilter === "all" || p.status === statusFilter
  )

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id)
      toast.success(t("marketplace.blog.toast_delete"))
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed")
    }
  }

  return (
    <SingleColumnPage data-testid="blog-list-page">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <Heading level="h2">{t("marketplace.blog.header")}</Heading>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <Select.Trigger
                className="w-[180px]"
                data-testid="blog-status-filter"
              >
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">
                  {t("marketplace.blog.statusAll")}
                </Select.Item>
                <Select.Item value="draft">
                  {t("marketplace.blog.statusDraft")}
                </Select.Item>
                <Select.Item value="published">
                  {t("marketplace.blog.statusPublished")}
                </Select.Item>
              </Select.Content>
            </Select>
            <Button size="small" asChild>
              <Link to="/blog/create">
                <Plus /> {t("marketplace.blog.create")}
              </Link>
            </Button>
          </div>
        </div>
        {isLoading ? (
          <div className="p-6">
            <Text>{t("general.loading")}</Text>
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <Text>{t("marketplace.blog.empty")}</Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("marketplace.blog.title")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.blog.status")}</Table.HeaderCell>
                <Table.HeaderCell>
                  {t("marketplace.blog.category")}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t("marketplace.blog.countries")}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t("marketplace.blog.publishedAt")}
                </Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visible.map((p: any) => (
                <Table.Row key={p.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {p.cover_image_url && (
                        <img
                          src={p.cover_image_url}
                          alt=""
                          className="h-10 w-16 rounded object-cover"
                        />
                      )}
                      <span>{p.title}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="2xsmall"
                      color={p.status === "published" ? "green" : "grey"}
                    >
                      {p.status === "published"
                        ? t("marketplace.blog.statusPublished")
                        : t("marketplace.blog.statusDraft")}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{p.category?.name ?? "—"}</Table.Cell>
                  <Table.Cell>
                    {!p.country_codes?.length
                      ? t("marketplace.blog.countriesAll")
                      : p.country_codes.map((c: string) => c.toUpperCase()).join(", ")}
                  </Table.Cell>
                  <Table.Cell>
                    {p.published_at
                      ? new Date(p.published_at).toLocaleDateString()
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button size="small" variant="secondary" asChild>
                        <Link to={`/blog/${p.id}/edit`}>
                          <PencilSquare />
                        </Link>
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
    </SingleColumnPage>
  )
}

export const Component = BlogListPage
