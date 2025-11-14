"use client"

import { SubscriptionsTable } from "@/components/tables/subscriptions-table"

export default function SubscriptionsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SubscriptionsTable />
    </div>
  )
}