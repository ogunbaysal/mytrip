"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  Calendar,
  TrendingUp,
  Zap,
  Shield,
  Building2,
  FileText,
  ImageIcon,
  BarChart3,
  Headphones,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  DashboardCard,
  StatusBadge,
  ProgressBar,
  SectionHeader,
} from "@/components/dashboard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  places: <Building2 className="size-4" />,
  blogs: <FileText className="size-4" />,
  photos: <ImageIcon className="size-4" />,
  analytics: <BarChart3 className="size-4" />,
  support: <Headphones className="size-4" />,
  featured: <Star className="size-4" />,
};

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription-current"],
    queryFn: () => api.subscriptions.getCurrent(),
  });

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.subscriptions.getPlans(),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.subscriptions.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-current"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      setShowCancelModal(false);
    },
    onError: (error: Error) => {
      console.error("Cancel error:", error);
      alert(error.message || "İptal işlemi başarısız oldu");
    },
  });

  const subscription = subscriptionData?.subscription;
  const usage = usageData?.usage;
  const plans = plansData?.plans || [];

  // Loading state
  if (subscriptionLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // No subscription state
  if (!subscription) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Abonelik Yönetimi"
          description="Abonelik planınızı görüntüleyin ve yönetin"
          icon={<CreditCard className="size-5" />}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-lg"
        >
          <DashboardCard padding="lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                <AlertCircle className="size-8" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">
                Abonelik Bulunamadı
              </h2>
              <p className="mb-6 text-muted-foreground">
                Aktif bir aboneliğiniz bulunmamaktadır. İşletme özelliklerinden
                yararlanmak için bir plan seçin.
              </p>
              <Button
                onClick={() => (window.location.href = "/pricing")}
                className="gap-2"
              >
                <Zap className="size-4" />
                Abonelik Planları
              </Button>
            </div>
          </DashboardCard>
        </motion.div>
      </div>
    );
  }

  const plan = plans.find((p) => p.id === subscription.planId);
  const planLimits =
    typeof plan?.limits === "string" ? JSON.parse(plan.limits) : plan?.limits;
  const planFeatures =
    typeof plan?.features === "string"
      ? JSON.parse(plan.features)
      : plan?.features;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const placesPercentage = usage
    ? Math.round(((usage.places.current || 0) / (usage.places.max || 1)) * 100)
    : 0;

  const blogsPercentage = usage
    ? Math.round(((usage.blogs.current || 0) / (usage.blogs.max || 1)) * 100)
    : 0;

  const isAtLimit =
    (usage?.places.current || 0) >= (usage?.places.max || 1) ||
    (usage?.blogs.current || 0) >= (usage?.blogs.max || 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Abonelik Yönetimi"
        description="Abonelik planınız ve kullanım detaylarınız"
        icon={<CreditCard className="size-5" />}
        actions={
          subscription.status === "active" && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => (window.location.href = "/pricing")}
            >
              <TrendingUp className="size-4" />
              Planı Yükselt
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Current Plan Card */}
          <DashboardCard
            accentGradient="from-primary to-primary/70"
            padding="none"
          >
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Mevcut Plan
                  </p>
                  <h2 className="text-2xl font-bold text-foreground">
                    {plan?.name || "Plan"}
                  </h2>
                </div>
                <StatusBadge status={subscription.status} size="md" />
              </div>

              {plan?.description && (
                <p className="mb-6 text-muted-foreground">{plan.description}</p>
              )}

              {/* Features List */}
              {planFeatures && planFeatures.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Plan Özellikleri
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {planFeatures.map((feature: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subscription Details */}
            <div className="border-t border-border/50 bg-slate-50/50 p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Abonelik Detayları
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Fatura Dönemi
                  </p>
                  <p className="font-medium text-foreground">
                    {subscription.billingCycle === "monthly" && "Aylık"}
                    {subscription.billingCycle === "quarterly" && "3 Aylık"}
                    {subscription.billingCycle === "yearly" && "Yıllık"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Plan Fiyatı
                  </p>
                  <p className="font-medium text-foreground">
                    {subscription.price} {subscription.currency}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Başlangıç Tarihi
                  </p>
                  <p className="font-medium text-foreground">
                    {formatDate(subscription.startDate)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Sonraki Ödeme
                  </p>
                  <p className="font-medium text-foreground">
                    {subscription.nextBillingDate
                      ? formatDate(subscription.nextBillingDate)
                      : "Otomatik yenilenmeyecek"}
                  </p>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Actions Card */}
          {subscription.status === "active" && (
            <DashboardCard padding="md">
              <SectionHeader
                title="Abonelik İşlemleri"
                size="sm"
                className="mb-4"
              />

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="size-4" />
                    Planı Yükselt
                  </span>
                  <ChevronRight className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowCancelModal(true)}
                >
                  <span className="flex items-center gap-2">
                    <X className="size-4" />
                    Aboneliği İptal Et
                  </span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>

              {/* Cancel Policy Notice */}
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                <Shield className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div className="text-sm">
                  <p className="mb-1 font-semibold text-amber-800">
                    İptal Politikası
                  </p>
                  <p className="text-amber-700">
                    Aboneliği iptal ettiğinizde, mekanlarınız ve blog
                    yazılarınız mevcut abonelik döneminin sonuna kadar
                    yayınlanmaya devam edecektir.
                  </p>
                </div>
              </div>
            </DashboardCard>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Usage Card */}
          <DashboardCard padding="md">
            <SectionHeader title="Kullanım Durumu" size="sm" className="mb-4" />

            <div className="space-y-5">
              {/* Places Usage */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="size-4" />
                    Mekanlar
                  </span>
                  <span className="text-sm font-medium">
                    {usage?.places.current || 0} / {usage?.places.max || 0}
                  </span>
                </div>
                <ProgressBar value={placesPercentage} size="md" />
              </div>

              {/* Blogs Usage */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="size-4" />
                    Blog Yazıları
                  </span>
                  <span className="text-sm font-medium">
                    {usage?.blogs.current || 0} / {usage?.blogs.max || 0}
                  </span>
                </div>
                <ProgressBar value={blogsPercentage} size="md" />
              </div>
            </div>

            {/* Limit Warning */}
            {isAtLimit && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 p-4">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                <div className="text-sm">
                  <p className="mb-1 font-semibold text-red-800">
                    Limite Ulaşıldı
                  </p>
                  <p className="mb-3 text-red-700">
                    Daha fazla içerik eklemek için planınızı yükseltin.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-100"
                    onClick={() => (window.location.href = "/pricing")}
                  >
                    Planı Yükselt
                  </Button>
                </div>
              </div>
            )}
          </DashboardCard>

          {/* Plan Limits Card */}
          {planLimits && (
            <DashboardCard padding="md">
              <SectionHeader
                title="Plan Limitleri"
                size="sm"
                className="mb-4"
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-4" />
                    Mekan Limiti
                  </span>
                  <span className="font-medium">{planLimits.maxPlaces}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="size-4" />
                    Blog Limiti
                  </span>
                  <span className="font-medium">{planLimits.maxBlogs}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ImageIcon className="size-4" />
                    Fotoğraf Limiti
                  </span>
                  <span className="font-medium">{planLimits.maxPhotos}</span>
                </div>

                <div className="h-px bg-border" />

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Star className="size-4" />
                    Öne Çıkarılan
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      planLimits.featuredListing
                        ? "text-emerald-600"
                        : "text-slate-400",
                    )}
                  >
                    {planLimits.featuredListing ? "Evet" : "Hayır"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="size-4" />
                    Analytics
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      planLimits.analyticsAccess
                        ? "text-emerald-600"
                        : "text-slate-400",
                    )}
                  >
                    {planLimits.analyticsAccess ? "Evet" : "Hayır"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Headphones className="size-4" />
                    Öncelikli Destek
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      planLimits.prioritySupport
                        ? "text-emerald-600"
                        : "text-slate-400",
                    )}
                  >
                    {planLimits.prioritySupport ? "Evet" : "Hayır"}
                  </span>
                </div>
              </div>
            </DashboardCard>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <DashboardCard padding="lg">
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <AlertCircle className="size-6" />
              </div>

              <h2 className="mb-2 text-xl font-bold text-foreground">
                Aboneliği İptal Et
              </h2>
              <p className="mb-6 text-muted-foreground">
                Aboneliğinizi iptal etmek istediğinize emin misiniz? İptal
                ettikten sonra mevcut abonelik döneminin sonuna kadar
                içerikleriniz yayınlanmaya devam edecektir.
              </p>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  İptal Sebebi (Opsiyonel)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Neden iptal etmek istediğinizi paylaşın..."
                  className="min-h-[80px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelModal(false)}
                >
                  Vazgeç
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <>
                      <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      İptal Ediliyor...
                    </>
                  ) : (
                    "Evet, İptal Et"
                  )}
                </Button>
              </div>
            </DashboardCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
