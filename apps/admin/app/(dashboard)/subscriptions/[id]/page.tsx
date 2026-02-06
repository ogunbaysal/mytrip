"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, CheckCircle2, CreditCard, Pencil, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SubscriptionDetail {
  id: string
  status: "active" | "expired" | "cancelled" | "pending" | "trial"
  startDate: string
  endDate: string
  nextBillingDate?: string | null
  cancelledAt?: string | null
  trialEndsAt?: string | null
  price: number
  basePrice: number
  discountAmount: number
  couponCode?: string | null
  currency: "TRY" | "USD" | "EUR"
  billingCycle: "yearly"
  usage?: {
    currentPlaces: number
    currentBlogs: number
  }
  user: {
    id: string
    name: string
    email: string
    phone?: string | null
  }
  plan: {
    id: string
    name: string
    description?: string | null
    maxPlaces: number
    maxBlogs: number
    features?: string[]
  }
  paymentHistory?: Array<{
    id: string
    amount: number
    status: "success" | "failed" | "pending" | "refunded"
    currency: "TRY" | "USD" | "EUR"
    createdAt: string
    invoiceId?: string | null
  }>
}

const statusLabels: Record<SubscriptionDetail["status"], string> = {
  active: "Aktif",
  trial: "Deneme",
  pending: "Beklemede",
  expired: "Süresi Doldu",
  cancelled: "İptal Edildi",
}

export default function SubscriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/subscriptions/${params.id}`)
        const payload = await res.json()

        if (!res.ok) {
          throw new Error(payload.error || "Abonelik bilgisi alınamadı")
        }

        setSubscription(payload.subscription)
      } catch (error) {
        console.error(error)
        toast.error(error instanceof Error ? error.message : "Abonelik yüklenemedi")
        router.push("/subscriptions")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchSubscription()
    }
  }, [params.id, router])

  const statusBadgeVariant = useMemo(() => {
    switch (subscription?.status) {
      case "active":
        return "default"
      case "trial":
      case "pending":
        return "secondary"
      case "expired":
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }, [subscription?.status])

  const runAction = async (action: "cancel" | "reactivate") => {
    if (!subscription) return

    try {
      setActionLoading(true)
      const res = await fetch(`/api/admin/subscriptions/${subscription.id}/${action}`, {
        method: "PUT",
      })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || "İşlem başarısız")
      }

      toast.success(
        action === "cancel"
          ? "Abonelik başarıyla iptal edildi"
          : "Abonelik başarıyla aktifleştirildi",
      )

      setSubscription((prev) =>
        prev
          ? {
              ...prev,
              status: payload.subscription.status,
              startDate: payload.subscription.startDate ?? prev.startDate,
              endDate: payload.subscription.endDate ?? prev.endDate,
              nextBillingDate: payload.subscription.nextBillingDate ?? null,
              cancelledAt: payload.subscription.cancelledAt ?? null,
            }
          : prev,
      )
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "İşlem sırasında hata oluştu")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  if (!subscription) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/subscriptions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Aboneliklere Dön
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">Abonelik bulunamadı.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/subscriptions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Link>
          </Button>
          <Badge variant={statusBadgeVariant}>{statusLabels[subscription.status]}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {subscription.status === "active" || subscription.status === "trial" ? (
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={() => runAction("cancel")}
            >
              <XCircle className="mr-2 h-4 w-4" />
              İptal Et
            </Button>
          ) : (
            <Button disabled={actionLoading} onClick={() => runAction("reactivate")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Yeniden Aktifleştir
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={`/subscriptions/${subscription.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Düzenle
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Müşteri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{subscription.user.name}</p>
            <p className="text-muted-foreground">{subscription.user.email}</p>
            {subscription.user.phone && (
              <p className="text-muted-foreground">{subscription.user.phone}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{subscription.plan.name}</p>
            {subscription.plan.description && (
              <p className="text-muted-foreground">{subscription.plan.description}</p>
            )}
            <p className="text-muted-foreground">
              Limitler: {subscription.plan.maxPlaces} mekan / {subscription.plan.maxBlogs} blog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abonelik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Başlangıç:</span>{" "}
              {new Date(subscription.startDate).toLocaleDateString("tr-TR")}
            </p>
            <p>
              <span className="text-muted-foreground">Bitiş:</span>{" "}
              {new Date(subscription.endDate).toLocaleDateString("tr-TR")}
            </p>
            {subscription.nextBillingDate && (
              <p>
                <span className="text-muted-foreground">Sonraki fatura:</span>{" "}
                {new Date(subscription.nextBillingDate).toLocaleDateString("tr-TR")}
              </p>
            )}
            {subscription.cancelledAt && (
              <p>
                <span className="text-muted-foreground">İptal tarihi:</span>{" "}
                {new Date(subscription.cancelledAt).toLocaleDateString("tr-TR")}
              </p>
            )}
            <p className="font-medium">
              {new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: subscription.currency,
              }).format(subscription.price)}
            </p>
            {subscription.discountAmount > 0 && (
              <p className="text-muted-foreground">
                İndirim:{" "}
                {new Intl.NumberFormat("tr-TR", {
                  style: "currency",
                  currency: subscription.currency,
                }).format(subscription.discountAmount)}{" "}
                {subscription.couponCode ? `(${subscription.couponCode})` : ""}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanım</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Mekan:</span>{" "}
              {subscription.usage?.currentPlaces ?? 0} / {subscription.plan.maxPlaces}
            </p>
            <p>
              <span className="text-muted-foreground">Blog:</span>{" "}
              {subscription.usage?.currentBlogs ?? 0} / {subscription.plan.maxBlogs}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Ödeme Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!subscription.paymentHistory || subscription.paymentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ödeme kaydı bulunamadı.</p>
          ) : (
            <div className="space-y-3">
              {subscription.paymentHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: item.currency,
                      }).format(item.amount)}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.status === "success"
                        ? "default"
                        : item.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
