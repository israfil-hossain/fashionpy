"use client"

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react"
import Image from "next/image"

import { CloseIcon } from "@/icons"
import type { SizeChart } from "@/lib/helpers/get-size-chart"

export const SizeGuideDrawer = ({
  open,
  onClose,
  title,
  thumbnail,
  priceLabel,
  originalPriceLabel,
  stock,
  sizeChart,
}: {
  open: boolean
  onClose: () => void
  title: string
  thumbnail?: string | null
  priceLabel?: string | null
  originalPriceLabel?: string | null
  stock?: number
  sizeChart: SizeChart
}) => {
  const firstColumnKey = sizeChart.columns[0].key

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition-opacity duration-200 ease-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-y-0 right-0 flex w-full max-w-[520px]">
        <DialogPanel
          transition
          className="flex h-full w-full flex-col bg-primary shadow-xl transition-transform duration-300 ease-out data-[closed]:translate-x-full"
          data-testid="size-guide-drawer"
        >
          <header className="flex items-start justify-between gap-4 border-b px-5 py-5">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border bg-component-secondary">
                <Image
                  src={
                    thumbnail
                      ? decodeURIComponent(thumbnail)
                      : "/images/placeholder.svg"
                  }
                  alt={title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 pt-0.5">
                <DialogTitle
                  className="label-md line-clamp-2 text-primary"
                  data-testid="size-guide-title"
                >
                  {title}
                </DialogTitle>
                <div
                  className="label-sm mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-secondary"
                  data-testid="size-guide-product-meta"
                >
                  {priceLabel && (
                    <span className="text-primary">{priceLabel}</span>
                  )}
                  {originalPriceLabel && (
                    <>
                      <span aria-hidden="true">|</span>
                      <span className="line-through">{originalPriceLabel}</span>
                    </>
                  )}
                  {typeof stock === "number" && (
                    <>
                      <span aria-hidden="true">|</span>
                      <span>Stock {stock}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close size guide"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center"
              data-testid="size-guide-close"
            >
              <CloseIcon size={20} />
            </button>
          </header>

          <div className="px-5 pt-5">
            <div
              className="rounded-xs border border-[rgba(var(--brand-500))] py-2.5 text-center label-md text-[rgba(var(--brand-500))]"
              data-testid="size-guide-tab"
            >
              Size Chart
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-6">
            <table
              className="w-full table-fixed border-collapse"
              data-testid="size-guide-table"
            >
              <thead>
                <tr>
                  {sizeChart.columns.map((column, index) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`label-md px-3 pb-4 text-left font-semibold ${
                        index === 0
                          ? "text-[rgba(var(--brand-500))]"
                          : "text-primary"
                      } ${index < sizeChart.columns.length - 1 ? "border-r" : ""}`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeChart.rows.map((row, rowIndex) => (
                  <tr key={`${row[firstColumnKey]}-${rowIndex}`}>
                    {sizeChart.columns.map((column, index) => (
                      <td
                        key={column.key}
                        className={`label-md px-3 py-3 ${
                          index === 0
                            ? "text-[rgba(var(--brand-500))]"
                            : "text-primary"
                        } ${index < sizeChart.columns.length - 1 ? "border-r" : ""}`}
                      >
                        {row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
