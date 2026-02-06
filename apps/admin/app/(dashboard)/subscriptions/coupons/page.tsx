"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Coupon } from "@/types/coupons"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { columns } from "./columns"

export default function CouponsPage() {
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch("/api/admin/coupons")
        if (!res.ok) {
          throw new Error("Kuponlar yüklenemedi")
        }

        const data = await res.json()
        setCoupons(data.coupons ?? [])
      } catch (error) {
        console.error("Failed to fetch coupons:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCoupons()
  }, [])

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title={`Kuponlar (${coupons.length})`}
          description="İndirim kuponlarını yönetin ve kullanım durumlarını takip edin."
        />
        <Button onClick={() => router.push("/subscriptions/coupons/new")}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Kupon Ekle
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="code" columns={columns} data={coupons} />
    </div>
  )
}
