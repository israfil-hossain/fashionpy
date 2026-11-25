import { PlusMini, Trash } from "@medusajs/icons"
import type { HttpTypes } from "@medusajs/types"
import { Checkbox, Container, Heading, toast, usePrompt } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import {
  type RowSelectionState,
  createColumnHelper,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { SellerDTO } from "@mercurjs/types"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import { useBatchRegionSellers } from "../../../../../hooks/api/regions"
import { useSellers } from "../../../../../hooks/api/sellers"
import { useSellersTableColumns } from "../../../../../hooks/table/columns/use-seller-table-columns"
import { useSellersTableQuery } from "../../../../../hooks/table/query"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { getRemovableSellers } from "./removable-sellers"

type RegionSellerSectionProps = {
  region: HttpTypes.AdminRegion
}

const PREFIX = "rs"
const PAGE_SIZE = 10
const SELLER_FIELDS = "id,name,email,status,is_premium,created_at,regions.id"

export const RegionSellerSection = ({ region }: RegionSellerSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { searchParams, raw } = useSellersTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const { sellers, count, isPending, isError, error } = useSellers(
    { ...searchParams, region_id: region.id, fields: SELLER_FIELDS },
    { placeholderData: keepPreviousData }
  )

  const columns = useColumns()

  const { table } = useDataTable({
    data: sellers ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    rowSelection: {
      state: rowSelection,
      updater: setRowSelection,
    },
    prefix: PREFIX,
    meta: {
      regionId: region.id,
    },
  })

  const { mutateAsync } = useBatchRegionSellers(region.id)

  const handleRemoveSellers = async () => {
    const ids = Object.keys(rowSelection).filter((k) => rowSelection[k])

    if (!ids.length) {
      return
    }

    const { removable, blocked } = getRemovableSellers(ids, sellers ?? [])

    if (!removable.length) {
      toast.warning(t("regions.sellers.lastRegion"))
      return
    }

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("regions.sellers.removeWarning", {
        count: removable.length,
      }),
      cancelText: t("actions.cancel"),
      confirmText: t("actions.remove"),
    })

    if (!res) {
      return
    }

    try {
      await mutateAsync({ remove: removable })
      toast.success(t("regions.sellers.toast.removed"))
      setRowSelection({})
      if (blocked.length) {
        toast.warning(t("regions.sellers.skippedLastRegion"))
      }
    } catch {
      toast.error(t("regions.sellers.toast.removeFailed"))
    }
  }

  if (isError) {
    throw error
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid="region-seller-section-container"
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="region-seller-section-header"
      >
        <Heading level="h2" data-testid="region-seller-section-heading">
          {t("regions.sellers.header")}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  permission: "regions:edit",
                  label: t("regions.sellers.add"),
                  icon: <PlusMini />,
                  to: "sellers/add",
                },
              ],
            },
          ]}
          data-testid="region-seller-section-action-menu"
        />
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count ?? 0}
        isLoading={isPending}
        search
        pagination
        queryObject={raw}
        prefix={PREFIX}
        navigateTo={(row) => `/stores/${row.original.id}`}
        commands={[
          {
            action: handleRemoveSellers,
            permission: "regions:edit",
            label: t("actions.remove"),
            shortcut: "r",
          },
        ]}
        noRecords={{
          message: t("regions.sellers.empty"),
        }}
        data-testid="region-seller-section-table"
      />
    </Container>
  )
}

const SellerActions = ({
  seller,
  regionId,
  isLastRegion,
}: {
  seller: SellerDTO
  regionId: string
  isLastRegion: boolean
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useBatchRegionSellers(regionId)

  const handleRemove = async () => {
    if (isLastRegion) {
      toast.warning(t("regions.sellers.lastRegion"))
      return
    }

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("regions.sellers.removeWarning", { count: 1 }),
      cancelText: t("actions.cancel"),
      confirmText: t("actions.remove"),
    })

    if (!res) {
      return
    }

    try {
      await mutateAsync({ remove: [seller.id] })
      toast.success(t("regions.sellers.toast.removed"))
    } catch {
      toast.error(t("regions.sellers.toast.removeFailed"))
    }
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <Trash />,
              permission: "regions:edit",
              label: t("actions.remove"),
              onClick: handleRemove,
              disabled: isLastRegion,
              disabledTooltip: t("regions.sellers.lastRegion"),
            },
          ],
        },
      ]}
      data-testid={`region-seller-section-row-action-menu-${seller.id}`}
    />
  )
}

const columnHelper = createColumnHelper<SellerDTO>()

const useColumns = () => {
  const base = useSellersTableColumns()

  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            data-testid="region-seller-section-select-all-checkbox"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => {
              e.stopPropagation()
            }}
            data-testid={`region-seller-section-select-checkbox-${row.original.id}`}
          />
        ),
      }),
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row, table }) => {
          const { regionId } = table.options.meta as { regionId: string }
          const isLastRegion = row.original.regions
            ? row.original.regions.length <= 1
            : false

          return (
            <SellerActions
              seller={row.original}
              regionId={regionId}
              isLastRegion={isLastRegion}
            />
          )
        },
      }),
    ],
    [base]
  )
}
