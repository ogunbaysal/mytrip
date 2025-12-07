"use client"

import { useUser, useUpdateUserStatus } from "@/hooks/use-users"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Mail, MapPin, MoreHorizontal, Phone, Shield, User as UserIcon } from "lucide-react"
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

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const { data: user, isLoading } = useUser(userId)
  const { mutate: updateStatus } = useUpdateUserStatus()

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
           <Skeleton className="h-8 w-64" />
           <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
         <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-1 p-8 pt-6 flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold mb-2">Kullanıcı Bulunamadı</h2>
        <p className="text-muted-foreground mb-4">Aradığınız kullanıcı silinmiş veya mevcut değil.</p>
        <Button onClick={() => router.push("/users")}>Listeye Dön</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
           <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar || ""} alt={user.name} />
              <AvatarFallback className="text-xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
           </Avatar>
           <div>
             <h2 className="text-3xl font-bold tracking-tight">{user.name}</h2>
             <p className="text-muted-foreground">{user.email}</p>
           </div>
        </div>
        <div className="flex items-center space-x-2">
           <Button variant="outline" onClick={() => router.push("/users")}>Geri Dön</Button>
           <Button onClick={() => router.push(`/users/${user.id}/edit`)}>Düzenle</Button>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                <DropdownMenuSeparator />
               {user.status === "active" ? (
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => updateStatus({ userId: user.id, status: "suspended" })}
                  >
                    Askıya Al
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    className="text-green-600"
                    onClick={() => updateStatus({ userId: user.id, status: "active" })}
                  >
                    Aktifleştir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Mekan</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.placeCount}</div>
            <p className="text-xs text-muted-foreground">
               Oluşturulan mekan sayısı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rol</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {user.role === "admin" ? "Yönetici" : user.role === "owner" ? "Mekan Sahibi" : "Gezgin"}
            </div>
            <p className="text-xs text-muted-foreground">
              Hesap yetki seviyesi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durum</CardTitle>
            <div className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
               {user.status === "active" ? "Aktif" : user.status === "suspended" ? "Askıya Alındı" : "Beklemede"}
            </div>
            <p className="text-xs text-muted-foreground">
              Mevcut hesap durumu
            </p>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kayıt Tarihi</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Date(user.createdAt).toLocaleDateString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">
               {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: tr })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="activity">Aktivite</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                     <span className="text-sm font-medium text-muted-foreground">Email</span>
                     <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                        {user.emailVerified && <Badge variant="secondary" className="ml-2 text-xs">Onaylı</Badge>}
                     </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                     <span className="text-sm font-medium text-muted-foreground">Telefon</span>
                     <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{user.phone || "-"}</span>
                     </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                     <span className="text-sm font-medium text-muted-foreground">Son Giriş</span>
                     <span>
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleString("tr-TR") 
                          : "Henüz giriş yapmadı"}
                     </span>
                  </div>
                  <div className="flex flex-col space-y-1">
                     <span className="text-sm font-medium text-muted-foreground">Abonelik Durumu</span>
                     <span>{user.subscriptionStatus || "Standart"}</span>
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
           <Card>
              <CardHeader>
                 <CardTitle>Son Aktiviteler</CardTitle>
                 <CardDescription>Kullanıcının son işlemleri burada listelenir (Yakında)</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="text-sm text-muted-foreground">Henüz aktivite kaydı bulunmuyor.</div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}