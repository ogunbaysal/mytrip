"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: subscriptionData } = useQuery({
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

  if (!subscription) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="mx-auto max-w-md p-8 text-center">
          <AlertCircle className="mx-auto mb-4 size-16 text-yellow-500" />
          <h2 className="mb-2 text-2xl font-bold">Abonelik Bulunamadı</h2>
          <p className="mb-6 text-muted-foreground">
            Aktif bir aboneliğiniz bulunmamaktadır. Lütfen yeni bir abonelik
            planı seçiniz.
          </p>
          <Button onClick={() => (window.location.href = "/pricing")}>
            Abonelik Seç
          </Button>
        </Card>
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

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      expired: "bg-gray-100 text-gray-700",
      pending: "bg-yellow-100 text-yellow-700",
    };
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status === "active" && "Aktif"}
        {status === "cancelled" && "İptal"}
        {status === "expired" && "Süresi Doldu"}
        {status === "pending" && "Beklemede"}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Abonelik Yönetimi</h1>
        <p className="text-muted-foreground">
          Abonelik planınız ve kullanım detaylarınız
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mevcut Plan</h2>
              {getStatusBadge(subscription.status)}
            </div>

            <div className="mb-6">
              <p className="mb-4 text-2xl font-bold">{plan?.name}</p>
              <p className="text-muted-foreground">{plan?.description}</p>
            </div>

            <Separator className="mb-6" />

            <div className="mb-6 space-y-3 text-sm">
              <h3 className="font-semibold">Plan Özellikleri</h3>
              {planFeatures?.map((feature: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Separator className="mb-6" />

            <div className="mb-6 space-y-3">
              <h3 className="font-semibold">Abonelik Detayları</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-muted-foreground text-sm">
                    Fatura Dönemi
                  </p>
                  <p className="font-medium">
                    {subscription.billingCycle === "monthly" && "Aylık"}
                    {subscription.billingCycle === "quarterly" && "3 Aylık"}
                    {subscription.billingCycle === "yearly" && "Yıllık"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-muted-foreground text-sm">
                    Plan Fiyatı
                  </p>
                  <p className="font-medium">
                    {subscription.price} {subscription.currency}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-muted-foreground text-sm">
                    Başlangıç Tarihi
                  </p>
                  <p className="font-medium">
                    {formatDate(subscription.startDate)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-muted-foreground text-sm">
                    Bitiş Tarihi
                  </p>
                  <p className="font-medium">
                    {formatDate(subscription.endDate)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-muted-foreground text-sm">
                    Sonraki Ödeme
                  </p>
                  <p className="font-medium">
                    {subscription.nextBillingDate
                      ? formatDate(subscription.nextBillingDate)
                      : "Otomatik Yenilenmeyecek"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {subscription.status === "active" && (
            <Card className="p-6">
              <h2 className="mb-6 text-xl font-semibold">Abonelik İşlemleri</h2>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  <span className="flex items-center justify-between">
                    <span>Planı Yükselt</span>
                    <ChevronRight className="size-4" />
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCancelModal(true)}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-destructive">Aboneliği İptal Et</span>
                    <X className="size-4" />
                  </span>
                </Button>

                <div className="rounded-lg bg-yellow-50 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 size-4 text-yellow-600" />
                    <div>
                      <p className="mb-1 font-semibold">İptal Politikası</p>
                      <p className="text-muted-foreground">
                        Aboneliği iptal ettiğinizde, mekanlarınız ve blog
                        yazılarınız mevcut abonelik döneminin sonuna kadar
                        yayınlanmaya devam edecektir. Sonraki ödeme
                        yapılmayacaktır.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Kullanım Durumu</h2>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Mekanlar</span>
                  <span className="font-medium">
                    {usage?.places.current} / {usage?.places.max}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.round(((usage?.places.current || 0) / (usage?.places.max || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Blog Yazıları</span>
                  <span className="font-medium">
                    {usage?.blogs.current} / {usage?.blogs.max}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${((usage?.blogs.current || 0) / (usage?.blogs.max || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {((usage?.places.current || 0) >= (usage?.places.max || 1) ||
              (usage?.blogs.current || 0) >= (usage?.blogs.max || 1)) && (
              <div className="mt-4 rounded-lg bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-4 text-red-600" />
                  <div>
                    <p className="mb-1 font-semibold text-red-700">
                      Limite Ulaşıldı
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Bir veya daha fazla kaynağınız için limite ulaştınız. Daha
                      fazla içerik eklemek için lütfen abonelik planınızı
                      yükseltin.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => (window.location.href = "/pricing")}
                    >
                      Planı Yükselt
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Plan Detayları</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mekan Limiti</span>
                <span className="font-medium">{planLimits?.maxPlaces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blog Limiti</span>
                <span className="font-medium">{planLimits?.maxBlogs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fotoğraf Limiti</span>
                <span className="font-medium">{planLimits?.maxPhotos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Öne Çıkarılan</span>
                <span className="font-medium">
                  {planLimits?.featuredListing ? "Evet" : "Hayır"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Analytics</span>
                <span className="font-medium">
                  {planLimits?.analyticsAccess ? "Evet" : "Hayır"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Öncelikli Destek</span>
                <span className="font-medium">
                  {planLimits?.prioritySupport ? "Evet" : "Hayır"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-auto max-w-md p-6">
            <h2 className="mb-4 text-xl font-bold">Aboneliği İptal Et</h2>
            <p className="mb-6 text-muted-foreground">
              Aboneliğinizi iptal etmek istediğinize emin misiniz? İptal
              ettikten sonra mevcut abonelik döneminin sonuna kadar
              içerikleriniz yayınlanmaya devam edecektir.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
              >
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!cancelReason.trim()) {
                    alert("Lütfen iptal sebebinizi giriniz");
                    return;
                  }
                  cancelMutation.mutate();
                }}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending
                  ? "İptal Ediliyor..."
                  : "Evet, İptal Et"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
