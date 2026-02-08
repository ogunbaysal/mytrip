"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

type Plan = {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  currency: string;
  billingCycle: "yearly";
  features?: string[];
  maxPlaces?: number;
  maxBlogs?: number;
  limits?: {
    maxPlaces: number;
    maxBlogs: number;
  };
};

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const checkoutRedirectPath = useMemo(() => {
    const query = searchParams.toString();
    return `/subscribe/checkout${query ? `?${query}` : ""}` as Route;
  }, [searchParams]);
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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponPricing, setCouponPricing] = useState<{
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    currency: string;
  } | null>(null);

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
    retry: false,
  });

  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.subscriptions.getPlans(),
    enabled: !!planId,
  });

  const user = session?.data?.user as
    | { id?: string; role?: string; subscriptionStatus?: string }
    | undefined;

  const { data: currentSubscriptionData, isLoading: isSubscriptionLoading } =
    useQuery({
      queryKey: ["subscription-current"],
      queryFn: () => api.subscriptions.getCurrent(),
      enabled: Boolean(user?.id),
      retry: false,
    });

  const hasActiveSubscription = ["active", "trial"].includes(
    currentSubscriptionData?.subscription?.status || "",
  );

  const selectedPlan = (plansData?.plans as Plan[] | undefined)?.find(
    (plan) => plan.id === planId,
  );

  const basePrice = selectedPlan ? Number.parseFloat(selectedPlan.price.toString()) : 0;
  const effectivePricing = useMemo(
    () =>
      couponPricing ?? {
        basePrice,
        discountAmount: 0,
        finalPrice: basePrice,
        currency: selectedPlan?.currency ?? "TRY",
      },
    [basePrice, couponPricing, selectedPlan?.currency],
  );
  const isFreeCheckout = effectivePricing.finalPrice <= 0;

  const validateCouponMutation = useMutation({
    mutationFn: () =>
      api.subscriptions.validateCoupon(planId!, couponCode.trim()),
    onSuccess: (data) => {
      if (!data.valid || !data.pricing) {
        setCouponError(data.error ?? "Kupon kodu gecersiz");
        setAppliedCouponCode(null);
        setCouponPricing(null);
        return;
      }
      setCouponError(null);
      setAppliedCouponCode(couponCode.trim().toUpperCase());
      setCouponPricing(data.pricing);
    },
    onError: (error: Error) => {
      setCouponError(error.message || "Kupon dogrulanamadi");
      setAppliedCouponCode(null);
      setCouponPricing(null);
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: () =>
      api.subscriptions.create(
        planId!,
        isFreeCheckout
          ? undefined
          : ({
              type: "credit_card",
              ...paymentData,
            } as const),
        appliedCouponCode ?? undefined,
      ),
    onSuccess: async () => {
      try {
        await authClient.getSession({
          query: { disableCookieCache: true },
          fetchOptions: { cache: "no-store" },
        });
      } catch (error) {
        console.error("Failed to refresh session:", error);
      }

      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({ queryKey: ["subscription-current"] });
      await queryClient.invalidateQueries({ queryKey: ["usage"] });

      router.push("/dashboard" as Route);
    },
    onError: (error: Error) => {
      alert(error.message || "Odeme islemi basarisiz oldu. Lutfen tekrar deneyiniz.");
    },
  });

  useEffect(() => {
    if (!planId) {
      router.replace("/pricing" as Route);
      return;
    }

    if (isSessionLoading) {
      return;
    }

    if (!user?.id) {
      router.replace(
        `/register?redirect=${encodeURIComponent(checkoutRedirectPath)}` as Route,
      );
      return;
    }

    if (isSubscriptionLoading) {
      return;
    }

    if (hasActiveSubscription) {
      router.replace("/dashboard/subscription" as Route);
    }
  }, [
    checkoutRedirectPath,
    hasActiveSubscription,
    isSessionLoading,
    isSubscriptionLoading,
    planId,
    router,
    user?.id,
  ]);

  const isGuardLoading =
    !planId ||
    isSessionLoading ||
    !user?.id ||
    isSubscriptionLoading ||
    hasActiveSubscription;

  if (isGuardLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="mx-auto max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 size-16 text-yellow-500" />
          <h2 className="mb-2 text-2xl font-bold">Yönlendiriliyor</h2>
          <p className="text-muted-foreground">
            Abonelik erişim kontrolü yapılıyor.
          </p>
        </Card>
      </div>
    );
  }

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!isFreeCheckout) {
      const cardDigits = paymentData.cardNumber.replace(/\s/g, "");
      if (!paymentData.cardHolderName.trim()) {
        nextErrors.cardHolderName = "Kart sahibi adi gereklidir";
      }
      if (cardDigits.length < 16) {
        nextErrors.cardNumber = "Kart numarasi en az 16 haneli olmalidir";
      }
      if (
        paymentData.expireMonth.length !== 2 ||
        Number(paymentData.expireMonth) < 1 ||
        Number(paymentData.expireMonth) > 12
      ) {
        nextErrors.expireMonth = "Gecerli bir ay giriniz (01-12)";
      }
      if (
        paymentData.expireYear.length !== 2 ||
        Number(paymentData.expireYear) < new Date().getFullYear() % 100
      ) {
        nextErrors.expireYear = "Gecerli bir yil giriniz";
      }
      if (paymentData.cvc.length < 3) {
        nextErrors.cvc = "CVC en az 3 haneli olmalidir";
      }
    }

    if (!agreed) {
      nextErrors.agreed = "Sartlari kabul etmeniz gerekmektedir";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    createSubscriptionMutation.mutate();
  };

  const formatCardNumber = (value: string) =>
    value
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const handlePaymentChange = (
    field: keyof typeof paymentData,
    value: string,
  ) => {
    if (field === "cardNumber") {
      value = formatCardNumber(value);
    }
    setPaymentData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleApplyCoupon = () => {
    if (!planId || !couponCode.trim()) {
      return;
    }
    validateCouponMutation.mutate();
  };

  const maxPlaces = selectedPlan?.maxPlaces ?? selectedPlan?.limits?.maxPlaces ?? 0;
  const maxBlogs = selectedPlan?.maxBlogs ?? selectedPlan?.limits?.maxBlogs ?? 0;

  if (!selectedPlan) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="mx-auto max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 size-16 text-yellow-500" />
          <h2 className="mb-2 text-2xl font-bold">Plan Bulunamadi</h2>
          <p className="mb-6 text-muted-foreground">
            Secilen plan bulunamadi. Lutfen pricing sayfasina gidip tekrar deneyiniz.
          </p>
          <Button onClick={() => router.push("/pricing")}>Pricing Sayfasina Don</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-center text-4xl font-bold tracking-tight">Odeme Yap</h1>

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
                <span className="font-medium">Yillik</span>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <h3 className="font-semibold">Icerik:</h3>
                {(selectedPlan.features ?? []).map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <h3 className="font-semibold">Limitler:</h3>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mekan:</span>
                    <span className="font-medium">{maxPlaces} adet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blog:</span>
                    <span className="font-medium">{maxBlogs} adet</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="couponCode">Kupon Kodu</Label>
                <div className="flex gap-2">
                  <Input
                    id="couponCode"
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value);
                      setCouponError(null);
                      setAppliedCouponCode(null);
                      setCouponPricing(null);
                    }}
                    placeholder="ORN: WELCOME10"
                    className="uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={validateCouponMutation.isPending || !couponCode.trim()}
                    onClick={handleApplyCoupon}
                  >
                    {validateCouponMutation.isPending ? "Dogrulaniyor..." : "Uygula"}
                  </Button>
                </div>
                {couponError && <p className="text-sm text-destructive">{couponError}</p>}
                {appliedCouponCode && !couponError && (
                  <p className="text-sm text-emerald-600">
                    {appliedCouponCode} kuponu uygulandi.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-sm">
                <span>Ara Toplam:</span>
                <span>
                  {effectivePricing.basePrice.toFixed(2)} {selectedPlan.currency}
                </span>
              </div>
              {effectivePricing.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Kupon Indirimi:</span>
                  <span>
                    -{effectivePricing.discountAmount.toFixed(2)} {selectedPlan.currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Toplam:</span>
                <span>
                  {effectivePricing.finalPrice.toFixed(2)} {selectedPlan.currency}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isFreeCheckout
                  ? "* Bu siparis kupon ile tamamen ucretsizdir."
                  : "* Bu tutar otomatik olarak kartinizdan cekilecektir."}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
              <Lock className="size-5 text-muted-foreground" />
              Odeme Bilgileri
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isFreeCheckout ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  Kupon indirimi nedeniyle odeme alinmayacak. Aboneliginiz hemen
                  aktive edilecektir.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Kart Numarasi *</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        value={paymentData.cardNumber}
                        onChange={(event) =>
                          handlePaymentChange("cardNumber", event.target.value)
                        }
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="pl-12"
                      />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    </div>
                    {errors.cardNumber && (
                      <p className="text-sm text-destructive">{errors.cardNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardHolderName">Kart Sahibi *</Label>
                    <Input
                      id="cardHolderName"
                      value={paymentData.cardHolderName}
                      onChange={(event) =>
                        handlePaymentChange("cardHolderName", event.target.value)
                      }
                      placeholder="Ad Soyad"
                      maxLength={100}
                    />
                    {errors.cardHolderName && (
                      <p className="text-sm text-destructive">{errors.cardHolderName}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="expireMonth">Ay *</Label>
                      <Input
                        id="expireMonth"
                        value={paymentData.expireMonth}
                        onChange={(event) =>
                          handlePaymentChange("expireMonth", event.target.value)
                        }
                        placeholder="MM"
                        maxLength={2}
                      />
                      {errors.expireMonth && (
                        <p className="text-sm text-destructive">{errors.expireMonth}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expireYear">Yil *</Label>
                      <Input
                        id="expireYear"
                        value={paymentData.expireYear}
                        onChange={(event) =>
                          handlePaymentChange("expireYear", event.target.value)
                        }
                        placeholder="YY"
                        maxLength={2}
                      />
                      {errors.expireYear && (
                        <p className="text-sm text-destructive">{errors.expireYear}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC *</Label>
                      <Input
                        id="cvc"
                        value={paymentData.cvc}
                        onChange={(event) => handlePaymentChange("cvc", event.target.value)}
                        placeholder="123"
                        maxLength={4}
                      />
                      {errors.cvc && (
                        <p className="text-sm text-destructive">{errors.cvc}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

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
                  onChange={(event) => {
                    setAgreed(event.target.checked);
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
              {errors.agreed && <p className="text-sm text-destructive">{errors.agreed}</p>}

              <Button
                type="submit"
                disabled={createSubscriptionMutation.isPending}
                className="w-full"
                size="lg"
              >
                {createSubscriptionMutation.isPending ? (
                  <>
                    <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Islem yapiliyor...
                  </>
                ) : (
                  isFreeCheckout
                    ? "Aboneligi Baslat"
                    : `${effectivePricing.finalPrice.toFixed(2)} ${selectedPlan.currency} Ode`
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
