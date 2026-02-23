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
  hotelLimit: z.coerce.number().int().min(0),
  villaLimit: z.coerce.number().int().min(0),
  restaurantLimit: z.coerce.number().int().min(0),
  cafeLimit: z.coerce.number().int().min(0),
  barClubLimit: z.coerce.number().int().min(0),
  beachLimit: z.coerce.number().int().min(0),
  naturalLocationLimit: z.coerce.number().int().min(0),
  activityLocationLimit: z.coerce.number().int().min(0),
  otherMonetizedLimit: z.coerce.number().int().min(0),
  visitLocationUnlimited: z.boolean().default(true),
  visitLocationLimit: z.coerce.number().int().min(0).optional(),
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
  | "hotelLimit"
  | "villaLimit"
  | "restaurantLimit"
  | "cafeLimit"
  | "barClubLimit"
  | "beachLimit"
  | "naturalLocationLimit"
  | "activityLocationLimit"
  | "otherMonetizedLimit";

const PLACE_LIMIT_FIELDS: Array<{ name: PlaceLimitFieldName; label: string }> = [
  { name: "hotelLimit", label: "Otel" },
  { name: "villaLimit", label: "Villa" },
  { name: "restaurantLimit", label: "Restoran" },
  { name: "cafeLimit", label: "Kafe" },
  { name: "barClubLimit", label: "Bar / Club" },
  { name: "beachLimit", label: "Plaj" },
  { name: "naturalLocationLimit", label: "Doğal Lokasyon" },
  { name: "activityLocationLimit", label: "Aktivite Lokasyonu" },
  { name: "otherMonetizedLimit", label: "Diğer Ücretli Lokasyonlar" },
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
  const visitEntitlement = entitlementMap.get("place.visit_location");

  const defaultValues: PlanFormValues = initialData
    ? {
        name: initialData.name,
        description: initialData.description || "",
        price: parseFloat(initialData.price.toString()),
        currency: initialData.currency as "TRY" | "USD" | "EUR",
        hotelLimit: resolveLimitValue(
          entitlementMap,
          "place.hotel",
          fallbackPlaceLimit,
        ),
        villaLimit: resolveLimitValue(
          entitlementMap,
          "place.villa",
          fallbackPlaceLimit,
        ),
        restaurantLimit: resolveLimitValue(
          entitlementMap,
          "place.restaurant",
          fallbackPlaceLimit,
        ),
        cafeLimit: resolveLimitValue(
          entitlementMap,
          "place.cafe",
          fallbackPlaceLimit,
        ),
        barClubLimit: resolveLimitValue(
          entitlementMap,
          "place.bar_club",
          fallbackPlaceLimit,
        ),
        beachLimit: resolveLimitValue(
          entitlementMap,
          "place.beach",
          fallbackPlaceLimit,
        ),
        naturalLocationLimit: resolveLimitValue(
          entitlementMap,
          "place.natural_location",
          fallbackPlaceLimit,
        ),
        activityLocationLimit: resolveLimitValue(
          entitlementMap,
          "place.activity_location",
          fallbackPlaceLimit,
        ),
        otherMonetizedLimit: resolveLimitValue(
          entitlementMap,
          "place.other_monetized",
          fallbackPlaceLimit,
        ),
        visitLocationUnlimited: visitEntitlement?.isUnlimited ?? true,
        visitLocationLimit: visitEntitlement?.limitCount ?? 0,
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
        hotelLimit: 1,
        villaLimit: 1,
        restaurantLimit: 1,
        cafeLimit: 1,
        barClubLimit: 1,
        beachLimit: 1,
        naturalLocationLimit: 1,
        activityLocationLimit: 1,
        otherMonetizedLimit: 1,
        visitLocationUnlimited: true,
        visitLocationLimit: 0,
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
        { resourceKey: "place.hotel", limitCount: data.hotelLimit, isUnlimited: false },
        { resourceKey: "place.villa", limitCount: data.villaLimit, isUnlimited: false },
        { resourceKey: "place.restaurant", limitCount: data.restaurantLimit, isUnlimited: false },
        { resourceKey: "place.cafe", limitCount: data.cafeLimit, isUnlimited: false },
        { resourceKey: "place.bar_club", limitCount: data.barClubLimit, isUnlimited: false },
        { resourceKey: "place.beach", limitCount: data.beachLimit, isUnlimited: false },
        {
          resourceKey: "place.natural_location",
          limitCount: data.naturalLocationLimit,
          isUnlimited: false,
        },
        {
          resourceKey: "place.activity_location",
          limitCount: data.activityLocationLimit,
          isUnlimited: false,
        },
        {
          resourceKey: "place.other_monetized",
          limitCount: data.otherMonetizedLimit,
          isUnlimited: false,
        },
        {
          resourceKey: "place.visit_location",
          limitCount: data.visitLocationUnlimited
            ? null
            : (data.visitLocationLimit ?? 0),
          isUnlimited: data.visitLocationUnlimited,
        },
        { resourceKey: "blog.post", limitCount: data.blogPostLimit, isUnlimited: false },
      ];

      const maxPlaces =
        data.hotelLimit +
        data.villaLimit +
        data.restaurantLimit +
        data.cafeLimit +
        data.barClubLimit +
        data.beachLimit +
        data.naturalLocationLimit +
        data.activityLocationLimit +
        data.otherMonetizedLimit;

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

  const visitLocationUnlimited = form.watch("visitLocationUnlimited");

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
            <h3 className="text-sm font-semibold">Yer Türü Limitleri</h3>
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="visitLocationUnlimited"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Ziyaret Lokasyonu Sınırsız</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Açıkken ziyaret lokasyonu için adet limiti uygulanmaz.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visitLocationLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ziyaret Lokasyonu Limiti</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        disabled={loading || visitLocationUnlimited}
                        min={0}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    placeholder={"Her satıra bir özellik yazın\nÖrn: 5 mekan yayınlama hakkı"}
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
