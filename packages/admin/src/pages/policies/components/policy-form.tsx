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
  useCreatePolicy,
  useUpdatePolicy,
} from "../../../hooks/api/policies"
import { useRegions } from "../../../hooks/api/regions"
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
  status: z.enum(["draft", "published"]).default("draft"),
  published_at: z.string().optional(),
  unpublished_at: z.string().optional(),
})

export type PolicyFormValues = z.infer<typeof Schema>

const toLocalInput = (value?: string | Date | null) => {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const PolicyForm = ({
  initial,
  onCancel,
}: {
  initial?: any
  onCancel?: () => void
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreatePolicy()
  const update = useUpdatePolicy(initial?.id ?? "")
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initial?.country_codes ?? []
  )

  const { regions } = useRegions({ limit: 100 })

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

  const form = useForm<PolicyFormValues>({
    defaultValues: initial
      ? {
          title: initial.title ?? "",
          slug: initial.slug ?? "",
          excerpt: initial.excerpt ?? "",
          content: initial.content ?? "",
          status: initial.status ?? "draft",
          published_at: toLocalInput(initial.published_at),
          unpublished_at: toLocalInput(initial.unpublished_at),
        }
      : {
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          status: "draft",
          published_at: "",
          unpublished_at: "",
        },
    resolver: zodResolver(Schema),
  })

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
      }
      if (initial?.id) {
        await update.mutateAsync(payload)
        toast.success(t("marketplace.policies.toast_update"))
      } else {
        await create.mutateAsync(payload)
        toast.success(t("marketplace.policies.toast_create"))
      }
      navigate("/policies")
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
              <Form.Label>{t("marketplace.policies.title")}</Form.Label>
              <Form.Control>
                <Input {...field} data-testid="policy-title-input" />
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
              <Form.Label optional>{t("marketplace.policies.slug")}</Form.Label>
              <Form.Control>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="auto-from-title"
                  data-testid="policy-slug-input"
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
              <Form.Label optional>{t("marketplace.policies.excerpt")}</Form.Label>
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
              <Form.Label>{t("marketplace.policies.content")}</Form.Label>
              <Form.Control>
                <div data-testid="policy-content-editor">
                  <RichTextEditor
                    {...field}
                    onUpload={uploadRichTextImage}
                    data-testid="policy-content-editor-input"
                  />
                </div>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Form.Field
            control={form.control}
            name="status"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("marketplace.policies.status")}</Form.Label>
                <Form.Control>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <Select.Trigger data-testid="policy-status-select">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="draft">
                        {t("marketplace.policies.statusDraft")}
                      </Select.Item>
                      <Select.Item value="published">
                        {t("marketplace.policies.statusPublished")}
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
            name="published_at"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("marketplace.policies.publishedAt")}
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
                  {t("marketplace.policies.unpublishedAt")}
                </Form.Label>
                <Form.Control>
                  <Input type="datetime-local" {...field} value={field.value ?? ""} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>
        <Container className="divide-y p-4">
          <div className="flex items-center justify-between gap-2 pb-3">
            <Heading level="h3">{t("marketplace.policies.countries")}</Heading>
            <Button
              size="small"
              variant="secondary"
              type="button"
              onClick={() => setSelectedCountries([])}
            >
              {t("marketplace.policies.countriesAll")}
            </Button>
          </div>
          <Text className="py-2 text-ui-fg-subtle">
            {t("marketplace.policies.countriesHint")}
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
                  data-testid={`policy-country-${c.iso_2}`}
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
            data-testid="policy-submit-button"
          >
            {initial?.id
              ? t("marketplace.policies.save")
              : t("marketplace.policies.create")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
