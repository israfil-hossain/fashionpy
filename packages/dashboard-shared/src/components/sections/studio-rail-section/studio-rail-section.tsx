import { useState } from "react"

import { ChevronDownMini } from "@medusajs/icons"

import {
  Badge,
  Button,
  Container,
  Heading,
  Switch,
  Text,
  toast,
  clx,
} from "@medusajs/ui"

import {
  STUDIO_RAIL_IMAGE_PROMPTS,
  STUDIO_RAIL_PROMPT_STEPS,
} from "./image-prompt"

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
  images?: { id?: string; url: string }[] | null
  thumbnail?: string | null
}

export type StudioRailSectionProps = {
  product: StudioRailProduct
  onSave: (metadata: StudioRailMetadata) => Promise<void>
}

const readFlag = (value: unknown) => value === true || value === "true"

const readUrl = (value: unknown) => (typeof value === "string" ? value : "")

export const getStudioRailImageOptions = (product: StudioRailProduct) => {
  const options: { url: string; label: string }[] = []

  const add = (url: unknown, label: string) => {
    if (typeof url !== "string" || !url.trim()) return
    const existing = options.find(option => option.url === url)
    if (existing) {
      existing.label = label
      return
    }
    options.push({ url, label })
  }

  product.images?.forEach((image, index) => add(image?.url, `Image ${index + 1}`))
  add(product.thumbnail, "Thumbnail")

  return options
}

const ImagePicker = ({
  label,
  hint,
  value,
  options,
  onChange,
  testId,
}: {
  label: string
  hint: string
  value: string
  options: { url: string; label: string }[]
  onChange: (value: string) => void
  testId: string
}) => {
  const choices = value && !options.some(option => option.url === value)
    ? [{ url: value, label: "Current image" }, ...options]
    : options

  return (
    <div className="flex flex-col gap-y-2">
      <Text size="small" weight="plus" leading="compact">
        {label}
      </Text>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={!value}
          onClick={() => onChange("")}
          className={clx(
            "border-ui-border-base text-ui-fg-subtle rounded-md border px-3 py-2 text-xs",
            !value && "border-ui-border-interactive bg-ui-bg-base text-ui-fg-base"
          )}
          data-testid={`${testId}-none`}
        >
          None
        </button>
        {choices.map(option => (
          <button
            key={option.url}
            type="button"
            aria-pressed={value === option.url}
            aria-label={option.label}
            title={option.url}
            onClick={() => onChange(option.url)}
            className={clx(
              "border-ui-border-base relative size-16 overflow-hidden rounded-md border",
              value === option.url &&
                "border-ui-border-interactive ring-ui-bg-interactive ring-2 ring-inset"
            )}
            data-testid={`${testId}-option`}
            data-selected={value === option.url ? "true" : "false"}
          >
            <img
              src={option.url}
              alt={option.label}
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {hint}
      </Text>
      {!choices.length && (
        <Text size="small" leading="compact" className="text-ui-fg-muted">
          Upload images in the product media section to select them here.
        </Text>
      )}
    </div>
  )
}

export const StudioRailSection = ({
  product,
  onSave,
}: StudioRailSectionProps) => {
  const metadata = product.metadata ?? {}
  const imageOptions = getStudioRailImageOptions(product)

  const [enabled, setEnabled] = useState(() => readFlag(metadata[STUDIO_RAIL_KEYS.enabled]))
  const [thumbnail, setThumbnail] = useState(() =>
    readUrl(metadata[STUDIO_RAIL_KEYS.thumbnail]),
  )
  const [front, setFront] = useState(() => readUrl(metadata[STUDIO_RAIL_KEYS.front]))
  const [back, setBack] = useState(() => readUrl(metadata[STUDIO_RAIL_KEYS.back]))
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [openPromptKey, setOpenPromptKey] = useState<string | null>(null)

  const change = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setDirty(true)
  }

  const handleCopyPrompt = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success("Studio Rail prompt copied")
    } catch {
      toast.error("Could not copy the prompt. Select the text and copy it manually.")
    }
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
        <div className="flex items-center gap-x-2">
          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={() => setOpen(value => !value)}
            data-testid="studio-rail-toggle"
          >
            {open ? "Hide" : "View"}
            <ChevronDownMini className={clx({ "rotate-180": open })} />
          </Button>
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
      </div>

      {open && <div className="flex flex-col gap-y-5 px-6 py-4">
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

        <div className="border-ui-border-base flex flex-col gap-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-x-4">
            <div>
              <Text size="small" weight="plus" leading="compact">
                Standard image prompts
              </Text>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                Use these prompts for every product so all studio rail images match.
              </Text>
            </div>
            <div className="flex items-center gap-x-2">
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={() => setPromptOpen(value => !value)}
                data-testid="studio-rail-prompt-toggle"
              >
                {promptOpen ? "Hide prompts" : "View prompts"}
                <ChevronDownMini className={clx({ "rotate-180": promptOpen })} />
              </Button>
            </div>
          </div>
          {promptOpen && (
            <>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                Generate one image at a time with the matching prompt below. Never put all three views in a single file.
              </Text>
              {STUDIO_RAIL_IMAGE_PROMPTS.map(item => {
                const expanded = openPromptKey === item.key
                return (
                  <div
                    key={item.key}
                    className="border-ui-border-base flex flex-col gap-y-2 rounded-md border p-3"
                  >
                    <div className="flex items-center justify-between gap-x-2">
                      <Text size="small" weight="plus" leading="compact">
                        {item.title}
                      </Text>
                      <div className="flex items-center gap-x-2">
                        <Button
                          type="button"
                          size="small"
                          variant="secondary"
                          onClick={() =>
                            setOpenPromptKey(expanded ? null : item.key)
                          }
                          data-testid={`studio-rail-prompt-toggle-${item.key}`}
                        >
                          {expanded ? "Hide" : "View"}
                          <ChevronDownMini
                            className={clx({ "rotate-180": expanded })}
                          />
                        </Button>
                        <Button
                          type="button"
                          size="small"
                          variant="secondary"
                          onClick={() => handleCopyPrompt(item.prompt)}
                          data-testid={`studio-rail-copy-prompt-${item.key}`}
                        >
                          Copy prompt
                        </Button>
                      </div>
                    </div>
                    {expanded && (
                      <pre
                        className="text-ui-fg-subtle bg-ui-bg-component max-h-56 overflow-auto whitespace-pre-wrap rounded-md p-3 text-xs"
                        data-testid={`studio-rail-prompt-${item.key}`}
                      >
                        {item.prompt}
                      </pre>
                    )}
                  </div>
                )
              })}
              <div className="flex flex-col gap-y-2">
                <Text size="small" weight="plus" leading="compact">
                  How to generate and use the images
                </Text>
                <ol className="text-ui-fg-subtle list-decimal space-y-1 pl-5 text-xs">
                  {STUDIO_RAIL_PROMPT_STEPS.map(step => (
                    <li key={step.title}>
                      <span className="text-ui-fg-base font-medium">{step.title}:</span>{" "}
                      {step.body}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>

        <ImagePicker
          label="Studio rail thumbnail"
          hint="The hanging/side photo shown when the garment is at rest. Leave blank to use the product thumbnail."
          value={thumbnail}
          options={imageOptions}
          onChange={change(setThumbnail)}
          testId="studio-rail-thumbnail"
        />
        <ImagePicker
          label="Front image"
          hint="The photo the garment turns to on hover. Leave blank to use the first product image."
          value={front}
          options={imageOptions}
          onChange={change(setFront)}
          testId="studio-rail-front"
        />
        <ImagePicker
          label="Back image"
          hint="Shown on the Back tab of the quick view. Leave blank to use the next product image."
          value={back}
          options={imageOptions}
          onChange={change(setBack)}
          testId="studio-rail-back"
        />
      </div>
      }
    </Container>
  )
}
