"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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

interface UserOption {
  id: string
  name: string
  email: string
}

interface PlanOption {
  id: string
  name: string
  price: number
  currency: "TRY" | "USD" | "EUR"
  maxPlaces: number
  maxBlogs: number
}

export default function CreateSubscriptionPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserOption[]>([])
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    userId: "",
    planId: "",
    startDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, plansRes] = await Promise.all([
          fetch("/api/admin/users?limit=200"),
          fetch("/api/admin/plans"),
        ])

        if (!usersRes.ok || !plansRes.ok) {
          throw new Error("Veriler yüklenemedi")
        }

        const usersData = await usersRes.json()
        const plansData = await plansRes.json()

        const ownerUsers = (usersData.users || []).filter(
          (item: { role?: string }) => item.role === "owner",
        )

        setUsers(
          ownerUsers.map((item: { id: string; name: string; email: string }) => ({
            id: item.id,
            name: item.name,
            email: item.email,
          })),
        )

        setPlans(
          (plansData.plans || []).map(
            (item: {
              id: string
              name: string
              price: string | number
              currency: "TRY" | "USD" | "EUR"
              maxPlaces: number
              maxBlogs: number
            }) => ({
              id: item.id,
              name: item.name,
              price: typeof item.price === "number" ? item.price : Number(item.price),
              currency: item.currency,
              maxPlaces: item.maxPlaces,
              maxBlogs: item.maxBlogs,
            }),
          ),
        )
      } catch (error) {
        console.error("Failed to fetch subscription form data:", error)
        toast.error("Abonelik formu yüklenemedi")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const selectedUser = useMemo(
    () => users.find((item) => item.id === formData.userId),
    [formData.userId, users],
  )
  const selectedPlan = useMemo(
    () => plans.find((item) => item.id === formData.planId),
    [formData.planId, plans],
  )

  const handleSubmit = async () => {
    if (!formData.userId || !formData.planId) {
      toast.error("Kullanıcı ve plan seçimi zorunludur")
      return
    }

    try {
      setSaving(true)
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: formData.userId,
          planId: formData.planId,
          startDate: formData.startDate,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || "Abonelik oluşturulamadı")
      }

      toast.success("Abonelik başarıyla oluşturuldu")
      router.push("/subscriptions")
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Yeni Abonelik</h2>
          <p className="text-muted-foreground">
            Bir kullanıcıya yıllık plan ataması yapın.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/subscriptions")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abonelik Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Kullanıcı</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, userId: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kullanıcı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.email})
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
                      {item.name} -{" "}
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: item.currency,
                      }).format(item.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Başlangıç Tarihi</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, startDate: event.target.value }))
              }
            />
          </div>

          {(selectedUser || selectedPlan) && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6 space-y-2 text-sm">
                {selectedUser && (
                  <p>
                    <span className="text-muted-foreground">Kullanıcı:</span>{" "}
                    {selectedUser.name} ({selectedUser.email})
                  </p>
                )}
                {selectedPlan && (
                  <>
                    <p>
                      <span className="text-muted-foreground">Plan:</span> {selectedPlan.name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Limitler:</span>{" "}
                      {selectedPlan.maxPlaces} mekan / {selectedPlan.maxBlogs} blog
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              "Kaydediliyor..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Abonelik Oluştur
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
