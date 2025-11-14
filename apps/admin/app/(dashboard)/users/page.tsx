"use client"

import { UsersTable } from "@/components/tables/users-table"

export default function UsersPage() {
  return (
    <div className="flex-1 space-y-4">
      <UsersTable />
    </div>
  )
}