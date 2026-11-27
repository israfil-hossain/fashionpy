import { useState, useEffect } from "react"

import { Button, Container, Heading, Input, Switch, Text, toast } from "@medusajs/ui"

import { useStore, useUpdateStore } from "../../../hooks/api/store"

type EmailSettings = {
  enabled: boolean
  adminOrderEmail: boolean
  sellerOrderEmail: boolean
  cartReminderEnabled: boolean
  cartReminderHours: number
  wishlistReminderEnabled: boolean
  wishlistReminderDays: number
  cooldownDays: number
}

const defaults: EmailSettings = {
  enabled: true,
  adminOrderEmail: true,
  sellerOrderEmail: true,
  cartReminderEnabled: true,
  cartReminderHours: 24,
  wishlistReminderEnabled: true,
  wishlistReminderDays: 7,
  cooldownDays: 7,
}

const EmailPage = () => {
  const { store } = useStore({ fields: "id,metadata" })
  const update = useUpdateStore(store?.id ?? "")
  const [settings, setSettings] = useState<EmailSettings>(defaults)

  useEffect(() => {
    const stored = store?.metadata?.email_notifications
    if (stored && typeof stored === "object") {
      setSettings({ ...defaults, ...(stored as Partial<EmailSettings>) })
    }
  }, [store?.metadata?.email_notifications])

  const change = <K extends keyof EmailSettings>(key: K, value: EmailSettings[K]) =>
    setSettings(current => ({ ...current, [key]: value }))

  const save = async () => {
    try {
      await update.mutateAsync({
        metadata: { ...(store?.metadata ?? {}), email_notifications: settings },
      })
      toast.success("Email settings saved")
    } catch (error) {
      toast.error((error as Error)?.message || "Could not save email settings")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Email notifications</Heading>
        <Button
          size="small"
          onClick={() => void save()}
          isLoading={update.isPending}
          data-testid="email-settings-save"
        >
          Save
        </Button>
      </div>
      <div className="flex flex-col gap-y-4 px-6 py-6">
        <div className="flex items-center gap-x-3">
          <Switch
            checked={settings.enabled}
            onCheckedChange={value => change("enabled", value)}
            data-testid="email-enabled"
          />
          <Text size="small">Enable email notifications</Text>
        </div>
        <div className="flex items-center gap-x-3">
          <Switch
            checked={settings.adminOrderEmail}
            onCheckedChange={value => change("adminOrderEmail", value)}
            data-testid="email-admin-order"
          />
          <Text size="small">Email admins about new orders</Text>
        </div>
        <div className="flex items-center gap-x-3">
          <Switch
            checked={settings.sellerOrderEmail}
            onCheckedChange={value => change("sellerOrderEmail", value)}
            data-testid="email-seller-order"
          />
          <Text size="small">Email sellers about new orders</Text>
        </div>
        <div className="flex items-center gap-x-3">
          <Switch
            checked={settings.cartReminderEnabled}
            onCheckedChange={value => change("cartReminderEnabled", value)}
            data-testid="email-cart-reminder"
          />
          <Text size="small">Send abandoned cart reminders</Text>
        </div>
        <div className="flex max-w-xs flex-col gap-y-1">
          <Text size="small">Cart reminder after (hours)</Text>
          <Input
            type="number"
            min={1}
            value={settings.cartReminderHours}
            onChange={event => change("cartReminderHours", Number(event.target.value))}
            data-testid="email-cart-hours"
          />
        </div>
        <div className="flex items-center gap-x-3">
          <Switch
            checked={settings.wishlistReminderEnabled}
            onCheckedChange={value => change("wishlistReminderEnabled", value)}
            data-testid="email-wishlist-reminder"
          />
          <Text size="small">Send wishlist reminders</Text>
        </div>
        <div className="flex max-w-xs flex-col gap-y-1">
          <Text size="small">Wishlist reminder after (days)</Text>
          <Input
            type="number"
            min={1}
            value={settings.wishlistReminderDays}
            onChange={event => change("wishlistReminderDays", Number(event.target.value))}
            data-testid="email-wishlist-days"
          />
        </div>
        <div className="flex max-w-xs flex-col gap-y-1">
          <Text size="small">Minimum days between reminders</Text>
          <Input
            type="number"
            min={1}
            value={settings.cooldownDays}
            onChange={event => change("cooldownDays", Number(event.target.value))}
            data-testid="email-cooldown-days"
          />
        </div>
      </div>
    </Container>
  )
}

export default EmailPage
