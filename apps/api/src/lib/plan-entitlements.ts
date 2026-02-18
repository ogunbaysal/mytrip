import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  blogPost,
  place,
  subscription,
  subscriptionPlan,
  subscriptionPlanEntitlement,
  subscriptionPlanFeature,
} from "../db/schemas/index.ts";

export type PlanResourceKey =
  | "place.hotel"
  | "place.villa"
  | "place.restaurant"
  | "place.cafe"
  | "place.bar_club"
  | "place.beach"
  | "place.natural_location"
  | "place.activity_location"
  | "place.visit_location"
  | "place.other_monetized"
  | "blog.post";

export type PlanEntitlement = {
  resourceKey: PlanResourceKey;
  limitCount: number | null;
  isUnlimited: boolean;
};

const PLACE_KIND_TO_RESOURCE_KEY: Record<string, PlanResourceKey> = {
  hotel: "place.hotel",
  villa: "place.villa",
  restaurant: "place.restaurant",
  cafe: "place.cafe",
  bar_club: "place.bar_club",
  beach: "place.beach",
  natural_location: "place.natural_location",
  activity_location: "place.activity_location",
  visit_location: "place.visit_location",
  other_monetized: "place.other_monetized",
};

const RESOURCE_KEY_TO_PLACE_KIND: Partial<Record<PlanResourceKey, string>> =
  Object.entries(PLACE_KIND_TO_RESOURCE_KEY).reduce(
    (acc, [kind, resourceKey]) => {
      acc[resourceKey as PlanResourceKey] = kind;
      return acc;
    },
    {} as Partial<Record<PlanResourceKey, string>>,
  );

export const resolveResourceKeyForPlaceKind = (
  kind: string | null | undefined,
): PlanResourceKey => {
  if (!kind) return "place.other_monetized";
  return PLACE_KIND_TO_RESOURCE_KEY[kind] ?? "place.other_monetized";
};

export const resolvePlaceKindForResourceKey = (
  resourceKey: PlanResourceKey,
): string | null => RESOURCE_KEY_TO_PLACE_KIND[resourceKey] ?? null;

export const hydratePlansWithFeaturesAndEntitlements = async <
  T extends {
    id: string;
    billingCycle: string;
    maxPlaces?: number | null;
    maxBlogs?: number | null;
  },
>(plans: T[]) => {
  if (plans.length === 0) return [];

  const planIds = plans.map((plan) => plan.id);
  const [featureRows, entitlementRows] = await Promise.all([
    db
      .select({
        planId: subscriptionPlanFeature.planId,
        label: subscriptionPlanFeature.label,
      })
      .from(subscriptionPlanFeature)
      .where(inArray(subscriptionPlanFeature.planId, planIds))
      .orderBy(
        asc(subscriptionPlanFeature.planId),
        asc(subscriptionPlanFeature.sortOrder),
      ),
    db
      .select({
        planId: subscriptionPlanEntitlement.planId,
        resourceKey: subscriptionPlanEntitlement.resourceKey,
        limitCount: subscriptionPlanEntitlement.limitCount,
        isUnlimited: subscriptionPlanEntitlement.isUnlimited,
      })
      .from(subscriptionPlanEntitlement)
      .where(inArray(subscriptionPlanEntitlement.planId, planIds))
      .orderBy(
        asc(subscriptionPlanEntitlement.planId),
        asc(subscriptionPlanEntitlement.resourceKey),
      ),
  ]);

  const featureMap = new Map<string, string[]>();
  for (const row of featureRows) {
    if (!featureMap.has(row.planId)) featureMap.set(row.planId, []);
    featureMap.get(row.planId)!.push(row.label);
  }

  const entitlementMap = new Map<string, PlanEntitlement[]>();
  for (const row of entitlementRows) {
    if (!entitlementMap.has(row.planId)) entitlementMap.set(row.planId, []);
    entitlementMap.get(row.planId)!.push({
      resourceKey: row.resourceKey as PlanResourceKey,
      limitCount: row.limitCount,
      isUnlimited: row.isUnlimited,
    });
  }

  return plans.map((plan) => {
    const features = featureMap.get(plan.id) ?? [];
    const entitlements = entitlementMap.get(plan.id) ?? [];
    const blogEntitlement = entitlements.find((e) => e.resourceKey === "blog.post");

    return {
      ...plan,
      billingCycle:
        plan.billingCycle === "yearly" ? ("yearly" as const) : plan.billingCycle,
      features,
      entitlements,
      limits: {
        maxPlaces: plan.maxPlaces ?? 0,
        maxBlogs: plan.maxBlogs ?? blogEntitlement?.limitCount ?? 0,
      },
    };
  });
};

export const getEntitlementsForPlan = async (
  planId: string,
): Promise<PlanEntitlement[]> => {
  const rows = await db
    .select({
      resourceKey: subscriptionPlanEntitlement.resourceKey,
      limitCount: subscriptionPlanEntitlement.limitCount,
      isUnlimited: subscriptionPlanEntitlement.isUnlimited,
    })
    .from(subscriptionPlanEntitlement)
    .where(eq(subscriptionPlanEntitlement.planId, planId))
    .orderBy(asc(subscriptionPlanEntitlement.resourceKey));

  return rows.map((row) => ({
    resourceKey: row.resourceKey as PlanResourceKey,
    limitCount: row.limitCount,
    isUnlimited: row.isUnlimited,
  }));
};

export const getCurrentUsageByResource = async (userId: string) => {
  const [placeCounts, blogCountRows] = await Promise.all([
    db
      .select({
        kind: place.kind,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .where(eq(place.ownerId, userId))
      .groupBy(place.kind),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(blogPost)
      .where(eq(blogPost.authorId, userId)),
  ]);

  const placeCountByKind = new Map<string, number>();
  for (const row of placeCounts) {
    placeCountByKind.set(row.kind, row.count);
  }

  const usage: Record<PlanResourceKey, number> = {
    "place.hotel": placeCountByKind.get("hotel") ?? 0,
    "place.villa": placeCountByKind.get("villa") ?? 0,
    "place.restaurant": placeCountByKind.get("restaurant") ?? 0,
    "place.cafe": placeCountByKind.get("cafe") ?? 0,
    "place.bar_club": placeCountByKind.get("bar_club") ?? 0,
    "place.beach": placeCountByKind.get("beach") ?? 0,
    "place.natural_location": placeCountByKind.get("natural_location") ?? 0,
    "place.activity_location": placeCountByKind.get("activity_location") ?? 0,
    "place.visit_location": placeCountByKind.get("visit_location") ?? 0,
    "place.other_monetized": placeCountByKind.get("other_monetized") ?? 0,
    "blog.post": blogCountRows[0]?.count ?? 0,
  };

  return usage;
};

export const getLatestSubscriptionForUser = async (userId: string) => {
  const rows = await db
    .select({
      id: subscription.id,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      nextBillingDate: subscription.nextBillingDate,
      cancelledAt: subscription.cancelledAt,
      planId: subscription.planId,
      price: subscription.price,
      basePrice: subscription.basePrice,
      discountAmount: subscription.discountAmount,
      couponCode: subscription.couponCode,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      planName: subscriptionPlan.name,
      planDescription: subscriptionPlan.description,
      planMaxPlaces: subscriptionPlan.maxPlaces,
      planMaxBlogs: subscriptionPlan.maxBlogs,
      createdAt: subscription.createdAt,
    })
    .from(subscription)
    .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
    .where(eq(subscription.userId, userId))
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  return rows[0] ?? null;
};

export const getActiveSubscriptionForUser = async (userId: string) => {
  const rows = await db
    .select({
      id: subscription.id,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      planId: subscription.planId,
    })
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        or(eq(subscription.status, "active"), eq(subscription.status, "trial")),
      ),
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  return rows[0] ?? null;
};
