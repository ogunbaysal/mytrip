"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Settings,
  User,
  Globe,
  Shield,
  Bell,
  Palette,
  Database,
  Mail,
  Smartphone,
  CreditCard,
  Key,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (section: string) => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success(`${section} ayarları kaydedildi`)
    setIsSaving(false)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ayarlar</h2>
          <p className="text-muted-foreground">
            Sistem ayarlarınızı yönetin ve kişiselleştirin.
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="user">Kullanıcı</TabsTrigger>
          <TabsTrigger value="security">Güvenlik</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="billing">Faturalandırma</TabsTrigger>
          <TabsTrigger value="system">Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Genel Ayarlar</span>
              </CardTitle>
              <CardDescription>
                Platformun genel ayarlarını yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Platform Adı</Label>
                  <Input id="site-name" defaultValue="MyTrip Admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-email">E-posta Adresi</Label>
                  <Input id="site-email" type="email" defaultValue="admin@mytrip.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zaman Dilimi</Label>
                  <Select defaultValue="europe/istanbul">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe/istanbul">Europe/Istanbul (UTC+3)</SelectItem>
                      <SelectItem value="europe/london">Europe/London (UTC+0)</SelectItem>
                      <SelectItem value="america/new_york">America/New_York (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Varsayılan Dil</Label>
                  <Select defaultValue="tr">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-description">Platform Açıklaması</Label>
                <Textarea
                  id="site-description"
                  rows={3}
                  defaultValue="Muğla bölgesi için seyahat keşif platformu yönetim paneli."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bakım Modu</Label>
                    <p className="text-sm text-muted-foreground">
                      Sistem bakımdayken kullanıcı erişimini kısıtla
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Yeni Kayıtlar</Label>
                    <p className="text-sm text-muted-foreground">
                      Yeni kullanıcı kayıtlarına izin ver
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-posta Doğrulama</Label>
                    <p className="text-sm text-muted-foreground">
                      Yeni kullanıcıların e-posta doğrulaması yapılmalı
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Genel")} disabled={isSaving}>
                  {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profil Ayarları</span>
              </CardTitle>
              <CardDescription>
                Kişisel profil bilgilerinizi yönetin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/avatars/admin.jpg" alt="Admin User" />
                  <AvatarFallback>AU</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Button variant="outline" size="sm">Avatar Değiştir</Button>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG veya GIF. Maksimum 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first-name">Ad</Label>
                  <Input id="first-name" defaultValue="Admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Soyad</Label>
                  <Input id="last-name" defaultValue="User" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input id="email" type="email" defaultValue="admin@mytrip.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" type="tel" defaultValue="+90 212 555 0123" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografi</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder="Kendinizden biraz bahsedin..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">İptal</Button>
                <Button onClick={() => handleSave("Profil")} disabled={isSaving}>
                  {isSaving ? "Kaydediliyor..." : "Profili Güncelle"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Güvenlik Ayarları</span>
              </CardTitle>
              <CardDescription>
                Hesap güvenliğinizi yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mevcut Şifre</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Yeni Şifre</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Yeni Şifreyi Onayla</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span>İki Faktörlü Kimlik Doğrulama</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Hesabınıza ek güvenlik katmanı ekleyin
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>E-posta Bildirimleri</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Hesap etkinlikleri için e-posta bildirimleri al
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">İptal</Button>
                <Button onClick={() => handleSave("Güvenlik")} disabled={isSaving}>
                  {isSaving ? "Kaydediliyor..." : "Güvenlik Ayarlarını Güncelle"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Oturum Yönetimi</span>
              </CardTitle>
              <CardDescription>
                Aktif oturumlarınızı görüntüleyin ve yönetin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Mevcut Oturum</p>
                      <p className="text-sm text-muted-foreground">
                        Chrome • macOS • Şu anda aktif
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Mevcut</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Mobil Oturum</p>
                      <p className="text-sm text-muted-foreground">
                        Safari • iOS • 2 saat önce
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Oturumu Sonlandır</Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="destructive" size="sm">
                  Tüm Diğer Oturumları Sonlandır
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Bildirim Ayarları</span>
              </CardTitle>
              <CardDescription>
                Bildirim tercihlerinizi yönetin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">E-posta Bildirimleri</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Yeni Kullanıcı Kayıtları</Label>
                    <p className="text-sm text-muted-foreground">
                      Yeni kullanıcı kayıt olduğunda bildirim al
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Yeni Mekan Onayları</Label>
                    <p className="text-sm text-muted-foreground">
                      Yeni mekan onay beklediğinde bildirim al
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Abonelik Ödemeleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Başarısız ödemeler olduğunda bildirim al
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Haftalık Raporlar</Label>
                    <p className="text-sm text-muted-foreground">
                      Haftalık sistem raporları al
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sistem Bildirimleri</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sistem Güncellemeleri</Label>
                    <p className="text-sm text-muted-foreground">
                      Sistem güncellemeleri hakkında bilgi al
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Güvenlik Uyarıları</Label>
                    <p className="text-sm text-muted-foreground">
                      Potansiyel güvenlik tehditleri hakkında bilgi al
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Bildirimler")} disabled={isSaving}>
                  {isSaving ? "Kaydediliyor..." : "Bildirim Ayarlarını Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Faturalandırma Ayarları</span>
              </CardTitle>
              <CardDescription>
                Faturalandırma ve ödeme ayarlarını yönetin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Ödeme Bilgileri</h3>

                <div className="space-y-2">
                  <Label htmlFor="card-name">Kart Sahibi</Label>
                  <Input id="card-name" defaultValue="Admin User" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-number">Kart Numarası</Label>
                  <Input id="card-number" placeholder="1234 5678 9012 3456" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Son Kullanma Tarihi</Label>
                    <Input id="expiry" placeholder="AA/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Fatura Adresi</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing-company">Şirket Adı</Label>
                    <Input id="billing-company" placeholder="MyTrip Teknoloji A.Ş." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-tax">Vergi No</Label>
                    <Input id="billing-tax" placeholder="1234567890" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing-address">Adres</Label>
                  <Textarea id="billing-address" rows={2} placeholder="Fatura adresi..." />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">İptal</Button>
                <Button onClick={() => handleSave("Faturalandırma")} disabled={isSaving}>
                  {isSaving ? "Kaydediliyor..." : "Faturalandırma Ayarlarını Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Sistem Bilgileri</span>
              </CardTitle>
              <CardDescription>
                Sistem durumu ve performans metrikleri.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Label className="font-medium">Veritabanı Durumu</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Bağlantı aktif</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Label className="font-medium">API Durumu</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Çalışıyor</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <Label className="font-medium">Sistem Versiyonu</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">v1.0.0</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sistem Metrikleri</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Toplam Kullanıcı</Label>
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-sm text-green-600">+12% geçen aydan</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Aktif Abonelik</Label>
                    <div className="text-2xl font-bold">456</div>
                    <p className="text-sm text-green-600">+8% geçen aydan</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Depolama Kullanımı</Label>
                    <div className="text-2xl font-bold">2.3 GB</div>
                    <p className="text-sm text-muted-foreground">Toplam 10 GB</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Bant Genişliği</Label>
                    <div className="text-2xl font-bold">45.2 GB</div>
                    <p className="text-sm text-muted-foreground">Bu ay</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Bakım İşlemleri</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">Veritabanı Yedekleme</p>
                        <p className="text-sm text-muted-foreground">Son yedekleme: 2 saat önce</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Şimdi Yedekle</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="font-medium">Log Temizleme</p>
                        <p className="text-sm text-muted-foreground">Bir sonraki temizleme: 5 gün içinde</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Şimdi Temizle</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Info className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">Önbellek Temizleme</p>
                        <p className="text-sm text-muted-foreground">Son temizleme: 1 gün önce</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Şimdi Temizle</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}