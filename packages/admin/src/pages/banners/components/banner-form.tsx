import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"

import { Button, Container, Heading, Input, Select, Text, toast } from "@medusajs/ui"

import { Form } from "../../../components/common/form"
import {
  useCreateHeroBanner,
  useUpdateHeroBanner,
} from "../../../hooks/api/hero-banners"
import { sdk } from "../../../lib/client"

export const SLOT_VALUES = [
  "hero",
  "shop_collection",
  "company_1",
  "company_2",
  "offer_price",
] as const

const Schema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().url(),
  cta_text: z.string().optional().nullable(),
  cta_link: z.string().optional().nullable(),
  text_position: z.enum(["left", "center", "right"]).default("left"),
  slot: z.enum(SLOT_VALUES).default("hero"),
  is_active: z.boolean().default(true),
  rank: z.coerce.number().int().min(0).default(0),
})

export type BannerFormValues = z.infer<typeof Schema>

const empty: BannerFormValues = {
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

export const BannerForm = ({
  initial,
  onCancel,
}: {
  initial?: any
  onCancel: () => void
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateHeroBanner()
  const update = useUpdateHeroBanner(initial?.id ?? "")
  const [uploading, setUploading] = useState(false)

  const form = useForm<BannerFormValues>({
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
      navigate("/banners")
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
                  <Select.Item value="shop_collection">{t("marketplace.banners.slotShopCollection")}</Select.Item>
                  <Select.Item value="company_1">{t("marketplace.banners.slotCompany1")}</Select.Item>
                  <Select.Item value="company_2">{t("marketplace.banners.slotCompany2")}</Select.Item>
                  <Select.Item value="offer_price">{t("marketplace.banners.slotOffer")}</Select.Item>
                </Select.Content>
              </Select>
            </Form.Control>
            {form.watch("slot") === "hero" && (
              <Text size="small" className="text-ui-fg-subtle">
                {t("marketplace.banners.heroHint")}
              </Text>
            )}
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
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" isLoading={create.isPending || update.isPending}>Save</Button>
        </div>
      </form>
    </Form>
  )
}

export const BannerFormContainer = ({
  title,
  initial,
}: {
  title: string
  initial?: any
}) => {
  const navigate = useNavigate()
  return (
    <Container className="divide-y p-0" data-testid="banner-form-page">
      <div className="px-6 py-4">
        <Heading level="h2">{title}</Heading>
      </div>
      <BannerForm initial={initial} onCancel={() => navigate("/banners")} />
    </Container>
  )
}
