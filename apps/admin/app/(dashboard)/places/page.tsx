"use client"

import { PlacesTable } from "@/components/tables/places-table"

export default function PlacesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PlacesTable />
    </div>
  )
}