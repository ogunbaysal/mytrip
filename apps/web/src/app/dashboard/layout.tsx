"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  FileText,
  CreditCard,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Genel Bakış",
    href: "/dashboard",
    icon: LayoutDashboard,
    gradient: "from-violet-500 to-purple-600",
    comingSoon: false,
  },
  {
    label: "Mekanlar",
    href: "/dashboard/places",
    icon: Building2,
    gradient: "from-blue-500 to-cyan-600",
    comingSoon: false,
  },
  {
    label: "Blog Yazıları",
    href: "/dashboard/blogs",
    icon: FileText,
    gradient: "from-emerald-500 to-teal-600",
    comingSoon: false,
  },
  {
    label: "Abonelik",
    href: "/dashboard/subscription",
    icon: CreditCard,
    gradient: "from-amber-500 to-orange-600",
    comingSoon: false,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    gradient: "from-pink-500 to-rose-600",
    comingSoon: true,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
    refetchOnWindowFocus: true,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["session"],
        refetchType: "all",
      });
      queryClient.clear();
      window.location.href = "/";
    },
  });

  const user = session?.data?.user as any;

  // Loading state
  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Auth error state
  if (!user || user.role !== "owner") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-border/50 bg-white p-8 shadow-xl"
        >
          <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <X className="size-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Yetkilendirme Hatası
          </h1>
          <p className="mb-6 text-muted-foreground">
            Bu sayfaya erişmek için işletme hesabı olmalısınız. Lütfen bir
            abonelik planı seçerek işletme hesabınızı oluşturun.
          </p>
          <Button
            className="w-full"
            onClick={() => (window.location.href = "/pricing")}
          >
            İşletme Hesabı Al
            <ChevronRight className="ml-2 size-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  const isActivePath = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/50 bg-white/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white">
              <Sparkles className="size-4" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              MyTrip
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.href);

            return (
              <Link
                key={item.href}
                href={item.href as any}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  item.comingSoon && "opacity-50 pointer-events-none",
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-y-1 left-0 w-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon with gradient on active */}
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition-all",
                    isActive
                      ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg`
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                  )}
                >
                  <Icon className="size-4" />
                </div>

                <span>{item.label}</span>

                {item.comingSoon && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Yakında
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border/50 p-4">
          <Link
            href="/profile"
            onClick={() => setSidebarOpen(false)}
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <User className="size-4" />
            </div>
            Profilim
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-red-100 group-hover:text-red-500">
              {logoutMutation.isPending ? (
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <LogOut className="size-4" />
              )}
            </div>
            {logoutMutation.isPending ? "Çıkış yapılıyor..." : "Çıkış Yap"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/50 bg-white/80 px-4 backdrop-blur-xl lg:px-8">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          {/* Page breadcrumb - shown on desktop */}
          <div className="hidden lg:block">
            <nav className="flex items-center gap-1 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              {pathname !== "/dashboard" && (
                <>
                  <ChevronRight className="size-4" />
                  <span className="font-medium text-foreground">
                    {NAV_ITEMS.find((item) => isActivePath(item.href))?.label ||
                      "Sayfa"}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-white">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
