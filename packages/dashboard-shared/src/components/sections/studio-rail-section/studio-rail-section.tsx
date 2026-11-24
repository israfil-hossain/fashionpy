import { useState } from "react"

import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"

export const STUDIO_RAIL_KEYS = {
  enabled: "show_in_studio_rail",
  thumbnail: "studio_rail_thumbnail",
  front: "studio_rail_front_image",
  back: "studio_rail_back_image",
} as const

type StudioRailMetadata = Record<string, unknown>

type StudioRailProduct = {
  id: string
  metadata?: StudioRailMetadata | null
}

export type StudioRailSectionProps = {
  product: StudioRailProduct
  onSave: (metadata: StudioRailMetadata) => Promise<void>
}

const readFlag = (value: unknown) => value === true || value === "true"

const readUrl = (value: unknown) => (typeof value === "string" ? value : "")

const UrlField = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
}) => (
  <div className="flex flex-col gap-y-1">
    <Text size="small" weight="plus" leading="compact">
      {label}
    </Text>
    <Input
      value={value}
      onChange={(event) => {
        onChange(event.target.value)
      }}
      placeholder="https://..."
    />
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      {hint}
    </Text>
  </div>
)

export const StudioRailSection = ({
  product,
  onSave,
}: StudioRailSectionProps) => {
  const metadata = product.metadata ?? {}

  const [enabled, setEnabled] = useState(() => readFlag(metadata[STUDIO_RAIL_KEYS.enabled]))
  const [thumbnail, setThumbnail] = useState(() =>
    readUrl(metadata[STUDIO_RAIL_KEYS.thumbnail]),
  )
  const [front, setFront] = useState(() => readUrl(metadata[STUDIO_RAIL_KEYS.front]))
  const [back, setBack] = useState(() => readUrl(metadata[STUDIO_RAIL_KEYS.back]))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const change = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)

    const next: StudioRailMetadata = { ...metadata, [STUDIO_RAIL_KEYS.enabled]: enabled }
    const urls: [string, string][] = [
      [STUDIO_RAIL_KEYS.thumbnail, thumbnail.trim()],
      [STUDIO_RAIL_KEYS.front, front.trim()],
      [STUDIO_RAIL_KEYS.back, back.trim()],
    ]
    for (const [key, value] of urls) {
      if (value) {
        next[key] = value
      } else {
        delete next[key]
      }
    }

    try {
      await onSave(next)
      setDirty(false)
      toast.success("Studio rail settings saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save studio rail settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="p-0" data-testid="studio-rail-section">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div className="flex items-center gap-x-3">
          <Heading level="h2">Studio Rail</Heading>
          <Badge size="2xsmall" rounded="full">
            {enabled ? "On" : "Off"}
          </Badge>
        </div>
        <Button
          size="small"
          variant="secondary"
          onClick={handleSave}
          disabled={!dirty || saving}
          isLoading={saving}
          data-testid="studio-rail-save"
        >
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-y-5 px-6 py-4">
        <div className="bg-ui-bg-component flex items-start gap-x-3 rounded-lg p-3">
          <Switch
            dir="ltr"
            checked={enabled}
            onCheckedChange={change(setEnabled)}
            data-testid="studio-rail-enabled"
          />
          <div>
            <Text size="small" weight="plus" leading="compact">
              Show in studio rail
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              When on, this product appears on the storefront studio rail.
            </Text>
          </div>
        </div>

        <UrlField
          label="Studio rail thumbnail"
          hint="The hanging/side photo shown when the garment is at rest. Leave blank to use the product thumbnail."
          value={thumbnail}
          onChange={change(setThumbnail)}
        />
        <UrlField
          label="Front image"
          hint="The photo the garment turns to on hover. Leave blank to use the first product image."
          value={front}
          onChange={change(setFront)}
        />
        <UrlField
          label="Back image"
          hint="Shown on the Back tab of the quick view. Leave blank to use the next product image."
          value={back}
          onChange={change(setBack)}
        />
      </div>
    </Container>
  )
}
