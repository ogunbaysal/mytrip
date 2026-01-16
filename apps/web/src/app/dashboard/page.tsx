"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2,
  FileText,
  ArrowRight,
  TrendingUp,
  Calendar,
  Sparkles,
  Plus,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard, DashboardCard, SectionHeader } from "@/components/dashboard";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data: usageData, isLoading } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
    refetchInterval: 1000 * 60 * 5,
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription-current"],
    queryFn: () => api.subscriptions.getCurrent(),
  });

  const usage = usageData?.usage;
  const subscription = subscriptionData?.subscription;

  const placesUsed = usage?.places.current || 0;
  const placesMax = usage?.places.max || 1;
  const blogsUsed = usage?.blogs.current || 0;
  const blogsMax = usage?.blogs.max || 1;

  const placesPercentage = Math.round((placesUsed / placesMax) * 100);
  const blogsPercentage = Math.round((blogsUsed / blogsMax) * 100);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <DashboardCard
          padding="lg"
          className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80"
        >
          {/* Background decorative elements */}
          <div className="absolute right-0 top-0 -mr-8 -mt-8 size-64 rounded-full bg-white/5" />
          <div className="absolute bottom-0 left-1/2 -mb-16 size-48 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Sparkles className="size-5" />
                </div>
                <h1 className="text-2xl font-bold text-white md:text-3xl">
                  Hos Geldiniz
                </h1>
              </div>
              <p className="max-w-md text-white/80">
                Isletme panelinizden mekanlarinizi ve blog yazilarinizi kolayca
                yonetin. Bugun neler yapmayi planliyorsunuz?
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/places/create">
                <Button
                  variant="secondary"
                  className="gap-2 bg-white text-primary hover:bg-white/90"
                >
                  <Building2 className="size-4" />
                  Mekan Ekle
                </Button>
              </Link>
              <Link href="/dashboard/blogs/create">
                <Button
                  variant="secondary"
                  className="gap-2 bg-white/20 text-white hover:bg-white/30"
                >
                  <FileText className="size-4" />
                  Blog Yaz
                </Button>
              </Link>
            </div>
          </div>
        </DashboardCard>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Mekanlar"
          value={placesUsed}
          subValue={placesMax}
          icon={<Building2 className="size-5" />}
          iconGradient="from-blue-500 to-blue-600"
          showProgress
          progressValue={placesPercentage}
          index={0}
        />

        <StatCard
          label="Blog Yazilari"
          value={blogsUsed}
          subValue={blogsMax}
          icon={<FileText className="size-5" />}
          iconGradient="from-emerald-500 to-emerald-600"
          showProgress
          progressValue={blogsPercentage}
          index={1}
        />

        <StatCard
          label="Abonelik Durumu"
          value={
            subscription?.status === "active"
              ? "Aktif"
              : subscription?.status || "Aktif"
          }
          icon={<TrendingUp className="size-5" />}
          iconGradient="from-violet-500 to-violet-600"
          index={2}
          footer={
            <Link
              href="/dashboard/subscription"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Plani Goruntule
              <ArrowRight className="size-3" />
            </Link>
          }
        />

        <StatCard
          label="Sonraki Odeme"
          value={
            subscription?.nextBillingDate
              ? new Date(subscription.nextBillingDate).toLocaleDateString(
                  "tr-TR",
                )
              : "-"
          }
          icon={<Calendar className="size-5" />}
          iconGradient="from-amber-500 to-amber-600"
          index={3}
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <SectionHeader
          title="Hizli Islemler"
          subtitle="Sikca kullanilan islemlere hizlica eris"
          size="md"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Add Place Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <DashboardCard
              padding="md"
              hoverable
              className="group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
                  <Building2 className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-foreground">
                    Mekan Ekle
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Yeni bir mekan ekleyin ve musterilere ulasin
                  </p>

                  {placesUsed >= placesMax ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = "/pricing")}
                      className="w-full gap-2"
                    >
                      <BarChart3 className="size-4" />
                      Plani Yukselt
                    </Button>
                  ) : (
                    <Link href="/dashboard/places/create" className="block">
                      <Button size="sm" className="w-full gap-2">
                        <Plus className="size-4" />
                        Mekan Ekle
                        <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </DashboardCard>
          </motion.div>

          {/* Add Blog Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <DashboardCard
              padding="md"
              hoverable
              className="group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                  <FileText className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-foreground">
                    Blog Yazisi Ekle
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Blog yazisi yayinlayarak markanizi tanitin
                  </p>

                  {blogsUsed >= blogsMax ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = "/pricing")}
                      className="w-full gap-2"
                    >
                      <BarChart3 className="size-4" />
                      Plani Yukselt
                    </Button>
                  ) : (
                    <Link href="/dashboard/blogs/create" className="block">
                      <Button size="sm" className="w-full gap-2">
                        <Plus className="size-4" />
                        Blog Yaz
                        <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </DashboardCard>
          </motion.div>

          {/* Subscription Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <DashboardCard
              padding="md"
              hoverable
              className="group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25">
                  <TrendingUp className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-foreground">
                    Aboneliginiz
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Plan detaylari ve kullanim istatistikleri
                  </p>

                  <Link href="/dashboard/subscription" className="block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      Detaylari Gor
                      <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </DashboardCard>
          </motion.div>
        </div>
      </div>

      {/* Usage Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <DashboardCard padding="md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Kullanim Ozeti</h3>
              <p className="text-sm text-muted-foreground">
                Planinizdaki kaynaklarin kullanim durumu
              </p>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground">
                  Mekanlar: {placesUsed}/{placesMax}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">
                  Bloglar: {blogsUsed}/{blogsMax}
                </span>
              </div>
            </div>

            <Link href="/dashboard/subscription">
              <Button variant="outline" size="sm" className="gap-2">
                Limitleri Artir
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </DashboardCard>
      </motion.div>
    </div>
  );
}
