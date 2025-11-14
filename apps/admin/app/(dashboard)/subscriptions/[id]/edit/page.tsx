"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Save,
  CreditCard,
  Calendar,
  DollarSign,
  User,
  Building,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const subscriptionEditSchema = z.object({
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "TRIAL", "SUSPENDED"]),
  planId: z.string().min(1, "Plan seçimi zorunludur"),
  currentPeriodStart: z.string(),
  currentPeriodEnd: z.string(),
  nextBillingDate: z.string().optional(),
  trialEndsAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  cancelReason: z.string().optional(),
  billingMethod: z.string(),
  cardLast4: z.string().optional(),
  cardBrand: z.string().optional(),
  cardExpiresAt: z.string().optional(),
  featuredListingsLimit: z.number().min(0),
  photosLimit: z.number().min(0),
  notes: z.string().optional(),
})

type SubscriptionEditForm = z.infer<typeof subscriptionEditSchema>

interface Subscription {
  id: string
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  place: {
    id: string
    name: string
    type: string
    location: string
  }
  plan: {
    id: string
    name: string
    price: number
    currency: string
    billingCycle: "MONTHLY" | "YEARLY"
    features: string[]
  }
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "TRIAL" | "SUSPENDED"
  currentPeriodStart: string
  currentPeriodEnd: string
  nextBillingDate: string | null
  cancelledAt: string | null
  cancelReason: string | null
  trialEndsAt: string | null
  createdAt: string
  updatedAt: string
  billingInfo: {
    method: string
    last4: string | null
    brand: string | null
    expiresAt: string | null
  }
  usage: {
    featuredListings: number
    featuredListingsLimit: number
    photosUploaded: number
    photosLimit: number
    viewsThisMonth: number
    bookingRequests: number
  }
  revenue: {
    totalPaid: number
    currentMonthRevenue: number
    lastMonthRevenue: number
    lifetimeValue: number
  }
}

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  billingCycle: "MONTHLY" | "YEARLY"
  features: string[]
}

export default function SubscriptionEditPage() {
  const params = useParams()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availablePlans] = useState<Plan[]>([
    {
      id: "basic",
      name: "Basic",
      price: 99,
      currency: "TRY",
      billingCycle: "MONTHLY",
      features: [
        "3 Öne Çıkan Listeleme",
        "25 Fotoğraf",
        "Temel Analitik",
        "E-posta Destek"
      ]
    },
    {
      id: "premium",
      name: "Premium",
      price: 299,
      currency: "TRY",
      billingCycle: "MONTHLY",
      features: [
        "Öne Çıkan Listeleme",
        "Sınırsız Fotoğraf Yükleme",
        "Detaylı Analitik",
        "Öncelikli Destek",
        "Rezervasyon Yönetimi",
        "İşletme Profili"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 599,
      currency: "TRY",
      billingCycle: "MONTHLY",
      features: [
        "Sınırsız Her Şey",
        "Özel Profil",
        "API Erişimi",
        "Özel Destek",
        "Beyaz Etiket",
        "Öncelikli Listelemeler"
      ]
    }
  ])

  const form = useForm<SubscriptionEditForm>({
    resolver: zodResolver(subscriptionEditSchema),
    defaultValues: {
      status: "ACTIVE",
      planId: "",
      currentPeriodStart: "",
      currentPeriodEnd: "",
      nextBillingDate: "",
      trialEndsAt: "",
      cancelledAt: "",
      cancelReason: "",
      billingMethod: "CREDIT_CARD",
      cardLast4: "",
      cardBrand: "",
      cardExpiresAt: "",
      featuredListingsLimit: 5,
      photosLimit: 100,
      notes: "",
    },
  })

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true)
        // Simulate API call to fetch subscription details
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock subscription data - in real app, this would be an API call
        const mockSubscription: Subscription = {
          id: params.id as string,
          user: {
            id: "user1",
            name: "Mehmet Yılmaz",
            email: "mehmet.yilmaz@example.com",
            avatar: null,
          },
          place: {
            id: "place1",
            name: "Bodrum Marina Otel",
            type: "Otel",
            location: "Bodrum, Muğla",
          },
          plan: {
            id: "premium",
            name: "Premium",
            price: 299,
            currency: "TRY",
            billingCycle: "MONTHLY",
            features: [
              "Öne Çıkan Listeleme",
              "Sınırsız Fotoğraf Yükleme",
              "Detaylı Analitik",
              "Öncelikli Destek",
              "Rezervasyon Yönetimi",
              "İşletme Profili"
            ]
          },
          status: "ACTIVE",
          currentPeriodStart: "2024-11-01T00:00:00Z",
          currentPeriodEnd: "2024-11-30T23:59:59Z",
          nextBillingDate: "2024-12-01T00:00:00Z",
          cancelledAt: null,
          cancelReason: null,
          trialEndsAt: null,
          createdAt: "2024-10-15T09:00:00Z",
          updatedAt: "2024-11-14T10:30:00Z",
          billingInfo: {
            method: "CREDIT_CARD",
            last4: "4242",
            brand: "Visa",
            expiresAt: "2025-08-31T23:59:59Z",
          },
          usage: {
            featuredListings: 2,
            featuredListingsLimit: 5,
            photosUploaded: 45,
            photosLimit: 100,
            viewsThisMonth: 2847,
            bookingRequests: 23,
          },
          revenue: {
            totalPaid: 2392,
            currentMonthRevenue: 299,
            lastMonthRevenue: 299,
            lifetimeValue: 2392,
          }
        }

        setSubscription(mockSubscription)
        form.reset({
          status: mockSubscription.status,
          planId: mockSubscription.plan.id,
          currentPeriodStart: mockSubscription.currentPeriodStart.split('T')[0],
          currentPeriodEnd: mockSubscription.currentPeriodEnd.split('T')[0],
          nextBillingDate: mockSubscription.nextBillingDate?.split('T')[0] || "",
          trialEndsAt: mockSubscription.trialEndsAt?.split('T')[0] || "",
          cancelledAt: mockSubscription.cancelledAt?.split('T')[0] || "",
          cancelReason: mockSubscription.cancelReason || "",
          billingMethod: mockSubscription.billingInfo.method,
          cardLast4: mockSubscription.billingInfo.last4 || "",
          cardBrand: mockSubscription.billingInfo.brand || "",
          cardExpiresAt: mockSubscription.billingInfo.expiresAt?.split('T')[0] || "",
          featuredListingsLimit: mockSubscription.usage.featuredListingsLimit,
          photosLimit: mockSubscription.usage.photosLimit,
          notes: "",
        })
      } catch (error) {
        toast.error("Abonelik bilgileri yüklenemedi")
        router.push("/subscriptions")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchSubscription()
    }
  }, [params.id, router, form])

  const onSubmit = async (data: SubscriptionEditForm) => {
    if (!subscription) return

    try {
      setSaving(true)

      // Simulate API call to update subscription
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In a real app, this would be an API call
      console.log("Updating subscription:", {
        id: subscription.id,
        ...data,
        updatedAt: new Date().toISOString(),
      })

      toast.success("Abonelik başarıyla güncellendi")
      router.push(`/subscriptions/${subscription.id}`)
    } catch (error) {
      toast.error("Abonelik güncellenemedi")
    } finally {
      setSaving(false)
    }
  }

  const selectedPlan = availablePlans.find(plan => plan.id === form.watch("planId"))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Aboneliği Düzenle</h1>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/subscriptions/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Aboneliği Düzenle</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Abonelik bulunamadı.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/subscriptions/${subscription.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Aboneliği Düzenle</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/subscriptions/${subscription.id}`}>
              İptal
            </Link>
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* User & Place Info */}
            <Card>
              <CardHeader>
                <CardTitle>Abonelik Sahibi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Kullanıcı
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={subscription.user.avatar || undefined} alt={subscription.user.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{subscription.user.name}</div>
                        <div className="text-sm text-muted-foreground">{subscription.user.email}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Mekan
                    </h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{subscription.place.name}</div>
                      <div className="text-sm text-muted-foreground">{subscription.place.type}</div>
                      <div className="text-xs text-muted-foreground">{subscription.place.location}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Plan & Durum
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="planId">Plan</Label>
                    <Select
                      value={form.watch("planId")}
                      onValueChange={(value) => form.setValue("planId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Plan seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ₺{plan.price}/{plan.billingCycle === "MONTHLY" ? "ay" : "yıl"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.planId && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.planId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Durum</Label>
                    <Select
                      value={form.watch("status")}
                      onValueChange={(value) => form.setValue("status", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Aktif</SelectItem>
                        <SelectItem value="TRIAL">Deneme</SelectItem>
                        <SelectItem value="EXPIRED">Süresi Doldu</SelectItem>
                        <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                        <SelectItem value="SUSPENDED">Askıya Alındı</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.status && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.status.message}
                      </p>
                    )}
                  </div>
                </div>

                {selectedPlan && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Plan Özellikleri:</h4>
                    <ul className="text-sm space-y-1">
                      {selectedPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Period Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dönem Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currentPeriodStart">Dönem Başlangıcı</Label>
                    <Input
                      id="currentPeriodStart"
                      type="date"
                      {...form.register("currentPeriodStart")}
                    />
                    {form.formState.errors.currentPeriodStart && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.currentPeriodStart.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPeriodEnd">Dönem Sonu</Label>
                    <Input
                      id="currentPeriodEnd"
                      type="date"
                      {...form.register("currentPeriodEnd")}
                    />
                    {form.formState.errors.currentPeriodEnd && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.currentPeriodEnd.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nextBillingDate">Sonraki Fatura Tarihi</Label>
                    <Input
                      id="nextBillingDate"
                      type="date"
                      {...form.register("nextBillingDate")}
                    />
                    {form.formState.errors.nextBillingDate && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.nextBillingDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trialEndsAt">Deneme Sona Erme</Label>
                    <Input
                      id="trialEndsAt"
                      type="date"
                      {...form.register("trialEndsAt")}
                    />
                    {form.formState.errors.trialEndsAt && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.trialEndsAt.message}
                      </p>
                    )}
                  </div>
                </div>

                {form.watch("status") === "CANCELLED" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cancelledAt">İptal Tarihi</Label>
                      <Input
                        id="cancelledAt"
                        type="date"
                        {...form.register("cancelledAt")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cancelReason">İptal Sebebi</Label>
                      <Textarea
                        id="cancelReason"
                        {...form.register("cancelReason")}
                        placeholder="İptal sebebi..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Fatura Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billingMethod">Ödeme Yöntemi</Label>
                    <Select
                      value={form.watch("billingMethod")}
                      onValueChange={(value) => form.setValue("billingMethod", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ödeme yöntemi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Banka Havalesi</SelectItem>
                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.billingMethod && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.billingMethod.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardLast4">Kart Son 4 Hane</Label>
                    <Input
                      id="cardLast4"
                      {...form.register("cardLast4")}
                      placeholder="4242"
                    />
                    {form.formState.errors.cardLast4 && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.cardLast4.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardBrand">Kart Markası</Label>
                    <Select
                      value={form.watch("cardBrand")}
                      onValueChange={(value) => form.setValue("cardBrand", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kart markası seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Visa">Visa</SelectItem>
                        <SelectItem value="Mastercard">Mastercard</SelectItem>
                        <SelectItem value="American Express">American Express</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.cardBrand && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.cardBrand.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardExpiresAt">Kart Son Kullanma</Label>
                    <Input
                      id="cardExpiresAt"
                      type="month"
                      {...form.register("cardExpiresAt")}
                    />
                    {form.formState.errors.cardExpiresAt && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.cardExpiresAt.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Kullanım Limitleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="featuredListingsLimit">Öne Çıkan Listeleme Limiti</Label>
                    <Input
                      id="featuredListingsLimit"
                      type="number"
                      min="0"
                      {...form.register("featuredListingsLimit", { valueAsNumber: true })}
                    />
                    {form.formState.errors.featuredListingsLimit && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.featuredListingsLimit.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photosLimit">Fotoğraf Limiti</Label>
                    <Input
                      id="photosLimit"
                      type="number"
                      min="0"
                      {...form.register("photosLimit", { valueAsNumber: true })}
                    />
                    {form.formState.errors.photosLimit && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.photosLimit.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  {...form.register("notes")}
                  placeholder="Abonelik hakkında notlar..."
                  rows={4}
                />
                {form.formState.errors.notes && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.notes.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Plan Info */}
            <Card>
              <CardHeader>
                <CardTitle>Mevcut Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium">{subscription.plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fiyat:</span>
                    <span className="font-medium">₺{subscription.plan.price}/ay</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toplam Ödenen:</span>
                    <span className="font-medium">₺{subscription.revenue.totalPaid.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Müşteri Değeri:</span>
                    <span className="font-medium">₺{subscription.revenue.lifetimeValue.toLocaleString("tr-TR")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Mevcut Kullanım</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Öne Çıkanlar:</span>
                    <span>{subscription.usage.featuredListings}/{subscription.usage.featuredListingsLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fotoğraflar:</span>
                    <span>{subscription.usage.photosUploaded}/{subscription.usage.photosLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Görüntülenme:</span>
                    <span>{subscription.usage.viewsThisMonth.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rezervasyon:</span>
                    <span>{subscription.usage.bookingRequests}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Plan Değiştir
                </Button>
                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ödeme Bilgisi Güncelle
                </Button>
                <Button variant="outline" className="w-full">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Askıya Al
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}