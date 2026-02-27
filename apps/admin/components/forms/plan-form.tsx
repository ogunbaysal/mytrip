"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SubscriptionPlan } from "@/types/subscriptions";

const formSchema = z.object({
  name: z.string().min(1, "Plan adı gereklidir"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Fiyat 0 veya daha büyük olmalıdır"),
  currency: z.enum(["TRY", "USD", "EUR"]),
  villaLimit: z.coerce.number().int().min(0),
  bungalowTinyHouseLimit: z.coerce.number().int().min(0),
  hotelPensionLimit: z.coerce.number().int().min(0),
  detachedHouseApartmentLimit: z.coerce.number().int().min(0),
  campSiteLimit: z.coerce.number().int().min(0),
  transferLimit: z.coerce.number().int().min(0),
  boatTourLimit: z.coerce.number().int().min(0),
  paraglidingMicrolightSkydivingLimit: z.coerce.number().int().min(0),
  safariLimit: z.coerce.number().int().min(0),
  waterSportsLimit: z.coerce.number().int().min(0),
  skiLimit: z.coerce.number().int().min(0),
  balloonTourLimit: z.coerce.number().int().min(0),
  blogPostLimit: z.coerce.number().int().min(0),
  featuresText: z.string().optional(),
  active: z.boolean().default(true),
});

type PlanFormValues = z.infer<typeof formSchema>;

type PlanEntitlement = {
  resourceKey: string;
  limitCount: number | null;
  isUnlimited: boolean;
};

type PlaceLimitFieldName =
  | "villaLimit"
  | "bungalowTinyHouseLimit"
  | "hotelPensionLimit"
  | "detachedHouseApartmentLimit"
  | "campSiteLimit"
  | "transferLimit"
  | "boatTourLimit"
  | "paraglidingMicrolightSkydivingLimit"
  | "safariLimit"
  | "waterSportsLimit"
  | "skiLimit"
  | "balloonTourLimit";

const PLACE_LIMIT_FIELDS: Array<{ name: PlaceLimitFieldName; label: string }> = [
  { name: "villaLimit", label: "Villa" },
  { name: "bungalowTinyHouseLimit", label: "Bungalov & Tiny House" },
  { name: "hotelPensionLimit", label: "Otel & Pansiyon" },
  { name: "detachedHouseApartmentLimit", label: "Müstakil Ev & Daire" },
  { name: "campSiteLimit", label: "Kamp Alanı" },
  { name: "transferLimit", label: "Transfer" },
  { name: "boatTourLimit", label: "Tekne Turu" },
  {
    name: "paraglidingMicrolightSkydivingLimit",
    label: "Paraşüt & Microlight & Skydiving",
  },
  { name: "safariLimit", label: "Safari" },
  { name: "waterSportsLimit", label: "Su Sporları" },
  { name: "skiLimit", label: "Kayak" },
  { name: "balloonTourLimit", label: "Balon Turu" },
];

interface PlanFormProps {
  initialData: SubscriptionPlan | null;
}

const getEntitlementMap = (plan: SubscriptionPlan | null) =>
  new Map(
    (plan?.entitlements ?? []).map((item) => [item.resourceKey, item] as const),
  );

const resolveLimitValue = (
  entitlements: Map<string, PlanEntitlement>,
  key: string,
  fallback: number,
) => {
  const item = entitlements.get(key);
  if (!item || item.isUnlimited) return fallback;
  return item.limitCount ?? fallback;
};

export const PlanForm: React.FC<PlanFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toastMessage = initialData ? "Plan güncellendi." : "Plan oluşturuldu.";
  const action = initialData ? "Değişiklikleri Kaydet" : "Oluştur";

  const entitlementMap = getEntitlementMap(initialData);
  const fallbackPlaceLimit =
    initialData?.maxPlaces ?? initialData?.limits?.maxPlaces ?? 1;
  const fallbackBlogLimit =
    initialData?.maxBlogs ?? initialData?.limits?.maxBlogs ?? 1;

  const defaultValues: PlanFormValues = initialData
    ? {
        name: initialData.name,
        description: initialData.description || "",
        price: parseFloat(initialData.price.toString()),
        currency: initialData.currency as "TRY" | "USD" | "EUR",
        villaLimit: resolveLimitValue(entitlementMap, "place.villa", fallbackPlaceLimit),
        bungalowTinyHouseLimit: resolveLimitValue(
          entitlementMap,
          "place.bungalow_tiny_house",
          fallbackPlaceLimit,
        ),
        hotelPensionLimit: resolveLimitValue(
          entitlementMap,
          "place.hotel_pension",
          fallbackPlaceLimit,
        ),
        detachedHouseApartmentLimit: resolveLimitValue(
          entitlementMap,
          "place.detached_house_apartment",
          fallbackPlaceLimit,
        ),
        campSiteLimit: resolveLimitValue(
          entitlementMap,
          "place.camp_site",
          fallbackPlaceLimit,
        ),
        transferLimit: resolveLimitValue(
          entitlementMap,
          "place.transfer",
          fallbackPlaceLimit,
        ),
        boatTourLimit: resolveLimitValue(
          entitlementMap,
          "place.boat_tour",
          fallbackPlaceLimit,
        ),
        paraglidingMicrolightSkydivingLimit: resolveLimitValue(
          entitlementMap,
          "place.paragliding_microlight_skydiving",
          fallbackPlaceLimit,
        ),
        safariLimit: resolveLimitValue(
          entitlementMap,
          "place.safari",
          fallbackPlaceLimit,
        ),
        waterSportsLimit: resolveLimitValue(
          entitlementMap,
          "place.water_sports",
          fallbackPlaceLimit,
        ),
        skiLimit: resolveLimitValue(entitlementMap, "place.ski", fallbackPlaceLimit),
        balloonTourLimit: resolveLimitValue(
          entitlementMap,
          "place.balloon_tour",
          fallbackPlaceLimit,
        ),
        blogPostLimit: resolveLimitValue(
          entitlementMap,
          "blog.post",
          fallbackBlogLimit,
        ),
        featuresText: (initialData.features ?? []).join("\n"),
        active: initialData.active,
      }
    : {
        name: "",
        description: "",
        price: 0,
        currency: "TRY",
        villaLimit: 1,
        bungalowTinyHouseLimit: 1,
        hotelPensionLimit: 1,
        detachedHouseApartmentLimit: 1,
        campSiteLimit: 1,
        transferLimit: 1,
        boatTourLimit: 1,
        paraglidingMicrolightSkydivingLimit: 1,
        safariLimit: 1,
        waterSportsLimit: 1,
        skiLimit: 1,
        balloonTourLimit: 1,
        blogPostLimit: 1,
        featuresText: "",
        active: true,
      };

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(formSchema) as Resolver<PlanFormValues>,
    defaultValues,
  });

  const onSubmit = async (data: PlanFormValues) => {
    try {
      setLoading(true);
      const url = initialData
        ? `/api/admin/plans/${initialData.id}`
        : `/api/admin/plans`;
      const method = initialData ? "PUT" : "POST";
      const features = (data.featuresText || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const entitlements = [
        { resourceKey: "place.villa", limitCount: data.villaLimit, isUnlimited: false },
        {
          resourceKey: "place.bungalow_tiny_house",
          limitCount: data.bungalowTinyHouseLimit,
          isUnlimited: false,
        },
        {
          resourceKey: "place.hotel_pension",
          limitCount: data.hotelPensionLimit,
          isUnlimited: false,
        },
        {
          resourceKey: "place.detached_house_apartment",
          limitCount: data.detachedHouseApartmentLimit,
          isUnlimited: false,
        },
        { resourceKey: "place.camp_site", limitCount: data.campSiteLimit, isUnlimited: false },
        { resourceKey: "place.transfer", limitCount: data.transferLimit, isUnlimited: false },
        { resourceKey: "place.boat_tour", limitCount: data.boatTourLimit, isUnlimited: false },
        {
          resourceKey: "place.paragliding_microlight_skydiving",
          limitCount: data.paraglidingMicrolightSkydivingLimit,
          isUnlimited: false,
        },
        { resourceKey: "place.safari", limitCount: data.safariLimit, isUnlimited: false },
        {
          resourceKey: "place.water_sports",
          limitCount: data.waterSportsLimit,
          isUnlimited: false,
        },
        { resourceKey: "place.ski", limitCount: data.skiLimit, isUnlimited: false },
        {
          resourceKey: "place.balloon_tour",
          limitCount: data.balloonTourLimit,
          isUnlimited: false,
        },
        { resourceKey: "blog.post", limitCount: data.blogPostLimit, isUnlimited: false },
      ];

      const maxPlaces =
        data.villaLimit +
        data.bungalowTinyHouseLimit +
        data.hotelPensionLimit +
        data.detachedHouseApartmentLimit +
        data.campSiteLimit +
        data.transferLimit +
        data.boatTourLimit +
        data.paraglidingMicrolightSkydivingLimit +
        data.safariLimit +
        data.waterSportsLimit +
        data.skiLimit +
        data.balloonTourLimit;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          price: data.price,
          currency: data.currency,
          billingCycle: "yearly",
          maxPlaces,
          maxBlogs: data.blogPostLimit,
          entitlements,
          features,
          active: data.active,
        }),
      });

      if (!res.ok) throw new Error("Bir hata oluştu");

      toast.success(toastMessage);
      router.push("/subscriptions/plans");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Bir şeyler yanlış gitti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Adı</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="Örn: Temel Paket" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fiyat</FormLabel>
                <FormControl>
                  <Input type="number" disabled={loading} placeholder="99.90" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Para Birimi</FormLabel>
                <FormControl>
                  <Input disabled readOnly {...field} className="bg-muted" />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Şu an sadece yıllık TRY planları desteklenir.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="blogPostLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blog Limiti</FormLabel>
                <FormControl>
                  <Input type="number" disabled={loading} placeholder="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Açıklama</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="Plan açıklaması..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2 rounded-md border p-4 space-y-4">
            <h3 className="text-sm font-semibold">Kategori Limitleri</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PLACE_LIMIT_FIELDS.map((fieldConfig) => (
                <FormField
                  key={fieldConfig.name}
                  control={form.control}
                  name={fieldConfig.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldConfig.label}</FormLabel>
                      <FormControl>
                        <Input type="number" disabled={loading} min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="featuresText"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Plan Özellikleri</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={loading}
                    placeholder={"Her satıra bir özellik yazın\nÖrn: Her kategori için 5 ilan hakkı"}
                    rows={6}
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Her satır ayrı özellik olarak kaydedilir.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Aktif Durum</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Bu planın satın alınabilir olup olmadığını belirler.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>
        <Button disabled={loading} className="ml-auto" type="submit">
          {action}
        </Button>
      </form>
    </Form>
  );
};
