"use client"

import { useState, useEffect } from "react"
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
import { useSettings, useUpdateSettings, useUpdateProfile } from "@/hooks/use-settings"
import { useAuth } from "@/hooks/use-auth"

import { useSearchParams, useRouter, usePathname } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "general"

  const { data: settings, isLoading: isLoadingSettings } = useSettings()
  const { mutate: updateSettings, isPending: isSavingSettings } = useUpdateSettings()
  const { mutate: updateProfile, isPending: isSavingProfile } = useUpdateProfile()
  const { user } = useAuth()
  
  // Local state for forms
  const [generalForm, setGeneralForm] = useState<any>({})
  const [notificationsForm, setNotificationsForm] = useState<any>({})
  const [billingForm, setBillingForm] = useState<any>({})
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    phone: "",
    avatar: ""
  })

  // Initialize forms with data
  useEffect(() => {
    if (settings) {
      if (settings.general) setGeneralForm(settings.general)
      if (settings.notifications) setNotificationsForm(settings.notifications)
      if (settings.billing) setBillingForm(settings.billing)
    }
  }, [settings])

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        bio: user.bio || "",
        phone: user.phone || "",
        avatar: user.image || user.avatar || ""
      })
    }
  }, [user])

  const handleGeneralSave = () => {
    updateSettings({ key: "general", value: generalForm })
  }

  const handleNotificationsSave = () => {
    updateSettings({ key: "notifications", value: notificationsForm })
  }
  
  const handleBillingSave = () => {
      updateSettings({ key: "billing", value: billingForm })
  }

  const handleProfileSave = () => {
    updateProfile(profileForm)
  }

  const onTabChange = (value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set("tab", value)
      router.push(`${pathname}?${params.toString()}`)
  }

  if (isLoadingSettings) return <div>Yükleniyor...</div>

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

      <Tabs defaultValue="general" value={currentTab} onValueChange={onTabChange} className="space-y-4">
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
                  <Input 
                    id="site-name" 
                    value={generalForm.siteName || ""} 
                    onChange={(e) => setGeneralForm({...generalForm, siteName: e.target.value})}
                    placeholder="MyTrip Admin" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-email">E-posta Adresi</Label>
                  <Input 
                    id="site-email" 
                    type="email" 
                    value={generalForm.siteEmail || ""} 
                    onChange={(e) => setGeneralForm({...generalForm, siteEmail: e.target.value})}
                    placeholder="admin@mytrip.com" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zaman Dilimi</Label>
                  <Select 
                    value={generalForm.timezone || "europe/istanbul"}
                    onValueChange={(val) => setGeneralForm({...generalForm, timezone: val})}
                  >
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
                  <Select 
                    value={generalForm.language || "tr"}
                    onValueChange={(val) => setGeneralForm({...generalForm, language: val})}
                  >
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
                  value={generalForm.description || ""}
                  onChange={(e) => setGeneralForm({...generalForm, description: e.target.value})}
                  placeholder="Platform açıklaması..."
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
                  <Switch 
                    checked={generalForm.maintenanceMode || false}
                    onCheckedChange={(checked) => setGeneralForm({...generalForm, maintenanceMode: checked})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleGeneralSave} disabled={isSavingSettings}>
                  {isSavingSettings ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
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
                  <AvatarImage src={profileForm.avatar} alt={profileForm.name} />
                  <AvatarFallback>{profileForm.name?.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Button variant="outline" size="sm">Avatar Değiştir</Button>
                  <p className="text-sm text-muted-foreground">
                    Gelecekte eklenecek.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input 
                    id="name" 
                    value={profileForm.name} 
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={profileForm.phone} 
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografi</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                  placeholder="Kendinizden biraz bahsedin..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                  {isSavingProfile ? "Kaydediliyor..." : "Profili Güncelle"}
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
                  </div>
                  <Switch 
                    checked={notificationsForm.newUser || false}
                    onCheckedChange={(checked) => setNotificationsForm({...notificationsForm, newUser: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Yeni Mekan Onayları</Label>
                  </div>
                  <Switch 
                     checked={notificationsForm.newPlace || false}
                     onCheckedChange={(checked) => setNotificationsForm({...notificationsForm, newPlace: checked})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNotificationsSave} disabled={isSavingSettings}>
                  {isSavingSettings ? "Kaydediliyor..." : "Bildirim Ayarlarını Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keeping other tabs static for now or adding similar logic */}
        <TabsContent value="billing" className="space-y-4">
           {/* Billing implementation skipped for brevity, similar pattern */}
           <div className="p-4 text-muted-foreground">Faturalandırma ayarları yakında eklenecek.</div>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
            <div className="p-4 text-muted-foreground">Güvenlik ayarları (şifre vb.) auth provider üzerinden yönetilmelidir.</div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Sistem Bilgileri</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="space-y-2">
                        <Label>Sistem Versiyonu</Label>
                        <p>v1.0.0</p>
                     </div>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}