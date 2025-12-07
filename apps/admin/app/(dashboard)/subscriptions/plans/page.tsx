"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { SubscriptionPlan } from "@/types/subscriptions"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { useRouter } from "next/navigation"

export default function PlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/admin/plans");
            const data = await res.json();
            if (data.plans) {
                setPlans(data.plans as SubscriptionPlan[]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    fetchPlans();
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title={`Abonelik Planları (${plans.length})`}
          description="Sistemdeki abonelik paketlerini yönetin."
        />
        <Button onClick={() => router.push("/subscriptions/plans/new")}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Plan Ekle
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={columns} data={plans} />
    </div>
  )
}
