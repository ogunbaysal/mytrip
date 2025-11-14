"use client"

import { ChevronUp, Hotel, Users, MapPin, FileText, CreditCard, BarChart3, Settings, LogOut, ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface MenuItem {
  title: string
  url: string
  icon: any
  badge?: string
  subItems?: { title: string; url: string }[]
}

// Admin menu items
const adminMenuItems: MenuItem[] = [
  {
    title: "Panel",
    url: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Kullanıcılar",
    url: "/users",
    icon: Users,
    badge: "12",
    subItems: [
      { title: "Tüm Kullanıcılar", url: "/users" },
      { title: "Mekan Sahipleri", url: "/users/owners" },
      { title: "Seyahatçiler", url: "/users/travelers" },
      { title: "Adminler", url: "/users/admins" },
    ],
  },
  {
    title: "Mekanlar",
    url: "/places",
    icon: MapPin,
    badge: "8",
    subItems: [
      { title: "Tüm Mekanlar", url: "/places" },
      { title: "Onay Bekleyen", url: "/places/pending" },
      { title: "Oteller", url: "/places/hotels" },
      { title: "Restoranlar", url: "/places/restaurants" },
      { title: "Villalar", url: "/places/villas" },
      { title: "Aktiviteler", url: "/places/activities" },
    ],
  },
  {
    title: "Bloglar",
    url: "/blogs",
    icon: FileText,
    badge: "3",
    subItems: [
      { title: "Tüm Bloglar", url: "/blogs" },
      { title: "Onay Bekleyen", url: "/blogs/pending" },
      { title: "Yayınlanan", url: "/blogs/published" },
      { title: "Taslaklar", url: "/blogs/drafts" },
    ],
  },
  {
    title: "Abonelikler",
    url: "/subscriptions",
    icon: CreditCard,
      subItems: [
      { title: "Tüm Abonelikler", url: "/subscriptions" },
      { title: "Aktif Abonelikler", url: "/subscriptions/active" },
      { title: "Pasif Abonelikler", url: "/subscriptions/inactive" },
      { title: "Plan Yönetimi", url: "/subscriptions/plans" },
      { title: "Ödemeler", url: "/subscriptions/payments" },
    ],
  },
  {
    title: "Ayarlar",
    url: "/settings",
    icon: Settings,
      subItems: [
      { title: "Genel Ayarlar", url: "/settings/general" },
      { title: "E-posta Şablonları", url: "/settings/email-templates" },
      { title: "Sistem Bildirimleri", url: "/settings/notifications" },
      { title: "Yedekleme", url: "/settings/backup" },
    ],
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Hotel className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">MyTrip</span>
                <span className="text-xs">Admin Panel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">
            Ana Menü
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <>
                      <SidebarMenuButton asChild>
                        <a href={item.url} className="font-medium">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </a>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={subItem.url} className="text-sm">
                                {subItem.title}
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </>
                  ) : (
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="font-medium">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">
            Sistem
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="size-4" />
                  <span>Çıkış Yap</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full justify-start"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/avatars/admin.jpg" alt="Admin" />
                    <AvatarFallback className="rounded-lg">AD</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Admin</span>
                    <span className="truncate text-xs">admin@mytrip.com</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/avatars/admin.jpg" alt="Admin" />
                      <AvatarFallback className="rounded-lg">AD</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium leading-none">Admin</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        admin@mytrip.com
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ayarlar</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

