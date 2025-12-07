"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PlanForm } from "@/components/forms/plan-form"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { SubscriptionPlan } from "@/types/subscriptions"

export default function PlanPage() {
  const params = useParams()
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)

  const isNew = params.planId === "new"

  useEffect(() => {
    if (isNew) {
      setLoading(false)
      return
    }

    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/admin/plans/${params.planId}`)
        const data = await res.json()
        if (data.plan) {
            setPlan(data.plan)
        }
      } catch (error) {
        console.error("Failed to fetch plan:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [params.planId, isNew])

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title={isNew ? "Yeni Plan Oluştur" : "Planı Düzenle"}
          description={isNew ? "Yeni bir abonelik paketi ekleyin." : "Mevcut abonelik paketini güncelleyin."}
        />
      </div>
      <Separator />
      <PlanForm initialData={plan} />
    </div>
  )
}
