"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Coupon } from "@/types/coupons"
import { Badge } from "@/components/ui/badge"
import { CellAction } from "./cell-action"

const formatDiscount = (coupon: Coupon) => {
  const value = Number(coupon.discountValue)
  if (coupon.discountType === "percent") {
    return `%${value}`
  }
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value)
}

export const columns: ColumnDef<Coupon>[] = [
  {
    accessorKey: "code",
    header: "Kod",
    cell: ({ row }) => <div className="font-mono">{row.original.code}</div>,
  },
  {
    accessorKey: "discountValue",
    header: "İndirim",
    cell: ({ row }) => <div>{formatDiscount(row.original)}</div>,
  },
  {
    accessorKey: "scope",
    header: "Kapsam",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.scope === "all_plans"
          ? "Tüm planlar"
          : `${row.original.plans.length} plan`}
      </div>
    ),
  },
  {
    accessorKey: "usageCount",
    header: "Kullanım",
    cell: ({ row }) => {
      const maxText =
        row.original.maxRedemptions === null || row.original.maxRedemptions === undefined
          ? "Sınırsız"
          : row.original.maxRedemptions
      return (
        <div className="text-sm">
          {row.original.usageCount} / {maxText}
        </div>
      )
    },
  },
  {
    accessorKey: "active",
    header: "Durum",
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "default" : "destructive"}>
        {row.original.active ? "Aktif" : "Pasif"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
]
