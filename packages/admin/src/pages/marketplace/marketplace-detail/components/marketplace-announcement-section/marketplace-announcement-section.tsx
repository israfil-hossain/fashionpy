import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Container, Heading, Input, Select, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import type { HttpTypes } from "@medusajs/types"
import { usePermissionGate } from "@mercurjs/dashboard-shared"

import { Form } from "../../../../../components/common/form"
import { useUpdateStore } from "../../../../../hooks/api/store"

type MarketplaceAnnouncementSectionProps = {
  store: HttpTypes.AdminStore
}

type AnnouncementConfig = {
  enabled: boolean
  message: string
  amount: number | null
  link_label: string | null
  link_href: string | null
  starts_at: string | null
  ends_at: string | null
}

type FormValues = {
  enabled: "true" | "false"
  message: string
  amount: string
  link_label: string
  link_href: string
  starts_at: string
  ends_at: string
}

const Schema = z.object({
  enabled: z.enum(["true", "false"]),
  message: z.string().min(1),
  amount: z.string(),
  link_label: z.string(),
  link_href: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
})

const toLocalInput = (iso: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : ""

const fromLocalInput = (value: string) =>
  value ? new Date(value).toISOString() : null

export const MarketplaceAnnouncementSection = ({
  store,
}: MarketplaceAnnouncementSectionProps) => {
  const { t } = useTranslation()
  const { allowed } = usePermissionGate("store:edit")
  const updateStore = useUpdateStore(store.id)

  const announcement = (store.metadata?.announcement ?? null) as AnnouncementConfig | null

  const form = useForm<FormValues>({
    defaultValues: {
      enabled: announcement?.enabled ? "true" : "false",
      message: announcement?.message ?? "",
      amount:
        announcement?.amount === null || announcement?.amount === undefined
          ? ""
          : String(announcement.amount),
      link_label: announcement?.link_label ?? "",
      link_href: announcement?.link_href ?? "",
      starts_at: toLocalInput(announcement?.starts_at ?? null),
      ends_at: toLocalInput(announcement?.ends_at ?? null),
    },
    resolver: zodResolver(Schema),
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: AnnouncementConfig = {
      enabled: values.enabled === "true",
      message: values.message,
      amount: values.amount === "" ? null : Number(values.amount),
      link_label: values.link_label || null,
      link_href: values.link_href || null,
      starts_at: fromLocalInput(values.starts_at),
      ends_at: fromLocalInput(values.ends_at),
    }

    try {
      await updateStore.mutateAsync({
        metadata: {
          ...store.metadata,
          announcement: payload,
        },
      })
      toast.success(t("marketplace.announcement.toast_update"))
    } catch (error: any) {
      toast.error(error?.message ?? "Failed")
    }
  })

  return (
    <Container
      className="divide-y p-0"
      data-testid="marketplace-announcement-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" data-testid="marketplace-announcement-heading">
            {t("marketplace.announcement.header")}
          </Heading>
          <Text
            className="text-ui-fg-subtle"
            size="small"
            data-testid="marketplace-announcement-subtitle"
          >
            {t("marketplace.announcement.messagePlaceholder")}
          </Text>
        </div>
        {allowed && (
          <Button
            size="small"
            variant="secondary"
            isLoading={updateStore.isPending}
            onClick={onSubmit}
            data-testid="marketplace-announcement-save"
          >
            {t("actions.save")}
          </Button>
        )}
      </div>
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 px-6 py-4"
          data-testid="marketplace-announcement-form"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Field
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <Form.Item data-testid="marketplace-announcement-enabled-item">
                  <Form.Label>
                    {t("marketplace.announcement.enabled")}
                  </Form.Label>
                  <Form.Control>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Select.Trigger data-testid="marketplace-announcement-enabled-select">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="true">
                          {t("general.enabled")}
                        </Select.Item>
                        <Select.Item value="false">
                          {t("general.disabled")}
                        </Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="amount"
              render={({ field }) => (
                <Form.Item data-testid="marketplace-announcement-amount-item">
                  <Form.Label>
                    {t("marketplace.announcement.amountLabel")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      {...field}
                      value={field.value ?? ""}
                      data-testid="marketplace-announcement-amount-input"
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
          </div>
          <Form.Field
            control={form.control}
            name="message"
            render={({ field }) => (
              <Form.Item data-testid="marketplace-announcement-message-item">
                <Form.Label>
                  {t("marketplace.announcement.message")}
                </Form.Label>
                <Form.Control>
                  <Input
                    placeholder={t("marketplace.announcement.messagePlaceholder")}
                    {...field}
                    data-testid="marketplace-announcement-message-input"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Field
              control={form.control}
              name="link_label"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t("marketplace.announcement.linkLabel")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      placeholder="Shop Now"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="link_href"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t("marketplace.announcement.linkHrefLabel")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      placeholder={t("marketplace.announcement.linkHrefPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Field
              control={form.control}
              name="starts_at"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t("marketplace.announcement.startsAt")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="ends_at"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t("marketplace.announcement.endsAt")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
          </div>
        </form>
      </Form>
    </Container>
  )
}
