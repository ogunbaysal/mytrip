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
  MapPin,
  Phone,
  Mail,
  Globe,
  Edit,
  Image,
  Plus,
  X,
  Building,
  Star
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const placeEditSchema = z.object({
  name: z.string().min(1, "Mekan adı zorunludur"),
  type: z.string().min(1, "Mekan türü zorunludur"),
  category: z.string().min(1, "Kategori zorunludur"),
  location: z.string().min(1, "Konum zorunludur"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"]),
  featured: z.boolean(),
  rating: z.number().min(0).max(5),
  priceRange: z.string().min(1, "Fiyat aralığı zorunludur"),
  contactPhone: z.string().min(1, "Telefon zorunludur"),
  contactEmail: z.string().email("Geçerli bir e-posta adresi girin"),
  contactWebsite: z.string().optional(),
  amenities: z.array(z.string()),
  images: z.array(z.string()),
})

type PlaceEditForm = z.infer<typeof placeEditSchema>

interface Place {
  id: string
  name: string
  type: string
  category: string
  location: string
  description: string
  owner: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED"
  featured: boolean
  rating: number
  reviewCount: number
  priceRange: string
  contactInfo: {
    phone: string
    email: string
    website: string | null
  }
  amenities: string[]
  images: string[]
  bookingCount: number
  revenue: number
  createdAt: string
  updatedAt: string
}

export default function PlaceEditPage() {
  const params = useParams()
  const router = useRouter()
  const [place, setPlace] = useState<Place | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newAmenity, setNewAmenity] = useState("")
  const [newImage, setNewImage] = useState("")

  const form = useForm<PlaceEditForm>({
    resolver: zodResolver(placeEditSchema),
    defaultValues: {
      name: "",
      type: "",
      category: "",
      location: "",
      description: "",
      status: "PENDING",
      featured: false,
      rating: 0,
      priceRange: "",
      contactPhone: "",
      contactEmail: "",
      contactWebsite: "",
      amenities: [],
      images: [],
    },
  })

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        setLoading(true)
        // Simulate API call to fetch place details
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock place data - in real app, this would be an API call
        const mockPlace: Place = {
          id: params.id as string,
          name: "Bodrum Marina Otel",
          type: "Otel",
          category: "Lüks Konaklama",
          location: "Bodrum, Muğla",
          description: "Bodrum'un kalbinde, Ege Denizi'nin eşsiz manzarasına sahip lüks otelimiz. Modern tasarım ve Türk misafirperverliğini bir araya getiren tesisimiz, konuklarına unutulmaz bir konaklama deneyimi sunuyor. Özel plaj alanı, spa merkezi ve restoranlarımızla tatilinizi özel kılıyoruz.",
          owner: {
            id: "owner1",
            name: "Mehmet Yılmaz",
            email: "mehmet.yilmaz@example.com",
            avatar: null,
          },
          status: "ACTIVE",
          featured: true,
          rating: 4.8,
          reviewCount: 124,
          priceRange: "₺₺₺₺",
          contactInfo: {
            phone: "+90 252 123 4567",
            email: "info@bodrummarinaotel.com",
            website: "https://bodrummarinaotel.com",
          },
          amenities: [
            "Ücretsiz Wi-Fi",
            "Spa & Wellness",
            "Özel Plaj",
            "Restoran",
            "Otopark",
            "Havuz",
            "24/7 Oda Servisi",
            "Fitness Merkezi"
          ],
          images: [
            "/place-images/bodrum-marina-1.jpg",
            "/place-images/bodrum-marina-2.jpg",
            "/place-images/bodrum-marina-3.jpg",
          ],
          bookingCount: 342,
          revenue: 856750,
          createdAt: "2024-01-15T09:00:00Z",
          updatedAt: "2024-11-14T10:30:00Z"
        }

        setPlace(mockPlace)
        form.reset({
          name: mockPlace.name,
          type: mockPlace.type,
          category: mockPlace.category,
          location: mockPlace.location,
          description: mockPlace.description,
          status: mockPlace.status,
          featured: mockPlace.featured,
          rating: mockPlace.rating,
          priceRange: mockPlace.priceRange,
          contactPhone: mockPlace.contactInfo.phone,
          contactEmail: mockPlace.contactInfo.email,
          contactWebsite: mockPlace.contactInfo.website || "",
          amenities: mockPlace.amenities,
          images: mockPlace.images,
        })
      } catch (error) {
        toast.error("Mekan bilgileri yüklenemedi")
        router.push("/places")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPlace()
    }
  }, [params.id, router, form])

  const onSubmit = async (data: PlaceEditForm) => {
    if (!place) return

    try {
      setSaving(true)

      // Simulate API call to update place
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In a real app, this would be an API call
      console.log("Updating place:", {
        id: place.id,
        ...data,
        updatedAt: new Date().toISOString(),
      })

      toast.success("Mekan bilgileri başarıyla güncellendi")
      router.push(`/places/${place.id}`)
    } catch (error) {
      toast.error("Mekan güncellenemedi")
    } finally {
      setSaving(false)
    }
  }

  const addAmenity = () => {
    if (newAmenity.trim()) {
      const currentAmenities = form.getValues("amenities")
      form.setValue("amenities", [...currentAmenities, newAmenity.trim()])
      setNewAmenity("")
    }
  }

  const removeAmenity = (index: number) => {
    const currentAmenities = form.getValues("amenities")
    form.setValue("amenities", currentAmenities.filter((_, i) => i !== index))
  }

  const addImage = () => {
    if (newImage.trim()) {
      const currentImages = form.getValues("images")
      form.setValue("images", [...currentImages, newImage.trim()])
      setNewImage("")
    }
  }

  const removeImage = (index: number) => {
    const currentImages = form.getValues("images")
    form.setValue("images", currentImages.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Mekanı Düzenle</h1>
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

  if (!place) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/places/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Mekanı Düzenle</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Mekan bulunamadı.</p>
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
            <Link href={`/places/${place.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Mekanı Düzenle</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/places/${place.id}`}>
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
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Temel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Mekan Adı</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Mekan adını girin"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Mekan Türü</Label>
                    <Input
                      id="type"
                      {...form.register("type")}
                      placeholder="Örn: Otel, Restoran, Kafe"
                    />
                    {form.formState.errors.type && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.type.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      {...form.register("category")}
                      placeholder="Örn: Lüks Konaklama, Yerel Lezzetler"
                    />
                    {form.formState.errors.category && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Konum</Label>
                    <Input
                      id="location"
                      {...form.register("location")}
                      placeholder="Şehir, İlçe"
                    />
                    {form.formState.errors.location && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.location.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Mekan hakkında detaylı bilgi..."
                    rows={4}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceRange">Fiyat Aralığı</Label>
                  <Input
                    id="priceRange"
                    {...form.register("priceRange")}
                    placeholder="Örn: ₺₺, ₺₺₺, ₺₺₺₺"
                  />
                  {form.formState.errors.priceRange && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.priceRange.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  İletişim Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Telefon</Label>
                    <Input
                      id="contactPhone"
                      {...form.register("contactPhone")}
                      placeholder="+90 252 123 4567"
                    />
                    {form.formState.errors.contactPhone && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.contactPhone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">E-posta</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...form.register("contactEmail")}
                      placeholder="info@mekan.com"
                    />
                    {form.formState.errors.contactEmail && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.contactEmail.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactWebsite">Web Sitesi</Label>
                  <Input
                    id="contactWebsite"
                    {...form.register("contactWebsite")}
                    placeholder="https://www.mekan.com"
                  />
                  {form.formState.errors.contactWebsite && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.contactWebsite.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status & Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Durum & Ayarlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                        <SelectItem value="INACTIVE">Pasif</SelectItem>
                        <SelectItem value="PENDING">Beklemede</SelectItem>
                        <SelectItem value="SUSPENDED">Askıya Alındı</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.status && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.status.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating">Değerlendirme (0-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      {...form.register("rating", { valueAsNumber: true })}
                      placeholder="4.5"
                    />
                    {form.formState.errors.rating && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.rating.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="featured">Öne Çıkan</Label>
                    <p className="text-sm text-muted-foreground">
                      Mekanı ana sayfada ve aramalarda öne çıkar
                    </p>
                  </div>
                  <Switch
                    id="featured"
                    checked={form.watch("featured")}
                    onCheckedChange={(checked) => form.setValue("featured", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Olanaklar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="Yeni olanak ekle..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                  />
                  <Button type="button" onClick={addAmenity}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {form.watch("amenities").map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Görseller
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="Görsel URL'si ekle..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
                  />
                  <Button type="button" onClick={addImage}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-2">
                  {form.watch("images").map((image, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm truncate flex-1">{image}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle>Mekan Sahibi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={place.owner.avatar || undefined} alt={place.owner.name} />
                    <AvatarFallback>
                      <Building className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{place.owner.name}</div>
                    <div className="text-sm text-muted-foreground">{place.owner.email}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Place Stats */}
            <Card>
              <CardHeader>
                <CardTitle>İstatistikler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rezervasyon:</span>
                    <span className="font-medium">{place.bookingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gelir:</span>
                    <span className="font-medium">₺{place.revenue.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">İnceleme:</span>
                    <span className="font-medium">{place.reviewCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p className="text-muted-foreground">
                    <strong>Mekan ID:</strong> #{place.id}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Oluşturulma:</strong> {new Date(place.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Güncelleme:</strong> {new Date(place.updatedAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}