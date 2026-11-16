import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import type { HttpTypes } from "@medusajs/types"
import { normalizeHomeLayout, type HomeLayoutSection } from "@mercurjs/types"
import { usePermissionGate } from "@mercurjs/dashboard-shared"
import { Button, Container, Heading, Switch, Text, toast } from "@medusajs/ui"

import { SortableList } from "../../../../../components/common/sortable-list"
import { useUpdateStore } from "../../../../../hooks/api/store"

type MarketplaceHomeLayoutSectionProps = {
  store: HttpTypes.AdminStore
}

export const MarketplaceHomeLayoutSection = ({
  store,
}: MarketplaceHomeLayoutSectionProps) => {
  const { t } = useTranslation()
  const { allowed } = usePermissionGate("store:edit")
  const updateStore = useUpdateStore(store.id)

  const [sections, setSections] = useState<HomeLayoutSection[]>(() =>
    normalizeHomeLayout(
      (store.metadata as Record<string, unknown> | null)?.home_layout ?? null
    )
  )

  const dirty = useMemo(() => {
    const saved = normalizeHomeLayout(
      (store.metadata as Record<string, unknown> | null)?.home_layout ?? null
    )
    return JSON.stringify(saved) !== JSON.stringify(sections)
  }, [store.metadata, sections])

  const handleToggle = (id: string, enabled: boolean) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, enabled } : section
      )
    )
  }

  const handleSave = async () => {
    try {
      await updateStore.mutateAsync({
        metadata: {
          ...store.metadata,
          home_layout: { sections },
        },
      })
      toast.success(t("marketplace.homeLayout.toast_update"))
    } catch (error: any) {
      toast.error(error?.message ?? "Failed")
    }
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid="marketplace-home-layout-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" data-testid="marketplace-home-layout-heading">
            {t("marketplace.homeLayout.header")}
          </Heading>
          <Text
            className="text-ui-fg-subtle"
            size="small"
            data-testid="marketplace-home-layout-subtitle"
          >
            {t("marketplace.homeLayout.subtitle")}
          </Text>
        </div>
        {allowed && (
          <Button
            size="small"
            variant="secondary"
            isLoading={updateStore.isPending}
            disabled={!dirty}
            onClick={handleSave}
            data-testid="marketplace-home-layout-save"
          >
            {t("actions.save")}
          </Button>
        )}
      </div>
      <div className="px-6 py-4" data-testid="marketplace-home-layout-list">
        <SortableList
          items={sections}
          onChange={setSections}
          renderItem={(item) => (
            <SortableList.Item
              id={item.id}
              className="bg-ui-bg-component shadow-elevation-card-rest mb-2 flex items-center gap-1.5 rounded-xl p-1.5 last:mb-0"
            >
              <SortableList.DragHandle />
              <Text
                weight="plus"
                className="flex-1 truncate pl-1"
                data-testid={`marketplace-home-layout-label-${item.id}`}
              >
                {t(`marketplace.homeLayout.sections.${item.id}`)}
              </Text>
              <Switch
                checked={item.enabled}
                disabled={!allowed}
                onCheckedChange={(checked) => handleToggle(item.id, checked)}
                data-testid={`marketplace-home-layout-toggle-${item.id}`}
              />
            </SortableList.Item>
          )}
        />
      </div>
    </Container>
  )
}
