"use client"

import { BlogsTable } from "@/components/tables/blogs-table"

export default function BlogsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <BlogsTable />
    </div>
  )
}