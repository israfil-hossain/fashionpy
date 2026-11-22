import { PencilSquare, Sparkles } from "@medusajs/icons";
import { Badge, Button, Container, Heading, Tooltip, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { HttpTypes } from "@medusajs/types";
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared";
import { useAiEnrichProduct } from "../../../../../hooks/api/products";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { SectionRow } from "../../../../../components/common/section";

export const ProductOrganizationSection = ({
  product,
}: {
  product: HttpTypes.AdminProduct;
}) => {
  const { t } = useTranslation();
  const enrich = useAiEnrichProduct();

  const handleEnrich = async () => {
    try {
      await enrich.mutateAsync({ $id: product.id });
      toast.success(t("products.organization.aiSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("products.organization.aiFailed"),
      );
    }
  };

  return (
    <Container
      className="divide-y p-0"
      data-testid="product-organization-section"
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="product-organization-header"
      >
        <Heading level="h2" data-testid="product-organization-title">
          {t("products.organization.header")}
        </Heading>
        <div className="flex items-center gap-x-2">
          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={handleEnrich}
            isLoading={enrich.isPending}
            data-testid="product-organization-ai-enrich"
          >
            <Sparkles />
            {t("products.organization.aiEnrich")}
          </Button>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    to: "organization",
                    permission: "products:edit",
                    icon: <PencilSquare />,
                  },
                ],
              },
            ]}
            data-testid="product-organization-action-menu"
          />
        </div>
      </div>

      <SectionRow
        title={t("fields.category")}
        value={
          product.categories?.length
            ? product.categories.map((pcat) => (
                <OrganizationTag
                  key={pcat.id}
                  label={pcat.name}
                  to={`/categories/${pcat.id}`}
                />
              ))
            : undefined
        }
        data-testid="product-categories-row"
      />

      <SectionRow
        title={t("fields.collection")}
        value={
          product.collection ? (
            <OrganizationTag
              label={product.collection.title}
              to={`/collections/${product.collection.id}`}
            />
          ) : undefined
        }
        data-testid="product-collection-row"
      />

      <SectionRow
        title={t("fields.tags")}
        value={
          product.tags?.length
            ? product.tags.map((tag) => (
                <OrganizationTag
                  key={tag.id}
                  label={tag.value}
                  to={`/settings/product-tags/${tag.id}`}
                />
              ))
            : undefined
        }
        data-testid="product-tags-row"
      />

      <SectionRow
        title={t("fields.type")}
        value={
          product.type ? (
            <OrganizationTag
              label={product.type.value}
              to={`/settings/product-types/${product.type_id}`}
            />
          ) : undefined
        }
        data-testid="product-type-row"
      />
      <DisplayExtensionZone model="product" zone="organize" data={product} />
    </Container>
  );
};

const OrganizationTag = ({ label, to }: { label: string; to: string }) => {
  return (
    <Tooltip content={label}>
      <Badge size="2xsmall" className="block w-fit truncate" asChild>
        <Link
          to={to}
          data-testid={`organization-tag-${label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {label}
        </Link>
      </Badge>
    </Tooltip>
  );
};
