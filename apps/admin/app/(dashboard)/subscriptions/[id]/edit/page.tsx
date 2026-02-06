"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PlanOption {
  id: string
  name: string
  price: string | number
  maxPlaces: number
  maxBlogs: number
}

interface SubscriptionDetail {
  id: string
  status: "active" | "expired" | "cancelled" | "pending" | "trial"
  planId: string
  startDate: string
  endDate: string
  nextBillingDate?: string | null
  user: {
    name: string
    email: string
  }
  plan: {
    name: string
  }
}

const statusOptions = [
  { value: "active", label: "Aktif" },
  { value: "trial", label: "Deneme" },
  { value: "pending", label: "Beklemede" },
  { value: "expired", label: "Süresi Doldu" },
  { value: "cancelled", label: "İptal Edildi" },
] as const

export default function SubscriptionEditPage() {
  const params = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null)

  const [formData, setFormData] = useState({
    status: "pending" as SubscriptionDetail["status"],
    planId: "",
    startDate: "",
    endDate: "",
    nextBillingDate: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [subRes, plansRes] = await Promise.all([
          fetch(`/api/admin/subscriptions/${params.id}`),
          fetch("/api/admin/plans"),
        ])

        const subPayload = await subRes.json()
        const plansPayload = await plansRes.json()

        if (!subRes.ok) {
          throw new Error(subPayload.error || "Abonelik bilgisi alınamadı")
        }
        if (!plansRes.ok) {
          throw new Error(plansPayload.error || "Planlar alınamadı")
        }

        const sub = subPayload.subscription as SubscriptionDetail
        setSubscription(sub)
        setPlans(plansPayload.plans || [])
        setFormData({
          status: sub.status,
          planId: sub.planId,
          startDate: sub.startDate ? sub.startDate.split("T")[0] : "",
          endDate: sub.endDate ? sub.endDate.split("T")[0] : "",
          nextBillingDate: sub.nextBillingDate ? sub.nextBillingDate.split("T")[0] : "",
        })
      } catch (error) {
        console.error(error)
        toast.error(error instanceof Error ? error.message : "Veriler yüklenemedi")
        router.push("/subscriptions")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id, router])

  const selectedPlan = useMemo(
    () => plans.find((item) => item.id === formData.planId),
    [formData.planId, plans],
  )

  const handleSave = async () => {
    if (!formData.planId || !formData.status || !formData.startDate || !formData.endDate) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/subscriptions/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formData.status,
          planId: formData.planId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          nextBillingDate: formData.nextBillingDate || null,
          cancelledAt:
            formData.status === "cancelled" ? new Date().toISOString() : null,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || "Abonelik güncellenemedi")
      }

      toast.success("Abonelik güncellendi")
      router.push(`/subscriptions/${params.id}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Bir şeyler yanlış gitti.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  if (!subscription) {
    return <div>Abonelik bulunamadı.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/subscriptions/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Aboneliği Düzenle</h2>
            <p className="text-muted-foreground text-sm">
              {subscription.user.name} ({subscription.user.email})
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            "Kaydediliyor..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Kaydet
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abonelik Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as SubscriptionDetail["status"],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={formData.planId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, planId: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Plan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, startDate: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, endDate: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextBillingDate">Sonraki Fatura</Label>
              <Input
                id="nextBillingDate"
                type="date"
                value={formData.nextBillingDate}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    nextBillingDate: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          {selectedPlan && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6 space-y-2 text-sm">
                <p className="font-medium">{selectedPlan.name}</p>
                <p className="text-muted-foreground">
                  Fiyat:{" "}
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  }).format(Number(selectedPlan.price))}
                </p>
                <p className="text-muted-foreground">
                  Limit: {selectedPlan.maxPlaces} mekan / {selectedPlan.maxBlogs} blog
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
