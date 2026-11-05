import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  Button,
  Container,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { RichTextEditor } from "@mercurjs/dashboard-shared"

import { Form } from "../../../components/common/form"
import {
  useBlogCategories,
  useCreateBlogPost,
  useUpdateBlogPost,
} from "../../../hooks/api/blogs"
import { useRegions } from "../../../hooks/api/regions"
import { sdk } from "../../../lib/client"
import { uploadRichTextImage } from "../../../lib/upload-rich-text-image"

const Schema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase kebab-case only")
    .optional()
    .or(z.literal("")),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  cover_image_url: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  published_at: z.string().optional(),
  unpublished_at: z.string().optional(),
  category_id: z.string().optional(),
  tags: z.string().optional(),
  author: z.string().optional(),
})

export type BlogFormValues = z.infer<typeof Schema>

const toLocalInput = (value?: string | Date | null) => {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const BlogForm = ({
  initial,
  onCancel,
}: {
  initial?: any
  onCancel?: () => void
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateBlogPost()
  const update = useUpdateBlogPost(initial?.id ?? "")
  const [uploading, setUploading] = useState(false)
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initial?.country_codes ?? []
  )

  const { regions } = useRegions({ limit: 100 })
  const { blog_categories } = useBlogCategories({ limit: 100 })

  const countries = useMemo(() => {
    const list: { iso_2: string; name: string }[] = []
    for (const r of regions ?? []) {
      for (const c of r.countries ?? []) {
        if (c.iso_2) {
          list.push({ iso_2: c.iso_2.toLowerCase(), name: c.name ?? c.iso_2 })
        }
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [regions])

  const form = useForm<BlogFormValues>({
    defaultValues: initial
      ? {
          title: initial.title ?? "",
          slug: initial.slug ?? "",
          excerpt: initial.excerpt ?? "",
          content: initial.content ?? "",
          cover_image_url: initial.cover_image_url ?? "",
          status: initial.status ?? "draft",
          published_at: toLocalInput(initial.published_at),
          unpublished_at: toLocalInput(initial.unpublished_at),
          category_id: initial.category_id ?? "",
          tags: (initial.tags ?? []).join(", "),
          author: initial.author ?? "",
        }
      : {
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          cover_image_url: "",
          status: "draft",
          published_at: "",
          unpublished_at: "",
          category_id: "",
          tags: "",
          author: "",
        },
    resolver: zodResolver(Schema),
  })

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploaded = await sdk.admin.uploads.mutate({ files: [file] })
      const url = uploaded.files?.[0]?.url
      if (url) form.setValue("cover_image_url", url)
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const toggleCountry = (iso: string) => {
    setSelectedCountries((prev) =>
      prev.includes(iso) ? prev.filter((c) => c !== iso) : [...prev, iso]
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload: Record<string, unknown> = {
        title: values.title,
        slug: values.slug || undefined,
        excerpt: values.excerpt || null,
        content: values.content || null,
        cover_image_url: values.cover_image_url || null,
        status: values.status,
        published_at: values.published_at
          ? new Date(values.published_at).toISOString()
          : values.status === "published"
            ? new Date().toISOString()
            : null,
        unpublished_at: values.unpublished_at
          ? new Date(values.unpublished_at).toISOString()
          : null,
        country_codes: selectedCountries.length ? selectedCountries : [],
        category_id: values.category_id || null,
        tags: values.tags
          ? values.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        author: values.author || null,
      }
      if (initial?.id) {
        await update.mutateAsync(payload)
        toast.success(t("marketplace.blog.toast_update"))
      } else {
        await create.mutateAsync(payload)
        toast.success(t("marketplace.blog.toast_create"))
      }
      navigate("/blog")
    } catch (err: any) {
      toast.error(err?.message ?? "Failed")
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 p-6">
        <Form.Field
          control={form.control}
          name="title"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t("marketplace.blog.title")}</Form.Label>
              <Form.Control>
                <Input {...field} data-testid="blog-title-input" />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="slug"
          render={({ field }) => (
            <Form.Item>
              <Form.Label optional>{t("marketplace.blog.slug")}</Form.Label>
              <Form.Control>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="auto-from-title"
                  data-testid="blog-slug-input"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <Form.Item>
              <Form.Label optional>{t("marketplace.blog.excerpt")}</Form.Label>
              <Form.Control>
                <Textarea {...field} value={field.value ?? ""} rows={2} />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="content"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t("marketplace.blog.content")}</Form.Label>
              <Form.Control>
                <div data-testid="blog-content-editor">
                  <RichTextEditor
                    {...field}
                    onUpload={uploadRichTextImage}
                    data-testid="blog-content-editor-input"
                  />
                </div>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        <Form.Field
          control={form.control}
          name="cover_image_url"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t("marketplace.blog.coverImage")}</Form.Label>
              <Form.Control>
                <div className="flex flex-col gap-2">
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="https://..."
                  />
                  <input
                    type="file"
                    accept="image/*"
                    aria-label={t("marketplace.blog.coverImage")}
                    onChange={handleFile}
                    disabled={uploading}
                  />
                </div>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        {form.watch("cover_image_url") && (
          <img
            src={form.watch("cover_image_url")}
            alt=""
            className="h-40 w-full object-cover rounded"
          />
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="status"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("marketplace.blog.status")}</Form.Label>
                <Form.Control>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <Select.Trigger data-testid="blog-status-select">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="draft">
                        {t("marketplace.blog.statusDraft")}
                      </Select.Item>
                      <Select.Item value="published">
                        {t("marketplace.blog.statusPublished")}
                      </Select.Item>
                    </Select.Content>
                  </Select>
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("marketplace.blog.category")}
                </Form.Label>
                <Form.Control>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? "" : v)
                    }
                  >
                    <Select.Trigger data-testid="blog-category-select">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="none">
                        {t("marketplace.blog.noCategory")}
                      </Select.Item>
                      {(blog_categories ?? []).map((c: any) => (
                        <Select.Item key={c.id} value={c.id}>
                          {c.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="published_at"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("marketplace.blog.publishedAt")}
                </Form.Label>
                <Form.Control>
                  <Input type="datetime-local" {...field} value={field.value ?? ""} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="unpublished_at"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("marketplace.blog.unpublishedAt")}
                </Form.Label>
                <Form.Control>
                  <Input type="datetime-local" {...field} value={field.value ?? ""} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="tags"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>{t("marketplace.blog.tags")}</Form.Label>
                <Form.Control>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="fashion, tips"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="author"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>{t("marketplace.blog.author")}</Form.Label>
                <Form.Control>
                  <Input {...field} value={field.value ?? ""} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>
        <Container className="divide-y p-4">
          <div className="flex items-center justify-between gap-2 pb-3">
            <Heading level="h3">{t("marketplace.blog.countries")}</Heading>
            <Button
              size="small"
              variant="secondary"
              type="button"
              onClick={() => setSelectedCountries([])}
            >
              {t("marketplace.blog.countriesAll")}
            </Button>
          </div>
          <Text className="py-2 text-ui-fg-subtle">
            {t("marketplace.blog.countriesHint")}
          </Text>
          <div className="flex flex-wrap gap-3 pt-3">
            {countries.map((c) => (
              <label
                key={c.iso_2}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={selectedCountries.includes(c.iso_2)}
                  onChange={() => toggleCountry(c.iso_2)}
                  aria-label={`${c.name} (${c.iso_2.toUpperCase()})`}
                  data-testid={`blog-country-${c.iso_2}`}
                />
                <span>
                  {c.name} ({c.iso_2.toUpperCase()})
                </span>
              </label>
            ))}
          </div>
        </Container>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="secondary" type="button" onClick={onCancel}>
              {t("actions.cancel")}
            </Button>
          )}
          <Button
            variant="primary"
            type="submit"
            isLoading={create.isPending || update.isPending}
            data-testid="blog-submit-button"
          >
            {initial?.id
              ? t("marketplace.blog.save")
              : t("marketplace.blog.create")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
