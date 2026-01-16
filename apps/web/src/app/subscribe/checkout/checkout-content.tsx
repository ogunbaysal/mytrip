"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Lock, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { authClient, refreshSession } from "@/lib/auth-client";

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const billingCycle = searchParams.get("cycle") || "monthly";
  const queryClient = useQueryClient();

  const [paymentData, setPaymentData] = useState({
    cardHolderName: "",
    cardNumber: "",
    expireMonth: "",
    expireYear: "",
    cvc: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  });

  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.subscriptions.getPlans(),
    enabled: !!planId,
  });

  const selectedPlan = plansData?.plans?.find((p) => p.id === planId);

  const createSubscriptionMutation = useMutation({
    mutationFn: () =>
      api.subscriptions.create(planId!, {
        type: "credit_card",
        ...paymentData,
      } as any),
    onSuccess: async (data) => {
      // Refresh session to get updated role and subscription status
      try {
        await refreshSession();
      } catch (e) {
        console.error("Failed to refresh session:", e);
      }

      // Invalidate all session-related queries
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-current"] });

      // Small delay to ensure session is refreshed
      setTimeout(() => {
        router.push("/dashboard" as Route);
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Subscription error:", error);
      alert(
        error.message ||
          "Odeme islemi basarisiz oldu. Lutfen tekrar deneyiniz.",
      );
    },
  });

  useEffect(() => {
    if (!planId) {
      router.push("/pricing" as Route);
    }
  }, [planId, router]);

  const user = session?.data?.user as any;
  if (user?.role === "owner" && user?.subscriptionStatus === "active") {
    router.push("/dashboard" as Route);
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!paymentData.cardHolderName.trim()) {
      newErrors.cardHolderName = "Kart sahibi adi gereklidir";
    }

    if (paymentData.cardNumber.length < 16) {
      newErrors.cardNumber = "Kart numarasi en az 16 haneli olmalidir";
    }

    if (
      paymentData.expireMonth.length !== 2 ||
      parseInt(paymentData.expireMonth) < 1 ||
      parseInt(paymentData.expireMonth) > 12
    ) {
      newErrors.expireMonth = "Gecerli bir ay giriniz (01-12)";
    }

    if (
      paymentData.expireYear.length !== 2 ||
      parseInt(paymentData.expireYear) < new Date().getFullYear() % 100
    ) {
      newErrors.expireYear = "Gecerli bir yil giriniz";
    }

    if (paymentData.cvc.length < 3) {
      newErrors.cvc = "CVC en az 3 haneli olmalidir";
    }

    if (!agreed) {
      newErrors.agreed = "Sartlari kabul etmeniz gerekmektedir";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createSubscriptionMutation.mutate();
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };

  const handleChange = (field: keyof typeof paymentData, value: string) => {
    if (field === "cardNumber") {
      value = formatCardNumber(value);
    }
    setPaymentData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!selectedPlan) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="mx-auto max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 size-16 text-yellow-500" />
          <h2 className="mb-2 text-2xl font-bold">Plan Bulunamadi</h2>
          <p className="mb-6 text-muted-foreground">
            Secilen plan bulunamadi. Lutfen pricing sayfasina gidip tekrar
            deneyiniz.
          </p>
          <Button onClick={() => router.push("/pricing")}>
            Pricing Sayfasina Don
          </Button>
        </Card>
      </div>
    );
  }

  const price = parseFloat(selectedPlan.price.toString());
  const cycleMultipliers = {
    monthly: 1,
    quarterly: 3,
    yearly: 12,
  };
  const cycleLabels = {
    monthly: "Aylik",
    quarterly: "3 Aylik",
    yearly: "Yillik",
  };

  const finalPrice = (
    price * cycleMultipliers[billingCycle as keyof typeof cycleMultipliers]
  ).toFixed(2);

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-center text-4xl font-bold tracking-tight">
          Odeme Yap
        </h1>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-6 text-xl font-semibold">Siparis Ozeti</h2>

            <div className="mb-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fatura Donemi:</span>
                <span className="font-medium">
                  {cycleLabels[billingCycle as keyof typeof cycleLabels]}
                </span>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <h3 className="font-semibold">Icerik:</h3>
                {selectedPlan.features?.map(
                  (feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ),
                )}
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <h3 className="font-semibold">Limitler:</h3>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mekan:</span>
                    <span className="font-medium">
                      {selectedPlan.limits?.maxPlaces} adet
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blog:</span>
                    <span className="font-medium">
                      {selectedPlan.limits?.maxBlogs} adet
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fotograf:</span>
                    <span className="font-medium">
                      {selectedPlan.limits?.maxPhotos} adet
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span>Toplam:</span>
                <span className="font-bold">
                  {finalPrice} {selectedPlan.currency}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                * Bu tutar otomatik olarak kartinizdan cekilecektir.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
              <Lock className="size-5 text-muted-foreground" />
              Odeme Bilgileri
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Kart Numarasi *</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={(e) => handleChange("cardNumber", e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="pl-12"
                  />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                </div>
                {errors.cardNumber && (
                  <p className="text-sm text-destructive">
                    {errors.cardNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardHolderName">Kart Sahibi *</Label>
                <Input
                  id="cardHolderName"
                  value={paymentData.cardHolderName}
                  onChange={(e) =>
                    handleChange("cardHolderName", e.target.value)
                  }
                  placeholder="Ad Soyad"
                  maxLength={100}
                />
                {errors.cardHolderName && (
                  <p className="text-sm text-destructive">
                    {errors.cardHolderName}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="expireMonth">Ay *</Label>
                  <Input
                    id="expireMonth"
                    value={paymentData.expireMonth}
                    onChange={(e) =>
                      handleChange("expireMonth", e.target.value)
                    }
                    placeholder="MM"
                    maxLength={2}
                  />
                  {errors.expireMonth && (
                    <p className="text-sm text-destructive">
                      {errors.expireMonth}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expireYear">Yil *</Label>
                  <Input
                    id="expireYear"
                    value={paymentData.expireYear}
                    onChange={(e) => handleChange("expireYear", e.target.value)}
                    placeholder="YY"
                    maxLength={2}
                  />
                  {errors.expireYear && (
                    <p className="text-sm text-destructive">
                      {errors.expireYear}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC *</Label>
                  <Input
                    id="cvc"
                    value={paymentData.cvc}
                    onChange={(e) => handleChange("cvc", e.target.value)}
                    placeholder="123"
                    maxLength={4}
                  />
                  {errors.cvc && (
                    <p className="text-sm text-destructive">{errors.cvc}</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-muted p-4">
                <div className="flex items-start gap-3">
                  <Lock className="mt-1 size-5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="mb-2 font-semibold">Guvenli Odeme</p>
                    <p className="text-muted-foreground">
                      Odeme bilgileriniz SSL sifreleme ile korunmaktadir. Kart
                      bilgileriniz TatilDesen tarafindan saklanmaz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (errors.agreed) {
                      setErrors((prev) => ({ ...prev, agreed: "" }));
                    }
                  }}
                  className="mt-1 size-4"
                />
                <label htmlFor="terms" className="cursor-pointer text-sm">
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Kullanim sartlarini
                  </a>{" "}
                  ve{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    gizlilik politikasini
                  </a>{" "}
                  okudum ve kabul ediyorum.
                </label>
              </div>
              {errors.agreed && (
                <p className="text-sm text-destructive">{errors.agreed}</p>
              )}

              <Button
                type="submit"
                disabled={createSubscriptionMutation.isPending}
                className="w-full"
                size="lg"
              >
                {createSubscriptionMutation.isPending ? (
                  <>
                    <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Odeme Isleniyor...
                  </>
                ) : (
                  `${finalPrice} ${selectedPlan.currency} Ode`
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Yukleniyor...</p>
      </div>
    </div>
  );
}

export function CheckoutContent() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutForm />
    </Suspense>
  );
}
