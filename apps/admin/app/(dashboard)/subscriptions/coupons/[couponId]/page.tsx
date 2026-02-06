"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { Coupon } from "@/types/coupons"
import { CouponForm } from "@/components/forms/coupon-form"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"

export default function CouponPage() {
  const params = useParams()
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [loading, setLoading] = useState(true)

  const isNew = params.couponId === "new"

  useEffect(() => {
    if (isNew) {
      setLoading(false)
      return
    }

    const fetchCoupon = async () => {
      try {
        const res = await fetch(`/api/admin/coupons/${params.couponId}`)
        if (!res.ok) {
          throw new Error("Kupon yüklenemedi")
        }
        const data = await res.json()
        if (data.coupon) {
          setCoupon(Array.isArray(data.coupon) ? data.coupon[0] : data.coupon)
        }
      } catch (error) {
        console.error("Failed to fetch coupon:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCoupon()
  }, [isNew, params.couponId])

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title={isNew ? "Yeni Kupon Oluştur" : "Kuponu Düzenle"}
          description={
            isNew
              ? "Yeni bir indirim kuponu ekleyin."
              : "Mevcut kupon ayarlarını güncelleyin."
          }
        />
      </div>
      <Separator />
      <CouponForm initialData={coupon} />
    </div>
  )
}
