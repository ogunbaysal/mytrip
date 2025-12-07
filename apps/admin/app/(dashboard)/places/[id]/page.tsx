"use client"

import { usePlace, useTogglePlaceFeature, useTogglePlaceVerify, useUpdatePlaceStatus, Place } from "@/hooks/use-places"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, MapPin, MoreHorizontal, CheckCircle2, Star, EyeIcon, BookOpen, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { toast } from "sonner"

export default function PlaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const placeId = params.id as string
  
  const { data: place, isLoading, refetch } = usePlace(placeId)
  const { mutate: updateStatus } = useUpdatePlaceStatus()
  const { mutate: toggleVerify } = useTogglePlaceVerify()
  const { mutate: toggleFeature } = useTogglePlaceFeature()

  const handleAction = (action: () => void, successMsg: string) => {
      action();
      setTimeout(() => {
          refetch(); // Ensure data is fresh
          toast.success(successMsg);
      }, 500);
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
           <Skeleton className="h-8 w-64" />
           <Skeleton className="h-10 w-32" />
        </div>
         <Skeleton className="h-[200px]" />
         <div className="grid gap-4 md:grid-cols-4">
           {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="flex-1 p-8 pt-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold mb-2">Mekan Bulunamadı</h2>
        <Button onClick={() => router.push("/places")}>Listeye Dön</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
             <div className="flex items-center space-x-2">
                <h2 className="text-3xl font-bold tracking-tight">{place.name}</h2>
                {place.verified && <CheckCircle2 className="h-6 w-6 text-blue-500" />}
                {place.featured && <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />}
             </div>
             <p className="text-muted-foreground flex items-center">
                 <MapPin className="h-4 w-4 mr-1" /> {place.city}, {place.district}
             </p>
        </div>
        <div className="flex items-center space-x-2">
           <Button variant="outline" onClick={() => router.push("/places")}>Geri Dön</Button>
           <Button onClick={() => router.push(`/places/${place.id}/edit`)}>Düzenle</Button>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                <DropdownMenuSeparator />
               {place.status !== "active" && (
                  <DropdownMenuItem 
                    className="text-green-600"
                    onClick={() => handleAction(() => updateStatus({ placeId: place.id, status: "active" }), "Mekan aktifleştirildi")}
                  >
                    Aktifleştir
                  </DropdownMenuItem>
                )}
                {place.status === "active" && (
                  <DropdownMenuItem 
                    className="text-orange-600"
                    onClick={() => handleAction(() => updateStatus({ placeId: place.id, status: "suspended" }), "Mekan askıya alındı")}
                  >
                    Askıya Al
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction(() => toggleVerify(placeId), place.verified ? "Doğrulama kaldırıldı" : "Mekan doğrulandı")}>
                    {place.verified ? "Doğrulamayı Kaldır" : "Doğrula"}
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleAction(() => toggleFeature(placeId), place.featured ? "Öne çıkarılanlardan kaldırıldı" : "Mekan öne çıkarıldı")}>
                    {place.featured ? "Öne Çıkarılanlardan Kaldır" : "Öne Çıkar"}
                </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Görüntülenme</CardTitle>
            <EyeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{place.views || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puan</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{place.rating} <span className="text-sm font-normal text-muted-foreground">/ 5</span></div>
            <p className="text-xs text-muted-foreground">{place.reviewCount} değerlendirme</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rezervasyonlar</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{place.bookingCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durum</CardTitle>
            <div className={`h-2 w-2 rounded-full ${place.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{place.status}</div>
            <p className="text-xs text-muted-foreground">
               {formatDistanceToNow(new Date(place.createdAt), { addSuffix: true, locale: tr })} oluşturuldu
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Genel Bakış</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-1">Açıklama</h4>
                        <p className="text-sm text-muted-foreground">{place.description}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1">Adres</h4>
                        <p className="text-sm text-muted-foreground">{place.address}</p>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Mekan Sahibi</CardTitle>
                </CardHeader>
                <CardContent>
                     {place.ownerName ? (
                         <div className="flex items-center space-x-4">
                             <div className="bg-primary/10 p-2 rounded-full">
                                 <User className="h-6 w-6 text-primary" />
                             </div>
                             <div>
                                 <div className="font-medium">{place.ownerName}</div>
                                 <div className="text-sm text-muted-foreground">{place.ownerEmail}</div>
                             </div>
                             <Button variant="ghost" size="sm" asChild>
                                 <Link href={`/users/${place.ownerId}`}>Profil</Link>
                             </Button>
                         </div>
                     ) : (
                         <div className="text-sm text-muted-foreground">Sahibi bulunamadı veya atanmamış.</div>
                     )}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Özellikler</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Tip</span>
                            <span className="font-medium capitalize">{place.type}</span>
                        </div>
                        <div className="flex flex-col">
                             <span className="text-xs text-muted-foreground">Kategori</span>
                             <span className="font-medium capitalize">{place.category}</span>
                        </div>
                        <div className="flex flex-col">
                             <span className="text-xs text-muted-foreground">Fiyat Seviyesi</span>
                             <span className="font-medium">{"$".repeat(Number(place.priceLevel))}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
             {place.images && place.images.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Görseller</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                             {place.images.slice(0, 4).map((img, i) => (
                                 <div key={i} className="aspect-square bg-gray-100 rounded-md overflow-hidden relative">
                                     <img src={img} alt={`${place.name} ${i}`} className="object-cover w-full h-full" />
                                 </div>
                             ))}
                        </div>
                    </CardContent>
                </Card>
             )}
        </div>
      </div>
    </div>
  )
}