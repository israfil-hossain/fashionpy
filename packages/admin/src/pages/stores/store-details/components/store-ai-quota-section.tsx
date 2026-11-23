import { useState } from "react";
import { Sparkles } from "@medusajs/icons";
import { Button, Container, Heading, Input, Text, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";
import { useUpdateSeller } from "../../../../hooks/api/sellers";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

const DEFAULT_QUOTA = 20;

const readNumber = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
};

export const StoreAiQuotaSection = ({ seller }: { seller: Seller }) => {
  const { t } = useTranslation();
  const metadata = (seller.metadata ?? {}) as Record<string, unknown>;
  const used = readNumber(metadata.ai_product_generations) ?? 0;
  const quota = readNumber(metadata.ai_product_quota) ?? DEFAULT_QUOTA;
  const remaining = Math.max(quota - used, 0);

  const [limit, setLimit] = useState(String(quota));
  const update = useUpdateSeller(seller.id);

  const saveLimit = async () => {
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast.error(t("store.aiQuota.errors.invalid"));
      return;
    }

    try {
      await update.mutateAsync({
        metadata: { ...metadata, ai_product_quota: parsed },
      });
      toast.success(t("store.aiQuota.success.limit", { limit: parsed }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("store.aiQuota.errors.failed"),
      );
    }
  };

  const resetUsage = async () => {
    try {
      await update.mutateAsync({
        metadata: { ...metadata, ai_product_generations: 0 },
      });
      toast.success(t("store.aiQuota.success.reset"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("store.aiQuota.errors.failed"),
      );
    }
  };

  return (
    <Container className="divide-y p-0" data-testid="store-ai-quota-section">
      <div className="flex items-center gap-x-2 px-6 py-4">
        <Sparkles className="text-ui-fg-subtle" />
        <Heading level="h2">{t("store.aiQuota.header")}</Heading>
      </div>

      <div className="flex flex-col gap-y-2 px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {t("store.aiQuota.usage", { used, quota, remaining })}
        </Text>

        <div className="flex items-end gap-x-2">
          <div className="flex flex-1 flex-col gap-y-1">
            <Text size="xsmall" weight="plus">
              {t("store.aiQuota.limitLabel")}
            </Text>
            <Input
              type="number"
              min={0}
              step={1}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              data-testid="store-ai-quota-limit-input"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={saveLimit}
            isLoading={update.isPending}
            data-testid="store-ai-quota-limit-save"
          >
            {t("actions.save")}
          </Button>
        </div>

        <Button
          type="button"
          variant="transparent"
          size="small"
          className="w-fit px-0"
          onClick={resetUsage}
          isLoading={update.isPending}
          data-testid="store-ai-quota-reset"
        >
          {t("store.aiQuota.reset")}
        </Button>
      </div>
    </Container>
  );
};