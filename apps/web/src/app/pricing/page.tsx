"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  currency: string;
  billingCycle: "yearly";
  features: string[];
  entitlements: {
    resourceKey:
      | "place.villa"
      | "place.bungalow_tiny_house"
      | "place.hotel_pension"
      | "place.detached_house_apartment"
      | "place.camp_site"
      | "place.transfer"
      | "place.boat_tour"
      | "place.paragliding_microlight_skydiving"
      | "place.safari"
      | "place.water_sports"
      | "place.ski"
      | "place.balloon_tour"
      | "blog.post";
    limitCount: number | null;
    isUnlimited: boolean;
  }[];
  limits?: {
    maxPlaces: number;
    maxBlogs: number;
  };
  active: boolean;
  sortOrder: number;
}

const PLACE_ENTITLEMENT_ORDER: Array<
  Exclude<Plan["entitlements"][number]["resourceKey"], "blog.post">
> = [
  "place.villa",
  "place.bungalow_tiny_house",
  "place.hotel_pension",
  "place.detached_house_apartment",
  "place.camp_site",
  "place.transfer",
  "place.boat_tour",
  "place.paragliding_microlight_skydiving",
  "place.safari",
  "place.water_sports",
  "place.ski",
  "place.balloon_tour",
];

const RESOURCE_LABELS: Record<Plan["entitlements"][number]["resourceKey"], string> = {
  "place.villa": "Villalar",
  "place.bungalow_tiny_house": "Bungalov & Tiny House",
  "place.hotel_pension": "Otel & Pansiyon",
  "place.detached_house_apartment": "Müstakil Ev & Daire",
  "place.camp_site": "Kamp Alanı",
  "place.transfer": "Transfer",
  "place.boat_tour": "Tekne Turu",
  "place.paragliding_microlight_skydiving": "Paraşüt & Microlight & Skydiving",
  "place.safari": "Safari",
  "place.water_sports": "Su Sporları",
  "place.ski": "Kayak",
  "place.balloon_tour": "Balon Turu",
  "blog.post": "Blog Yazıları",
};

export default function PricingPage() {
  const router = useRouter();
  const { data: plansData, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.subscriptions.getPlans(),
    staleTime: 1000 * 60 * 5,
  });
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
    staleTime: 1000 * 60,
  });

  const plans = (plansData?.plans as Plan[] | undefined)?.filter(
    (plan) => plan.billingCycle === "yearly",
  ) || [];
  const user = session?.data?.user;

  const handlePlanSelect = (planId: string) => {
    const checkoutPath = `/subscribe/checkout?plan=${planId}` as Route;
    if (!user) {
      router.push(
        `/register?redirect=${encodeURIComponent(checkoutPath)}` as Route,
      );
      return;
    }

    router.push(checkoutPath);
  };

  const getDisplayPrice = (price: string | number) => {
    const priceNum = typeof price === "string" ? parseFloat(price) : price;
    return priceNum.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getEntitlement = (
    plan: Plan,
    resourceKey: Plan["entitlements"][number]["resourceKey"],
  ) => plan.entitlements?.find((item) => item.resourceKey === resourceKey);

  const formatEntitlementLimit = (
    entitlement: Plan["entitlements"][number] | undefined,
  ) => {
    if (!entitlement) return "0";
    if (entitlement.isUnlimited || entitlement.limitCount === null) return "∞";
    return String(entitlement.limitCount);
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            İşletmeniz için doğru planı seçin
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Esnek abonelik seçenekleri ile işletmenizi TatilDesen platformunda
            büyütün. İstediğiniz zaman planı değiştirebilirsiniz.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isPopular = plan.sortOrder === 1;
              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden ${
                    isPopular
                      ? "border-primary shadow-xl ring-2 ring-primary/20"
                      : ""
                  }`}
                >
                  {isPopular && (
                    <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Popüler
                    </div>
                  )}

                  <div className="p-6 pb-4">
                    <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                    {plan.description && (
                      <p className="mb-4 text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}

                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        {getDisplayPrice(plan.price)}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        {plan.currency}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /Yıllık
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      {PLACE_ENTITLEMENT_ORDER.map((resourceKey) => {
                        const entitlement = getEntitlement(plan, resourceKey);

                        return (
                          <div
                            key={resourceKey}
                            className="flex items-start justify-between gap-3"
                          >
                            <span className="text-muted-foreground">
                              {RESOURCE_LABELS[resourceKey]}
                            </span>
                            <span className="font-semibold">
                              {formatEntitlementLimit(entitlement)}
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex items-start justify-between gap-3 border-t pt-2">
                        <span className="text-muted-foreground">
                          {RESOURCE_LABELS["blog.post"]}
                        </span>
                        <span className="font-semibold">
                          {formatEntitlementLimit(getEntitlement(plan, "blog.post"))}
                        </span>
                      </div>

                    </div>
                  </div>

                  <div className="flex-1 border-t px-6 pb-6 pt-4">
                    <ul className="mb-6 space-y-3">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      type="button"
                      onClick={() => handlePlanSelect(plan.id)}
                      disabled={isSessionLoading}
                      className={`w-full ${
                        isPopular
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground text-background"
                      }`}
                    >
                      {isSessionLoading
                        ? "Kontrol ediliyor..."
                        : plan.entitlements
                              .filter(
                                (item) =>
                                  item.resourceKey.startsWith("place."),
                              )
                              .every(
                                (item) =>
                                  !item.isUnlimited &&
                                  (item.limitCount === null || item.limitCount <= 0),
                              )
                          ? "İletişime Geç"
                          : "Planı Seç"}
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-16 text-center">
          <h2 className="mb-4 text-2xl font-bold">Sıkça Sorulan Sorular</h2>
          <div className="mx-auto max-w-3xl space-y-4 text-left">
            <details className="group rounded-lg border bg-card p-4">
              <summary className="cursor-pointer font-semibold transition group-hover:text-primary">
                Planımı istediğim zaman değiştirebilir miyim?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Evet, aboneliğinizi istediğiniz zaman yükseltebilir veya
                düşürebilirsiniz. Değişiklikler bir sonraki ödeme döneminde
                geçerli olacaktır.
              </p>
            </details>
            <details className="group rounded-lg border bg-card p-4">
              <summary className="cursor-pointer font-semibold transition group-hover:text-primary">
                Deneme süresi var mı?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Hayır, ücretsiz deneme süresi yoktur. Aboneliğiniz ödeme
                yapıldığı anda başlar ve seçtiğiniz fatura dönemine göre devam
                eder.
              </p>
            </details>
            <details className="group rounded-lg border bg-card p-4">
              <summary className="cursor-pointer font-semibold transition group-hover:text-primary">
                Mekanlarım ve blog yazılarım ne zaman yayınlanır?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Tüm mekanlar ve blog yazıları TatilDesen yöneticileri tarafından
                incelenir ve onaylandıktan sonra halka açılır. Bu süreç
                genellikle 24-48 saat sürer.
              </p>
            </details>
            <details className="group rounded-lg border bg-card p-4">
              <summary className="cursor-pointer font-semibold transition group-hover:text-primary">
                Ödeme yöntemleri nelerdir?
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                Şu an kredi kartı ile ödeme alıyoruz. Kredi kartı bilgileriniz
                güvenli bir şekilde işlenir ve TatilDesen tarafından saklanmaz.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
