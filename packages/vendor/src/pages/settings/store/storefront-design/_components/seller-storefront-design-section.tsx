import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Container,
  Heading,
  Switch,
  Text,
  toast,
} from "@medusajs/ui";

import {
  SortableList,
  usePermissionGate,
} from "@mercurjs/dashboard-shared";
import {
  encodeSellerStorefrontLayout,
  normalizeSellerStorefrontLayout,
  SELLER_STOREFRONT_LAYOUT_KEY,
  type HttpTypes,
  type SellerStorefrontLayoutSection,
} from "@mercurjs/types";

import { useUpdateSeller } from "@/hooks/api";
import { getStorefrontLocale, getStorefrontUrl } from "@/lib/storefront-url";

type SellerStorefrontDesignSectionProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

export const SellerStorefrontDesignSection = ({
  seller,
}: SellerStorefrontDesignSectionProps) => {
  const { t } = useTranslation();
  const { allowed } = usePermissionGate("store:edit");
  const updateSeller = useUpdateSeller(seller.id);
  const [previewKey, setPreviewKey] = useState(0);

  const savedSections = useMemo(
    () =>
      normalizeSellerStorefrontLayout(
        (seller.metadata as Record<string, unknown> | null)?.[
          SELLER_STOREFRONT_LAYOUT_KEY
        ] ?? null
      ),
    [seller.metadata]
  );

  const [sections, setSections] = useState<SellerStorefrontLayoutSection[]>(
    savedSections
  );

  const dirty = JSON.stringify(savedSections) !== JSON.stringify(sections);

  const handleToggle = (id: string, enabled: boolean) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, enabled } : section
      )
    );
  };

  const handleSave = async () => {
    try {
      await updateSeller.mutateAsync({
        metadata: {
          ...(seller.metadata ?? {}),
          [SELLER_STOREFRONT_LAYOUT_KEY]: { sections },
        },
      });
      toast.success(t("store.storefrontDesign.toast_update"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("store.storefrontDesign.toast_error")
      );
    }
  };

  const previewPath = `/${getStorefrontLocale()}/sellers/${seller.handle}?layout=${encodeSellerStorefrontLayout(
    sections
  )}`;
  const previewSrc = `${getStorefrontUrl()}${previewPath}`;

  return (
    <Container
      className="divide-y p-0"
      data-testid="seller-storefront-design-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" data-testid="seller-storefront-design-heading">
            {t("store.storefrontDesign.header")}
          </Heading>
          <Text
            className="text-ui-fg-subtle"
            size="small"
            data-testid="seller-storefront-design-subtitle"
          >
            {t("store.storefrontDesign.subtitle")}
          </Text>
        </div>
        {allowed && (
          <Button
            size="small"
            variant="secondary"
            isLoading={updateSeller.isPending}
            disabled={!dirty}
            onClick={handleSave}
            data-testid="seller-storefront-design-save"
          >
            {t("actions.save")}
          </Button>
        )}
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div data-testid="seller-storefront-design-list">
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
                  data-testid={`seller-storefront-design-label-${item.id}`}
                >
                  {t(`store.storefrontDesign.sections.${item.id}`)}
                </Text>
                <Switch
                  checked={item.enabled}
                  disabled={!allowed}
                  onCheckedChange={(checked) => handleToggle(item.id, checked)}
                  data-testid={`seller-storefront-design-toggle-${item.id}`}
                />
              </SortableList.Item>
            )}
          />
        </div>
        <div className="flex flex-col gap-3" data-testid="seller-storefront-design-preview">
          <div className="flex items-center justify-between gap-2">
            <Text className="text-ui-fg-subtle" size="small">
              {t("store.storefrontDesign.previewHint")}
            </Text>
            <div className="flex gap-2">
              <Button
                size="small"
                variant="secondary"
                onClick={() => setPreviewKey((key) => key + 1)}
                data-testid="seller-storefront-design-refresh-preview"
              >
                {t("store.storefrontDesign.refreshPreview")}
              </Button>
              <a href={previewSrc} target="_blank" rel="noreferrer">
                <Button
                  size="small"
                  variant="transparent"
                  data-testid="seller-storefront-design-open-preview"
                >
                  {t("store.storefrontDesign.openPreview")}
                </Button>
              </a>
            </div>
          </div>
          <iframe
            key={previewKey}
            src={previewSrc}
            title={t("store.storefrontDesign.previewTitle")}
            className="h-[720px] w-full rounded-lg border border-ui-border-base bg-ui-bg-base"
            data-testid="seller-storefront-design-iframe"
          />
        </div>
      </div>
    </Container>
  );
};
