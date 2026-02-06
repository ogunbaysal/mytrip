"use client"

import { ColumnDef } from "@tanstack/react-table"
import { SubscriptionPlan } from "@/types/subscriptions"
import { Badge } from "@/components/ui/badge"
import { CellAction } from "./cell-action"

export const columns: ColumnDef<SubscriptionPlan>[] = [
  {
    accessorKey: "name",
    header: "Plan Adı",
  },
  {
    accessorKey: "price",
    header: "Fiyat",
    cell: ({ row }) => (
        <div>{row.original.price} {row.original.currency}</div>
    )
  },
  {
    id: "limits",
    header: "Limitler",
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.maxPlaces} mekan / {row.original.maxBlogs} blog
      </div>
    )
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
