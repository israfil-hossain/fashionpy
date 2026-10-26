import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Badge, Button, Container, Heading, Input, Select, Table, Text, toast } from "@medusajs/ui"
import { Plus, Trash, PencilSquare } from "@medusajs/icons"

import { SingleColumnPage } from "../../../components/layout/pages"
import { Form } from "../../../components/common/form"
import {
  useHeroBanners,
  useCreateHeroBanner,
  useUpdateHeroBanner,
} from "../../../hooks/api/hero-banners"
import { sdk } from "../../../lib/client"

const Schema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().url(),
  cta_text: z.string().optional().nullable(),
  cta_link: z.string().optional().nullable(),
  text_position: z.enum(["left", "center", "right"]).default("left"),
  slot: z.enum(["hero", "company_1", "company_2", "offer_price"]).default("hero"),
  is_active: z.boolean().default(true),
  rank: z.coerce.number().int().min(0).default(0),
})

type FormValues = z.infer<typeof Schema>

const empty: FormValues = {
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  cta_text: "",
  cta_link: "",
  text_position: "left",
  slot: "hero",
  is_active: true,
  rank: 0,
}

const BannerForm = ({
  initial,
  onDone,
}: {
  initial?: any
  onDone: () => void
}) => {
  const { t } = useTranslation()
  const create = useCreateHeroBanner()
  const update = useUpdateHeroBanner(initial?.id ?? "")
  const [uploading, setUploading] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: initial
      ? {
          title: initial.title ?? "",
          subtitle: initial.subtitle ?? "",
          description: initial.description ?? "",
          image_url: initial.image_url ?? "",
          cta_text: initial.cta_text ?? "",
          cta_link: initial.cta_link ?? "",
          text_position: initial.text_position ?? "left",
          slot: initial.slot ?? "hero",
          is_active: initial.is_active ?? true,
          rank: initial.rank ?? 0,
        }
      : empty,
    resolver: zodResolver(Schema),
  })

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploaded = await sdk.admin.uploads.mutate({ files: [file] })
      const url = uploaded.files?.[0]?.url
      if (url) form.setValue("image_url", url)
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        title: values.title,
        subtitle: values.subtitle || null,
        description: values.description || null,
        image_url: values.image_url,
        cta_text: values.cta_text || null,
        cta_link: values.cta_link || null,
        text_position: values.text_position,
        slot: values.slot,
        is_active: values.is_active,
        rank: values.rank,
      }
      if (initial?.id) {
        await update.mutateAsync(payload)
        toast.success(t("marketplace.banners.toast_update"))
      } else {
        await create.mutateAsync(payload)
        toast.success(t("marketplace.banners.toast_create"))
      }
      onDone()
    } catch (err: any) {
      toast.error(err?.message ?? "Failed")
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 p-6">
      <Form.Field control={form.control} name="title" render={({ field }) => (
        <Form.Item>
          <Form.Label>{t("marketplace.banners.title")}</Form.Label>
          <Form.Control><Input {...field} /></Form.Control>
          <Form.ErrorMessage />
        </Form.Item>
      )} />
      <Form.Field control={form.control} name="image_url" render={({ field }) => (
        <Form.Item>
          <Form.Label>{t("marketplace.banners.image")}</Form.Label>
          <Form.Control>
            <div className="flex flex-col gap-2">
              <Input {...field} placeholder="https://..." />
              <input type="file" accept="image/*" aria-label="Upload image" onChange={handleFile} disabled={uploading} />
            </div>
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Item>
      )} />
      {form.watch("image_url") && (
        <img src={form.watch("image_url")} alt="" className="h-32 w-full object-cover rounded" />
      )}
      <Form.Field control={form.control} name="subtitle" render={({ field }) => (
        <Form.Item>
          <Form.Label>{t("marketplace.banners.subtitle")}</Form.Label>
          <Form.Control><Input {...field} value={field.value ?? ""} /></Form.Control>
        </Form.Item>
      )} />
      <Form.Field control={form.control} name="description" render={({ field }) => (
        <Form.Item>
          <Form.Label>{t("marketplace.banners.description")}</Form.Label>
          <Form.Control><Input {...field} value={field.value ?? ""} /></Form.Control>
        </Form.Item>
      )} />
      <Form.Field control={form.control} name="cta_text" render={({ field }) => (
        <Form.Item>
          <Form.Label>{t("marketplace.banners.ctaText")}</Form.Label>
          <Form.Control><Input {...field} value={field.value ?? ""} /></Form.Control>
        </Form.Item>
      )} />
      <Form.Field control={form.control} name="cta_link" render={({ field }) => (
        <Form.Item>
          <Form.Label>{t("marketplace.banners.ctaLink")}</Form.Label>
          <Form.Control><Input {...field} value={field.value ?? ""} /></Form.Control>
        </Form.Item>
      )} />
      <Form.Field control={form.control} name="text_position" render={({ field }) => (
        <Form.Item>
          <Form.Label>{t("marketplace.banners.textPosition")}</Form.Label>
          <Form.Control>
            <Select value={field.value} onValueChange={field.onChange}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="left">Left</Select.Item>
                <Select.Item value="center">Center</Select.Item>
                <Select.Item value="right">Right</Select.Item>
              </Select.Content>
            </Select>
          </Form.Control>
        </Form.Item>
      )} />
      <Form.Field control={form.control} name="slot" render={({ field }) => (
        <Form.Item>
          <Form.Label>{t("marketplace.banners.slot")}</Form.Label>
          <Form.Control>
            <Select value={field.value} onValueChange={field.onChange}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="hero">{t("marketplace.banners.slotHero")}</Select.Item>
                <Select.Item value="company_1">{t("marketplace.banners.slotCompany1")}</Select.Item>
                <Select.Item value="company_2">{t("marketplace.banners.slotCompany2")}</Select.Item>
                <Select.Item value="offer_price">{t("marketplace.banners.slotOffer")}</Select.Item>
              </Select.Content>
            </Select>
          </Form.Control>
        </Form.Item>
      )} />
      <Form.Field control={form.control} name="rank" render={({ field }) => (
        <Form.Item>
          <Form.Label>{t("marketplace.banners.rank")}</Form.Label>
          <Form.Control><Input type="number" {...field} /></Form.Control>
        </Form.Item>
      )} />
      <Form.Field control={form.control} name="is_active" render={({ field }) => (
        <Form.Item>
          <Form.Label>{t("marketplace.banners.isActive")}</Form.Label>
          <Form.Control>
            <Select value={field.value ? "true" : "false"} onValueChange={(v) => field.onChange(v === "true")}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="true">Yes</Select.Item>
                <Select.Item value="false">No</Select.Item>
              </Select.Content>
            </Select>
          </Form.Control>
        </Form.Item>
      )} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" isLoading={create.isPending || update.isPending}>Save</Button>
      </div>
    </form>
    </Form>
  )
}

const Root = () => {
  const { t } = useTranslation()
  const { hero_banners, isLoading, isError, error, refetch } = useHeroBanners({ order: "rank" })
  const [editing, setEditing] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const [slotFilter, setSlotFilter] = useState<string>("all")

  if (isError) throw error

  const slotLabel = (slot?: string) =>
    slot === "company_1"
      ? t("marketplace.banners.slotCompany1")
      : slot === "company_2"
        ? t("marketplace.banners.slotCompany2")
        : slot === "offer_price"
          ? t("marketplace.banners.slotOffer")
          : t("marketplace.banners.slotHero")

  const visibleBanners = (hero_banners ?? []).filter(
    (b: any) => slotFilter === "all" || (b.slot ?? "hero") === slotFilter
  )

  const handleDelete = async (id: string) => {
    try {
      await sdk.admin.hero_banners.$id.delete({ $id: id })
      toast.success(t("marketplace.banners.toast_delete"))
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed")
    }
  }

  return (
    <SingleColumnPage data-testid="hero-banners-page">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <Heading level="h2">{t("marketplace.banners.header")}</Heading>
          <div className="flex items-center gap-2">
            <Select value={slotFilter} onValueChange={setSlotFilter}>
              <Select.Trigger className="w-[220px]" data-testid="banners-slot-filter">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">{t("marketplace.banners.slotAll")}</Select.Item>
                <Select.Item value="hero">{t("marketplace.banners.slotHero")}</Select.Item>
                <Select.Item value="company_1">{t("marketplace.banners.slotCompany1")}</Select.Item>
                <Select.Item value="company_2">{t("marketplace.banners.slotCompany2")}</Select.Item>
                <Select.Item value="offer_price">{t("marketplace.banners.slotOffer")}</Select.Item>
              </Select.Content>
            </Select>
            <Button size="small" onClick={() => { setCreating(true); setEditing(null) }}>
              <Plus /> {t("marketplace.banners.create")}
            </Button>
          </div>
        </div>
        {(creating || editing) && (
          <BannerForm
            initial={editing}
            onDone={() => { setCreating(false); setEditing(null) }}
          />
        )}
        {isLoading ? (
          <div className="p-6"><Text>{t("general.loading")}</Text></div>
        ) : (hero_banners ?? []).length === 0 ? (
          <div className="p-6"><Text>{t("marketplace.banners.empty")}</Text></div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("marketplace.banners.image")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.banners.title")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.banners.slot")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.banners.ctaLink")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.banners.rank")}</Table.HeaderCell>
                <Table.HeaderCell>{t("marketplace.banners.isActive")}</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visibleBanners.map((b: any) => (
                <Table.Row key={b.id}>
                  <Table.Cell>
                    {b.image_url && <img src={b.image_url} alt={b.title} className="h-10 w-16 object-cover rounded" />}
                  </Table.Cell>
                  <Table.Cell>{b.title}</Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall" color={b.slot && b.slot !== "hero" ? "blue" : "grey"}>
                      {slotLabel(b.slot)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{b.cta_link ?? "—"}</Table.Cell>
                  <Table.Cell>{b.rank}</Table.Cell>
                  <Table.Cell>{b.is_active ? "Yes" : "No"}</Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button size="small" variant="secondary" onClick={() => { setEditing(b); setCreating(false) }}>
                        <PencilSquare />
                      </Button>
                      <Button size="small" variant="danger" onClick={() => handleDelete(b.id)}>
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

export const Component = Root
export const MarketplaceHeroBannersPage = Root
