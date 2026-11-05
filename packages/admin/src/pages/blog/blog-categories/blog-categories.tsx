import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  Button,
  Container,
  Heading,
  Input,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { Plus, Trash } from "@medusajs/icons"

import { Form } from "../../../components/common/form"
import { SingleColumnPage } from "../../../components/layout/pages"
import {
  useBlogCategories,
  useCreateBlogCategory,
  useDeleteBlogCategory,
} from "../../../hooks/api/blogs"

const CategorySchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .or(z.literal("")),
})

export const BlogCategoriesPage = () => {
  const { t } = useTranslation()
  const { blog_categories, isLoading, isError, error, refetch } =
    useBlogCategories({ limit: 100 })
  const create = useCreateBlogCategory()
  const remove = useDeleteBlogCategory()

  const form = useForm<z.infer<typeof CategorySchema>>({
    defaultValues: { name: "", slug: "" },
    resolver: zodResolver(CategorySchema),
  })

  if (isError) throw error

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync({
        name: values.name,
        slug: values.slug || undefined,
      })
      toast.success(t("marketplace.blog.categoryCreated"))
      form.reset({ name: "", slug: "" })
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed")
    }
  })

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id)
      toast.success(t("marketplace.blog.categoryDeleted"))
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed")
    }
  }

  return (
    <SingleColumnPage data-testid="blog-categories-page">
      <Container className="divide-y p-6">
        <Heading level="h2" className="pb-4">
          {t("marketplace.blog.categoriesHeader")}
        </Heading>
        <Form {...form}>
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-3 py-4 md:flex-row md:items-end"
          >
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item className="flex-1">
                  <Form.Label>{t("marketplace.blog.categoryName")}</Form.Label>
                  <Form.Control>
                    <Input {...field} data-testid="blog-category-name-input" />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="slug"
              render={({ field }) => (
                <Form.Item className="flex-1">
                  <Form.Label optional>
                    {t("marketplace.blog.slug")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="auto"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Button
              type="submit"
              isLoading={create.isPending}
              data-testid="blog-category-create-button"
            >
              <Plus /> {t("marketplace.blog.categoryAdd")}
            </Button>
          </form>
        </Form>
        {isLoading ? (
          <div className="py-4">
            <Text>{t("general.loading")}</Text>
          </div>
        ) : (blog_categories ?? []).length === 0 ? (
          <div className="py-4">
            <Text>{t("marketplace.blog.categoriesEmpty")}</Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>
                  {t("marketplace.blog.categoryName")}
                </Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.blog.slug")}</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {(blog_categories ?? []).map((c: any) => (
                <Table.Row key={c.id}>
                  <Table.Cell>{c.name}</Table.Cell>
                  <Table.Cell>{c.slug}</Table.Cell>
                  <Table.Cell>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash />
                    </Button>
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

export const Component = BlogCategoriesPage
