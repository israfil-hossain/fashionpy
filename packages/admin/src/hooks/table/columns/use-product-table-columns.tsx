import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import {
  CategoryCell,
  CategoryHeader,
} from "../../../components/table/table-cells/product/category-cell/category-cell"
import {
  CollectionCell,
  CollectionHeader,
} from "../../../components/table/table-cells/product/collection-cell/collection-cell"
import {
  ProductCell,
  ProductHeader,
} from "../../../components/table/table-cells/product/product-cell"
import {
  ProductStatusCell,
  ProductStatusHeader,
} from "../../../components/table/table-cells/product/product-status-cell"
import {
  VariantCell,
  VariantHeader,
} from "../../../components/table/table-cells/product/variant-cell"
import { ProductDTO } from "@mercurjs/types"
import { MoneyAmountCell } from "../../../components/table/table-cells/common/money-amount-cell/money-amount-cell"
import { PlaceholderCell } from "../../../components/table/table-cells/common/placeholder-cell/placeholder-cell"

const columnHelper = createColumnHelper<ProductDTO>()

export const useProductTableColumns = () => {
  const { t } = useTranslation();
  return useMemo(
    () => [
      columnHelper.display({
        id: "product",
        header: () => <ProductHeader />,
        cell: ({ row }) => (
          <ProductCell
            product={row.original}
            data-testid={`products-table-cell-${row.id}-product-value`}
          />
        ),
      }),
      columnHelper.accessor("categories", {
        header: () => <CategoryHeader />,
        cell: ({ row }) => (
          <CategoryCell
            categories={row.original.categories}
            data-testid={`products-table-cell-${row.id}-categories-value`}
          />
        ),
      }),
      columnHelper.accessor("collection", {
        header: () => <CollectionHeader />,
        cell: ({ row }) => (
          <CollectionCell
            collection={row.original.collection}
            data-testid={`products-table-cell-${row.id}-collection-value`}
          />
        ),
      }),
      columnHelper.accessor("variants", {
        header: () => <VariantHeader />,
        cell: ({ row }) => (
          <VariantCell
            variants={row.original.variants}
            data-testid={`products-table-cell-${row.id}-variants-value`}
          />
        ),
      }),
      columnHelper.display({
        id: "price",
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.price")}</span>
          </div>
        ),
        cell: ({ row }) => {
          const variants = row.original.variants ?? [];
          let amount: number | null = null;
          let currencyCode = "usd";
          for (const v of variants) {
            const offers = (v as any).offers ?? [];
            for (const offer of offers) {
              const prices = (offer as any).prices ?? [];
              if (prices.length) {
                amount = prices[0].amount;
                currencyCode = prices[0].currency_code ?? currencyCode;
                break;
              }
            }
            if (amount !== null) break;
          }
          if (amount === null) {
            return <PlaceholderCell />;
          }
          return <MoneyAmountCell currencyCode={currencyCode} amount={amount} />;
        },
      }),
      columnHelper.accessor("status", {
        header: () => <ProductStatusHeader />,
        cell: ({ row }) => (
          <ProductStatusCell
            status={row.original.status}
            data-testid={`products-table-cell-${row.id}-status-value`}
          />
        ),
      }),
    ],
    [t],
  )
}
