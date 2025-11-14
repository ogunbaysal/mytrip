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
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  Camera,
  Upload,
  Plus,
  X,
  Save,
  Eye,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

export default function CreatePlacePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    hours: "",
    priceRange: "",
    features: [] as string[],
    images: [] as string[],
    isActive: true,
    isFeatured: false
  })

  const [newFeature, setNewFeature] = useState("")
  const [newImage, setNewImage] = useState("")

  const categories = [
    { value: "restaurant", label: "Restoran" },
    { value: "cafe", label: "Kafe" },
    { value: "hotel", label: "Otel" },
    { value: "activity", label: "Aktivite" },
    { value: "shop", label: "Mağaza" },
    { value: "service", label: "Hizmet" },
    { value: "attraction", label: "Turistik Mekan" }
  ]

  const cities = [
    { value: "muğla", label: "Muğla" },
    { value: "marmaris", label: "Marmaris" },
    { value: "fethiye", label: "Fethiye" },
    { value: "bodrum", label: "Bodrum" },
    { value: "dalaman", label: "Dalaman" },
    { value: "köyceğiz", label: "Köyceğiz" },
    { value: "datça", label: "Datça" }
  ]

  const priceRanges = [
    { value: "budget", label: "Ekonomik ($)" },
    { value: "moderate", label: "Orta ($$)" },
    { value: "expensive", label: "Pahalı ($$$)" },
    { value: "luxury", label: "Lüks ($$$$)" }
  ]

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const addImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }))
      setNewImage("")
    }
  }

  const removeImage = (image: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== image)
    }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.category || !formData.address || !formData.city) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success("Mekan başarıyla oluşturuldu")
      router.push("/places")
    } catch (error) {
      toast.error("Mekan oluşturulurken bir hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    setIsPreview(!isPreview)
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
              <h2 className="text-2xl font-bold tracking-tight">Mekan Önizleme</h2>
              <p className="text-muted-foreground">
                Oluşturduğunuz mekanın nasıl görüneceğini kontrol edin.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{formData.name || "Mekan Adı"}</CardTitle>
                <CardDescription className="flex items-center mt-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {formData.address || "Adres"}, {formData.city || "Şehir"}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                {formData.isFeatured && (
                  <Badge variant="secondary">Öne Çıkan</Badge>
                )}
                {formData.isActive && (
                  <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">{image}</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Açıklama</h3>
              <p className="text-muted-foreground">
                {formData.description || "Mekan açıklaması eklenmemiş."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">İletişim</h3>
                <div className="space-y-2 text-sm">
                  {formData.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {formData.phone}
                    </div>
                  )}
                  {formData.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {formData.email}
                    </div>
                  )}
                  {formData.website && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      {formData.website}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Bilgiler</h3>
                <div className="space-y-2 text-sm">
                  {formData.hours && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {formData.hours}
                    </div>
                  )}
                  {formData.priceRange && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      {priceRanges.find(r => r.value === formData.priceRange)?.label}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {formData.features.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Özellikler</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <Badge key={index} variant="outline">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
            <h2 className="text-2xl font-bold tracking-tight">Yeni Mekan Ekle</h2>
            <p className="text-muted-foreground">
              Platforma yeni bir mekan ekleyin.
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePreview}>
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
                Mekanın temel bilgilerini girin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Mekan Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Mekan adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  placeholder="Mekanı tanımlayın..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adres *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Adresi girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Şehir *</Label>
                  <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Şehir seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+90 212 555 0123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="info@mekan.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Web Sitesi</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://www.mekan.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Çalışma Saatleri</Label>
                  <Input
                    id="hours"
                    value={formData.hours}
                    onChange={(e) => handleInputChange("hours", e.target.value)}
                    placeholder="Hafta içi 09:00-18:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceRange">Fiyat Aralığı</Label>
                  <Select value={formData.priceRange} onValueChange={(value) => handleInputChange("priceRange", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Fiyat aralığı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRanges.map(range => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Özellikler</CardTitle>
              <CardDescription>
                Mekanın özelliklerini ekleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Özellik ekleyin (ör: Wi-Fi, Otopark, vb)"
                  onKeyPress={(e) => e.key === "Enter" && addFeature()}
                />
                <Button onClick={addFeature} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center">
                      {feature}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeFeature(feature)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Görseller</CardTitle>
              <CardDescription>
                Mekanın görsellerini ekleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Görsel URL'i veya adı"
                  onKeyPress={(e) => e.key === "Enter" && addImage()}
                />
                <Button onClick={addImage} size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Ekle
                </Button>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Camera className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{image}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(image)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Yayın Durumu</CardTitle>
              <CardDescription>
                Mekanın yayın ayarlarını yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aktif</Label>
                  <p className="text-sm text-muted-foreground">
                    Mekan görünür olsun
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Öne Çıkan</Label>
                  <p className="text-sm text-muted-foreground">
                    Ana sayfada görünsün
                  </p>
                </div>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleInputChange("isFeatured", checked)}
                />
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
              <p>• Kaliteli açıklamalar kullanıcıların ilgisini artırır.</p>
              <p>• Çalışma saatleri doğru olmalıdır.</p>
              <p>• İletişim bilgileri güncel olmalıdır.</p>
              <p>• Görseller mekanı doğru temsil etmelidir.</p>
              <p>• Özellikler arama sonuçlarında yardımcı olur.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}