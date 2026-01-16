"use client";

import Link from "next/link";
import type { Route } from "next";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  FileText,
  ArrowRight,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  const getUsageColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-green-500";
  };

  const getProgressColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Hoş Geldiniz</h1>
        <p className="text-muted-foreground">
          İşletme panelinizden kontrolünüzde
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Mekanlar
              </p>
              <p className="text-3xl font-bold mt-1">
                {usage?.places.current || 0}{" "}
                <span className="text-lg font-normal text-muted-foreground">
                  / {usage?.places.max || 0}
                </span>
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Building2 className="size-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Kullanım</span>
              <span
                className={getUsageColor(
                  usage?.places.current || 0,
                  usage?.places.max || 1,
                )}
              >
                {Math.round(
                  ((usage?.places.current || 0) / (usage?.places.max || 1)) *
                    100,
                )}
                %
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${getProgressColor(
                  usage?.places.current || 0,
                  usage?.places.max || 1,
                )}`}
                style={{
                  width: `${((usage?.places.current || 0) / (usage?.places.max || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Blog Yazıları
              </p>
              <p className="text-3xl font-bold mt-1">
                {usage?.blogs.current || 0}{" "}
                <span className="text-lg font-normal text-muted-foreground">
                  / {usage?.blogs.max || 0}
                </span>
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <FileText className="size-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Kullanım</span>
              <span
                className={getUsageColor(
                  usage?.blogs.current || 0,
                  usage?.blogs.max || 1,
                )}
              >
                {Math.round(
                  ((usage?.blogs.current || 0) / (usage?.blogs.max || 1)) * 100,
                )}
                %
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${getProgressColor(
                  usage?.blogs.current || 0,
                  usage?.blogs.max || 1,
                )}`}
                style={{
                  width: `${((usage?.blogs.current || 0) / (usage?.blogs.max || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Abonelik Durumu
              </p>
              <p className="text-xl font-semibold mt-1 capitalize">
                {subscription?.status || "Active"}
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <TrendingUp className="size-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Sonraki Ödeme
              </p>
              <p className="text-xl font-semibold mt-1">
                {subscription?.nextBillingDate ||
                  new Date().toISOString().split("T")[0]}
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Calendar className="size-6" />
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Hızlı İşlemler</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-2 text-lg font-semibold">Mekan Ekle</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Yeni bir mekan ekleyin ve müşterilere ulaşın
            </p>
            {(usage?.places.current || 0) >= (usage?.places.max || 1) ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => (window.location.href = "/pricing")}
              >
                <BarChart3 className="mr-2 size-4" />
                Planı Yükselt
              </Button>
            ) : (
              <Link href="/dashboard/places/create" className="block">
                <Button className="w-full">
                  <Building2 className="mr-2 size-4" />
                  Mekan Ekle
                  <ArrowRight className="ml-auto size-4" />
                </Button>
              </Link>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="mb-2 text-lg font-semibold">Blog Yazısı Ekle</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Blog yazısı yayınlayarak markanız bilinirliğini artırın
            </p>
            {(usage?.blogs.current || 0) >= (usage?.blogs.max || 1) ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => (window.location.href = "/pricing")}
              >
                <BarChart3 className="mr-2 size-4" />
                Planı Yükselt
              </Button>
            ) : (
              <Link href="/dashboard/blogs/create" className="block">
                <Button className="w-full">
                  <FileText className="mr-2 size-4" />
                  Blog Yazısı Ekle
                  <ArrowRight className="ml-auto size-4" />
                </Button>
              </Link>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
