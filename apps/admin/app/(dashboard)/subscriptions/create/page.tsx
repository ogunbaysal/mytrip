"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Building,
  Mail,
  Phone,
  User,
  Package,
  TrendingUp,
  AlertCircle,
  Save,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"

export default function CreateSubscriptionPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    placeId: "",
    planType: "",
    status: "pending",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    price: "",
    discount: "",
    billingCycle: "",
    paymentMethod: "",
    autoRenew: false,
    features: [] as string[],
    notes: ""
  })

  const [newFeature, setNewFeature] = useState("")

  const plans = [
    { value: "basic", label: "Temel", price: "299", features: ["5 Mekan Listeleme", "Temel İstatistikler", "E-posta Destek"] },
    { value: "professional", label: "Profesyonel", price: "599", features: ["20 Mekan Listeleme", "Gelişmiş İstatistikler", "Öncelikli Destek", "Sosyal Medya"] },
    { value: "enterprise", label: "Kurumsal", price: "1299", features: ["Sınırsız Mekan", "API Erişimi", "Özel Özellikler", "7/24 Destek"] }
  ]

  const billingCycles = [
    { value: "monthly", label: "Aylık", months: 1 },
    { value: "quarterly", label: "3 Aylık", months: 3 },
    { value: "semiannual", label: "6 Aylık", months: 6 },
    { value: "annual", label: "Yıllık", months: 12 }
  ]

  const paymentMethods = [
    { value: "credit_card", label: "Kredi Kartı" },
    { value: "bank_transfer", label: "Banka Havalesi" },
    { value: "eft", label: "EFT" }
  ]

  const mockPlaces = [
    { id: "1", name: "Örnek Restoran Ltd." },
    { id: "2", name: "Deniz Otel" },
    { id: "3", name: "Aktivite Merkezi" },
    { id: "4", name: "Boutique Shop" }
  ]

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePlanChange = (planType: string) => {
    setFormData(prev => ({ ...prev, planType, features: [] }))
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }))
  }

  const calculateEndDate = () => {
    if (formData.startDate && formData.billingCycle) {
      const cycle = billingCycles.find(c => c.value === formData.billingCycle)
      if (cycle) {
        const start = new Date(formData.startDate)
        start.setMonth(start.getMonth() + cycle.months)
        return start.toISOString().split('T')[0]
      }
    }
    return ""
  }

  const calculatePrice = () => {
    if (formData.planType && formData.billingCycle) {
      const plan = plans.find(p => p.value === formData.planType)
      const cycle = billingCycles.find(c => c.value === formData.billingCycle)
      if (plan && cycle) {
        const basePrice = parseFloat(plan.price)
        const totalPrice = basePrice * cycle.months
        const discountAmount = formData.discount ? (totalPrice * parseFloat(formData.discount)) / 100 : 0
        return totalPrice - discountAmount
      }
    }
    return 0
  }

  const handleSave = async () => {
    if (!formData.placeId || !formData.planType || !formData.billingCycle || !formData.paymentMethod) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success("Abonelik başarıyla oluşturuldu")
      router.push("/subscriptions")
    } catch (error) {
      toast.error("Abonelik oluşturulurken bir hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aktif</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Beklemede</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Süresi Doldu</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">İptal Edildi</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isPreview) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setIsPreview(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Düzenlemeye Dön
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Abonelik Önizleme</h2>
              <p className="text-muted-foreground">
                Oluşturduğunuz aboneliğin nasıl görüneceğini kontrol edin.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusBadge(formData.status)}
                  {formData.autoRenew && (
                    <Badge variant="secondary">Otomatik Yenileme</Badge>
                  )}
                </div>
                <CardTitle className="text-2xl mb-2">
                  {mockPlaces.find(p => p.id === formData.placeId)?.name || "Mekan Seçilmedi"}
                </CardTitle>
                <CardDescription className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    {plans.find(p => p.value === formData.planType)?.label || "Plan Seçilmedi"}
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {billingCycles.find(c => c.value === formData.billingCycle)?.label || "Döngü Seçilmedi"}
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Abonelik Bilgileri</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span>{plans.find(p => p.value === formData.planType)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fiyat:</span>
                    <span className="font-medium">₺{calculatePrice().toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">İndirim:</span>
                    <span>{formData.discount || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Başlangıç:</span>
                    <span>{formData.startDate || "Tarih seçilmedi"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bitiş:</span>
                    <span>{calculateEndDate() || "Hesaplanacak"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ödeme Yöntemi:</span>
                    <span>{paymentMethods.find(m => m.value === formData.paymentMethod)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Otomatik Yenileme:</span>
                    <span>{formData.autoRenew ? "Evet" : "Hayır"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Özellikler</h3>
                <div className="space-y-2">
                  {formData.features.length > 0 ? (
                    formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Özellik eklenmemiş.</p>
                  )}
                </div>
              </div>
            </div>

            {formData.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notlar</h3>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                  {formData.notes}
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Toplam Tutar:</span>
                <span className="text-2xl font-bold text-green-600">
                  ₺{calculatePrice().toLocaleString('tr-TR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Yeni Abonelik Oluştur</h2>
            <p className="text-muted-foreground">
              Yeni bir abonelik planı oluşturun.
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Önizle
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
              <CardDescription>
                Abonelik temel bilgilerini girin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="placeId">Mekan *</Label>
                  <Select value={formData.placeId} onValueChange={(value) => handleInputChange("placeId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mekan seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPlaces.map(place => (
                        <SelectItem key={place.id} value={place.id}>
                          {place.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planType">Plan Tipi *</Label>
                  <Select value={formData.planType} onValueChange={handlePlanChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Plan seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(plan => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label} - ₺{plan.price}/ay
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingCycle">Fatura Döngüsü *</Label>
                  <Select value={formData.billingCycle} onValueChange={(value) => handleInputChange("billingCycle", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Döngü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {billingCycles.map(cycle => (
                        <SelectItem key={cycle.value} value={cycle.value}>
                          {cycle.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Ödeme Yöntemi *</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ödeme yöntemi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Bitiş Tarihi</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={calculateEndDate()}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    placeholder="Otomatik hesaplanacak"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">İndirim (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => handleInputChange("discount", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Özellikler</CardTitle>
              <CardDescription>
                Abonelik özelliklerini belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Plan Özellikleri</Label>
                <div className="space-y-2">
                  {formData.planType && plans.find(p => p.value === formData.planType)?.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Ek Özellikler</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Ek özellik ekleyin"
                    onKeyPress={(e) => e.key === "Enter" && addFeature()}
                  />
                  <Button onClick={addFeature} size="sm">
                    Ekle
                  </Button>
                </div>

                {formData.features.length > 0 && (
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{feature}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(feature)}
                        >
                          <span className="text-red-500">×</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
              <CardDescription>
                Abonelik hakkında ek notlar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
                placeholder="Abonelik hakkında ek bilgiler veya özel notlar..."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fiyat Hesaplaması</CardTitle>
              <CardDescription>
                Abonelik fiyatı detayları.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Plan Fiyatı:</span>
                  <span>₺{formData.planType ? plans.find(p => p.value === formData.planType)?.price : "0"}/ay</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Döngü:</span>
                  <span>{formData.billingCycle ? billingCycles.find(c => c.value === formData.billingCycle)?.label : "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Alt Toplam:</span>
                  <span>₺{(calculatePrice() + (formData.discount ? (calculatePrice() * parseFloat(formData.discount.toString())) / (100 - parseFloat(formData.discount.toString())) : 0)).toLocaleString('tr-TR')}</span>
                </div>
                {formData.discount && (
                  <div className="flex justify-between text-sm">
                    <span>İndirim ({formData.discount}%):</span>
                    <span className="text-red-600">-₺{((calculatePrice() + (formData.discount ? (calculatePrice() * parseFloat(formData.discount.toString())) / (100 - parseFloat(formData.discount.toString())) : 0)) * parseFloat(formData.discount.toString()) / 100).toLocaleString('tr-TR')}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Toplam Tutar:</span>
                  <span className="text-lg text-green-600">₺{calculatePrice().toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yayın Durumu</CardTitle>
              <CardDescription>
                Abonelik ayarlarını yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Otomatik Yenileme</Label>
                  <p className="text-sm text-muted-foreground">
                    Abonelik süresi dolduğunda otomatik yenilensin
                  </p>
                </div>
                <Switch
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => handleInputChange("autoRenew", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="expired">Süresi Doldu</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <span>İpuçları</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Uzun vadeli aboneliklerde indirim yapabilirsiniz.</p>
              <p>• Otomatik yenileme müşteri bağlılığını artırır.</p>
              <p>• Özel özellikler değer katkısı sağlar.</p>
              <p>• Fiyatlandırma rekabet analizi yapılmalıdır.</p>
              <p>• Ödeme yöntemi esnekliği önemlidir.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}