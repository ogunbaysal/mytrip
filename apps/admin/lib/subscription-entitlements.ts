import {
  PlanEntitlement,
  PlanResourceKey,
} from "@/types/subscriptions";

export const RESOURCE_LABELS: Record<PlanResourceKey, string> = {
  "place.villa": "Villa",
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

export const PLACE_RESOURCE_KEYS: PlanResourceKey[] = [
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

export const STAY_RESOURCE_KEYS: PlanResourceKey[] = [
  "place.villa",
  "place.bungalow_tiny_house",
  "place.hotel_pension",
  "place.detached_house_apartment",
  "place.camp_site",
];

export const ACTIVITY_RESOURCE_KEYS: PlanResourceKey[] = [
  "place.transfer",
  "place.boat_tour",
  "place.paragliding_microlight_skydiving",
  "place.safari",
  "place.water_sports",
  "place.ski",
  "place.balloon_tour",
];

export const MONETIZED_PLACE_RESOURCE_KEYS: PlanResourceKey[] = PLACE_RESOURCE_KEYS;

export type UsageByResource = Partial<Record<PlanResourceKey, number>>;

type UsageSummary = {
  current: number;
  max: number | null;
  isUnlimited: boolean;
};

const getEntitlementByKey = (
  entitlements: PlanEntitlement[] | undefined,
  key: PlanResourceKey,
) => entitlements?.find((item) => item.resourceKey === key);

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const normalizeUsageByResource = (value: unknown): UsageByResource => {
  if (!value || typeof value !== "object") return {};
  const input = value as Record<string, unknown>;
  const result: UsageByResource = {};

  for (const key of [...PLACE_RESOURCE_KEYS, "blog.post"] as PlanResourceKey[]) {
    const numericValue = toNumber(input[key]);
    if (numericValue !== null) {
      result[key] = numericValue;
    }
  }

  return result;
};

export const deriveLegacyLimitsFromEntitlements = (
  entitlements: PlanEntitlement[] | undefined,
  fallback: { maxPlaces: number; maxBlogs: number },
) => {
  if (!entitlements || entitlements.length === 0) {
    return fallback;
  }

  const totalPlaceLimit = entitlements
    .filter(
      (item) => item.resourceKey.startsWith("place.") && !item.isUnlimited,
    )
    .reduce((sum, item) => sum + (item.limitCount ?? 0), 0);

  const blogEntitlement = getEntitlementByKey(entitlements, "blog.post");

  return {
    maxPlaces: totalPlaceLimit,
    maxBlogs: blogEntitlement?.limitCount ?? fallback.maxBlogs,
  };
};

export const formatLimit = (max: number | null, isUnlimited: boolean) =>
  isUnlimited || max === null ? "∞" : String(max);

const buildSummary = (
  entitlements: PlanEntitlement[] | undefined,
  usageByResource: UsageByResource | undefined,
  keys: PlanResourceKey[],
): UsageSummary => {
  let current = 0;
  let max = 0;
  let isUnlimited = false;
  let hasAnyEntitlement = false;

  for (const key of keys) {
    const entitlement = getEntitlementByKey(entitlements, key);
    if (!entitlement) continue;
    hasAnyEntitlement = true;
    current += usageByResource?.[key] ?? 0;

    if (entitlement.isUnlimited) {
      isUnlimited = true;
      continue;
    }
    max += entitlement.limitCount ?? 0;
  }

  if (!hasAnyEntitlement) {
    return {
      current,
      max: 0,
      isUnlimited: false,
    };
  }

  return {
    current,
    max: isUnlimited ? null : max,
    isUnlimited,
  };
};

export const getMonetizedPlaceUsageSummary = (
  entitlements: PlanEntitlement[] | undefined,
  usageByResource: UsageByResource | undefined,
) => buildSummary(entitlements, usageByResource, MONETIZED_PLACE_RESOURCE_KEYS);

export const getStayUsageSummary = (
  entitlements: PlanEntitlement[] | undefined,
  usageByResource: UsageByResource | undefined,
): UsageSummary => buildSummary(entitlements, usageByResource, STAY_RESOURCE_KEYS);

export const getActivityUsageSummary = (
  entitlements: PlanEntitlement[] | undefined,
  usageByResource: UsageByResource | undefined,
): UsageSummary => buildSummary(entitlements, usageByResource, ACTIVITY_RESOURCE_KEYS);

// Backward-compat alias for existing call sites.
export const getVisitLocationUsageSummary = getActivityUsageSummary;

export const getBlogUsageSummary = (
  entitlements: PlanEntitlement[] | undefined,
  usageByResource: UsageByResource | undefined,
): UsageSummary => {
  const entitlement = getEntitlementByKey(entitlements, "blog.post");
  return {
    current: usageByResource?.["blog.post"] ?? 0,
    max: entitlement?.isUnlimited ? null : (entitlement?.limitCount ?? 0),
    isUnlimited: Boolean(entitlement?.isUnlimited),
  };
};
