"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Star,
  Edit,
  Eye,
  Image,
  Users,
  DollarSign,
  Building
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

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

export default function PlaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [place, setPlace] = useState<Place | null>(null)
  const [loading, setLoading] = useState(true)

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
  }, [params.id, router])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default"
      case "INACTIVE": return "secondary"
      case "PENDING": return "outline"
      case "SUSPENDED": return "destructive"
      default: return "outline"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Mekan Detayı</h1>
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
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
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
            <Link href="/places">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Mekan Detayı</h1>
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
            <Link href="/places">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Mekan Detayı</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/places/${place.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Place Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold">{place.name}</h2>
                    <Badge variant={getStatusBadgeVariant(place.status)}>
                      {place.status}
                    </Badge>
                    {place.featured && (
                      <Badge variant="secondary">Öne Çıkan</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {place.location}
                    </span>
                    <span>•</span>
                    <span>{place.type}</span>
                    <span>•</span>
                    <span>{place.category}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Images */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Görseller
                </h3>
                <div className="grid gap-2 md:grid-cols-3">
                  {place.images.map((image, index) => (
                    <div key={index} className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h3 className="font-medium mb-3">Açıklama</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {place.description}
                </p>
              </div>

              <Separator />

              {/* Rating & Reviews */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Değerlendirme & İncelemeler
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-semibold ml-1">{place.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({place.reviewCount} inceleme)
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Amenities */}
              <div>
                <h3 className="font-medium mb-3">Olanaklar</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {place.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  İletişim Bilgileri
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{place.contactInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{place.contactInfo.email}</span>
                  </div>
                  {place.contactInfo.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={place.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {place.contactInfo.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Rezervasyon İstatistikleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{place.bookingCount}</div>
                  <div className="text-sm text-muted-foreground">Toplam Rezervasyon</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ₺{place.revenue.toLocaleString("tr-TR")}
                  </div>
                  <div className="text-sm text-muted-foreground">Toplam Gelir</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Mekan Sahibi
              </CardTitle>
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
              <Button variant="outline" className="w-full" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Sahibi Görüntüle
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mekan ID:</span>
                  <span className="font-mono">#{place.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fiyat Aralığı:</span>
                  <span>{place.priceRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durum:</span>
                  <Badge variant={getStatusBadgeVariant(place.status)} className="text-xs">
                    {place.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Öne Çıkan:</span>
                  <Badge variant={place.featured ? "default" : "secondary"} className="text-xs">
                    {place.featured ? "Evet" : "Hayır"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oluşturulma:</span>
                  <span>{new Date(place.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Güncelleme:</span>
                  <span>{new Date(place.updatedAt).toLocaleDateString("tr-TR")}</span>
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
              <Button className="w-full" asChild>
                <Link href={`/places/${place.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Mekanı Düzenle
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Site Görünümü
              </Button>
              <Button variant="outline" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Finansal Rapor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}