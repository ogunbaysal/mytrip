import { Hono } from "hono";
import { db } from "../../db/index.ts";
import {
  blogPost,
  payment,
  place,
  subscription,
  subscriptionPlan,
  subscriptionPlanEntitlement,
  subscriptionPlanFeature,
  user,
} from "../../db/schemas/index.ts";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { paymentProvider } from "../../lib/payment-provider.ts";
import { nanoid } from "nanoid";
import {
  type PlanResourceKey,
  resolveResourceKeyForPlaceKind,
} from "../../lib/plan-entitlements.ts";

const app = new Hono();

// Schema for manually assigning a subscription
const assignSubscriptionSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1),
  startDate: z.string().optional(), // ISO date string
});

const updateSubscriptionSchema = z
  .object({
    status: z.enum(["active", "expired", "cancelled", "pending", "trial"]).optional(),
    planId: z.string().min(1).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    nextBillingDate: z.string().nullable().optional(),
    trialEndsAt: z.string().nullable().optional(),
    cancelledAt: z.string().nullable().optional(),
    paymentMethod: z.record(z.string(), z.unknown()).nullable().optional(),
    usage: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

const toDateOnly = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date value");
  }
  return date.toISOString().split("T")[0];
};

const parseJsonObject = (value: string | null) => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const parseNumeric = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number.parseFloat(value);
};

const RESOURCE_KEYS: PlanResourceKey[] = [
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
  "blog.post",
];

const PLACE_RESOURCE_KEYS = RESOURCE_KEYS.filter((key) =>
  key.startsWith("place."),
) as PlanResourceKey[];

const createEmptyUsageResources = (): Record<PlanResourceKey, number> =>
  RESOURCE_KEYS.reduce(
    (acc, key) => {
      acc[key] = 0;
      return acc;
    },
    {} as Record<PlanResourceKey, number>,
  );

const hydrateSubscriptionRows = async (
  rows: Array<{
    id: string;
    userId: string;
    planId: string;
    status: "active" | "expired" | "cancelled" | "pending" | "trial";
    startDate: string;
    endDate: string;
    nextBillingDate: string | null;
    cancelledAt: Date | null;
    trialEndsAt: Date | null;
    usage: string | null;
    paymentMethod: string | null;
    price: string;
    basePrice: string;
    discountAmount: string;
    couponCode: string | null;
    currency: "TRY" | "USD" | "EUR";
    billingCycle: "monthly" | "quarterly" | "yearly";
    createdAt: Date;
    updatedAt: Date;
    user: { id: string | null; name: string | null; email: string | null };
    plan: {
      id: string | null;
      name: string | null;
      price: string | null;
      billingCycle: "monthly" | "quarterly" | "yearly" | null;
      maxPlaces: number | null;
      maxBlogs: number | null;
    };
  }>,
) => {
  if (rows.length === 0) {
    return [];
  }

  const userIds = Array.from(
    new Set(rows.map((row) => row.user.id).filter((id): id is string => Boolean(id))),
  );
  const planIds = Array.from(
    new Set(rows.map((row) => row.plan.id).filter((id): id is string => Boolean(id))),
  );

  const [placeUsageByKindRows, blogUsageRows, entitlementRows] =
    userIds.length > 0 || planIds.length > 0
      ? await Promise.all([
          userIds.length > 0
            ? db
                .select({
                  userId: place.ownerId,
                  kind: place.kind,
                  count: sql<number>`COUNT(*)::int`,
                })
                .from(place)
                .where(inArray(place.ownerId, userIds))
                .groupBy(place.ownerId, place.kind)
            : Promise.resolve([]),
          userIds.length > 0
            ? db
                .select({
                  userId: blogPost.authorId,
                  count: sql<number>`COUNT(*)::int`,
                })
                .from(blogPost)
                .where(inArray(blogPost.authorId, userIds))
                .groupBy(blogPost.authorId)
            : Promise.resolve([]),
          planIds.length > 0
            ? db
                .select({
                  planId: subscriptionPlanEntitlement.planId,
                  resourceKey: subscriptionPlanEntitlement.resourceKey,
                  limitCount: subscriptionPlanEntitlement.limitCount,
                  isUnlimited: subscriptionPlanEntitlement.isUnlimited,
                })
                .from(subscriptionPlanEntitlement)
                .where(inArray(subscriptionPlanEntitlement.planId, planIds))
            : Promise.resolve([]),
        ])
      : [[], [], []];

  const placeUsageByResourceMap = new Map<string, Record<PlanResourceKey, number>>();
  for (const usageRow of placeUsageByKindRows) {
    if (usageRow.userId) {
      const resourceKey = resolveResourceKeyForPlaceKind(usageRow.kind);
      if (!placeUsageByResourceMap.has(usageRow.userId)) {
        placeUsageByResourceMap.set(usageRow.userId, createEmptyUsageResources());
      }
      const currentByResource = placeUsageByResourceMap.get(usageRow.userId)!;
      currentByResource[resourceKey] += usageRow.count;
    }
  }

  const blogUsageMap = new Map<string, number>();
  for (const usageRow of blogUsageRows) {
    if (usageRow.userId) {
      blogUsageMap.set(usageRow.userId, usageRow.count);
    }
  }

  const entitlementMap = new Map<
    string,
    Array<{
      resourceKey: string;
      limitCount: number | null;
      isUnlimited: boolean;
    }>
  >();
  for (const row of entitlementRows) {
    if (!entitlementMap.has(row.planId)) {
      entitlementMap.set(row.planId, []);
    }
    entitlementMap.get(row.planId)!.push({
      resourceKey: row.resourceKey,
      limitCount: row.limitCount,
      isUnlimited: row.isUnlimited,
    });
  }

  return rows.map((row) => {
    const usagePayload = parseJsonObject(row.usage) as Record<string, unknown>;
    const paymentPayload = parseJsonObject(row.paymentMethod) as Record<string, unknown>;
    const userId = row.user.id ?? "";
    const computedUsageResources =
      placeUsageByResourceMap.get(userId) ?? createEmptyUsageResources();
    const usageResourcesFromPayload =
      usagePayload.resources &&
      typeof usagePayload.resources === "object" &&
      usagePayload.resources !== null
        ? (usagePayload.resources as Record<string, unknown>)
        : {};
    const usageResources = { ...computedUsageResources };

    for (const key of RESOURCE_KEYS) {
      const payloadValue = usageResourcesFromPayload[key];
      if (typeof payloadValue === "number" && Number.isFinite(payloadValue)) {
        usageResources[key] = payloadValue;
      }
    }

    usageResources["blog.post"] = blogUsageMap.get(userId) ?? usageResources["blog.post"];

    return {
      ...row,
      billingCycle: "yearly" as const,
      user: {
        id: row.user.id ?? "",
        name: row.user.name ?? "Bilinmeyen Kullanıcı",
        email: row.user.email ?? "unknown@example.com",
      },
      plan: {
        id: row.plan.id ?? "",
        name: row.plan.name ?? "Bilinmeyen Plan",
        price: row.plan.price ?? "0",
        billingCycle: "yearly" as const,
        maxPlaces: row.plan.maxPlaces ?? 0,
        maxBlogs: row.plan.maxBlogs ?? 0,
        entitlements: row.plan.id ? (entitlementMap.get(row.plan.id) ?? []) : [],
      },
      price: parseNumeric(row.price),
      basePrice: parseNumeric(row.basePrice),
      discountAmount: parseNumeric(row.discountAmount),
      usage: {
        currentPlaces:
          typeof usagePayload.currentPlaces === "number"
            ? usagePayload.currentPlaces
            : PLACE_RESOURCE_KEYS.reduce(
                (sum, key) => sum + (usageResources[key] ?? 0),
                0,
              ),
        currentBlogs:
          typeof usagePayload.currentBlogs === "number"
            ? usagePayload.currentBlogs
            : usageResources["blog.post"] ?? blogUsageMap.get(userId) ?? 0,
        resources: usageResources,
      },
      paymentMethod:
        Object.keys(paymentPayload).length > 0
          ? paymentPayload
          : { type: "manual_admin" },
    };
  });
};

/**
 * List all subscriptions
 * GET /admin/subscriptions
 */
app.get("/", async (c) => {
  try {
    const { status, planId } = c.req.query();

    const conditions = [];
    if (status) conditions.push(eq(subscription.status, status as any));
    if (planId) conditions.push(eq(subscription.planId, planId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        planId: subscription.planId,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        cancelledAt: subscription.cancelledAt,
        trialEndsAt: subscription.trialEndsAt,
        usage: subscription.usage,
        paymentMethod: subscription.paymentMethod,
        price: subscription.price,
        basePrice: subscription.basePrice,
        discountAmount: subscription.discountAmount,
        couponCode: subscription.couponCode,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        plan: {
          id: subscriptionPlan.id,
          name: subscriptionPlan.name,
          price: subscriptionPlan.price,
          billingCycle: subscriptionPlan.billingCycle,
          maxPlaces: subscriptionPlan.maxPlaces,
          maxBlogs: subscriptionPlan.maxBlogs,
        },
      })
      .from(subscription)
      .innerJoin(user, eq(subscription.userId, user.id))
      .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
      .where(whereClause)
      .orderBy(desc(subscription.createdAt));

    const subscriptions = await hydrateSubscriptionRows(rows);
    return c.json({ subscriptions });
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return c.json({ error: "Failed to fetch subscriptions" }, 500);
  }
});

/**
 * Get a single subscription
 * GET /admin/subscriptions/:id
 */
app.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const [row] = await db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        planId: subscription.planId,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        cancelledAt: subscription.cancelledAt,
        trialEndsAt: subscription.trialEndsAt,
        usage: subscription.usage,
        paymentMethod: subscription.paymentMethod,
        price: subscription.price,
        basePrice: subscription.basePrice,
        discountAmount: subscription.discountAmount,
        couponCode: subscription.couponCode,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        plan: {
          id: subscriptionPlan.id,
          name: subscriptionPlan.name,
          description: subscriptionPlan.description,
          price: subscriptionPlan.price,
          currency: subscriptionPlan.currency,
          billingCycle: subscriptionPlan.billingCycle,
          maxPlaces: subscriptionPlan.maxPlaces,
          maxBlogs: subscriptionPlan.maxBlogs,
        },
      })
      .from(subscription)
      .innerJoin(user, eq(subscription.userId, user.id))
      .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
      .where(eq(subscription.id, id))
      .limit(1);

    if (!row) {
      return c.json({ error: "Subscription not found" }, 404);
    }

    const [hydrated] = await hydrateSubscriptionRows([
      {
        ...row,
        user: {
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
        },
        plan: {
          id: row.plan.id,
          name: row.plan.name,
          price: row.plan.price,
          billingCycle: row.plan.billingCycle,
          maxPlaces: row.plan.maxPlaces,
          maxBlogs: row.plan.maxBlogs,
        },
      },
    ]);

    const [planFeatures, paymentHistory] = await Promise.all([
      row.plan.id
        ? db
            .select({
              label: subscriptionPlanFeature.label,
            })
            .from(subscriptionPlanFeature)
            .where(eq(subscriptionPlanFeature.planId, row.plan.id))
            .orderBy(asc(subscriptionPlanFeature.sortOrder))
        : Promise.resolve([]),
      db
        .select({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
          invoiceId: payment.invoiceId,
          providerTransactionId: payment.providerTransactionId,
          paymentMethod: payment.paymentMethod,
        })
        .from(payment)
        .where(eq(payment.subscriptionId, id))
        .orderBy(desc(payment.createdAt)),
    ]);

    return c.json({
      subscription: {
        ...hydrated,
        user: {
          ...hydrated.user,
          phone: row.user.phone,
        },
        plan: {
          ...hydrated.plan,
          description: row.plan.description,
          features: planFeatures.map((feature) => feature.label),
        },
        paymentHistory: paymentHistory.map((item) => ({
          ...item,
          amount: parseNumeric(item.amount),
          paymentMethod: parseJsonObject(item.paymentMethod),
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return c.json({ error: "Failed to fetch subscription" }, 500);
  }
});

/**
 * Update a subscription
 * PUT /admin/subscriptions/:id
 */
app.put("/:id", zValidator("json", updateSubscriptionSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");

  try {
    const [existing] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Subscription not found" }, 404);
    }

    let planOverride:
      | {
          id: string;
          price: string;
          currency: "TRY" | "USD" | "EUR";
          billingCycle: "monthly" | "quarterly" | "yearly";
        }
      | undefined;

    if (data.planId) {
      const [nextPlan] = await db
        .select({
          id: subscriptionPlan.id,
          price: subscriptionPlan.price,
          currency: subscriptionPlan.currency,
          billingCycle: subscriptionPlan.billingCycle,
        })
        .from(subscriptionPlan)
        .where(eq(subscriptionPlan.id, data.planId))
        .limit(1);

      if (!nextPlan) {
        return c.json({ error: "Plan not found" }, 404);
      }

      planOverride = nextPlan;
    }

    const usagePayload =
      data.usage === undefined
        ? undefined
        : data.usage === null
          ? null
          : JSON.stringify(data.usage);

    const paymentMethodPayload =
      data.paymentMethod === undefined
        ? undefined
        : data.paymentMethod === null
          ? null
          : JSON.stringify(data.paymentMethod);

    const [updated] = await db
      .update(subscription)
      .set({
        status: data.status,
        planId: data.planId,
        startDate: data.startDate ? toDateOnly(data.startDate) : undefined,
        endDate: data.endDate ? toDateOnly(data.endDate) : undefined,
        nextBillingDate:
          data.nextBillingDate !== undefined
            ? data.nextBillingDate
              ? toDateOnly(data.nextBillingDate)
              : null
            : undefined,
        trialEndsAt:
          data.trialEndsAt !== undefined
            ? data.trialEndsAt
              ? new Date(data.trialEndsAt)
              : null
            : undefined,
        cancelledAt:
          data.cancelledAt !== undefined
            ? data.cancelledAt
              ? new Date(data.cancelledAt)
              : null
            : data.status && data.status !== "cancelled"
              ? null
              : undefined,
        usage: usagePayload,
        paymentMethod: paymentMethodPayload,
        basePrice: planOverride?.price,
        price: planOverride?.price,
        currency: planOverride?.currency,
        billingCycle: planOverride?.billingCycle,
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, id))
      .returning();

    return c.json({ subscription: updated });
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return c.json({ error: "Failed to update subscription" }, 500);
  }
});

/**
 * Cancel a subscription
 * PUT /admin/subscriptions/:id/cancel
 */
app.put("/:id/cancel", async (c) => {
  const id = c.req.param("id");

  try {
    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.id, id))
      .limit(1);

    if (!sub) {
      return c.json({ error: "Subscription not found" }, 404);
    }

    if (sub.providerSubscriptionId) {
        await paymentProvider.cancelSubscription(sub.providerSubscriptionId);
    }

    const [updatedSub] = await db
      .update(subscription)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, id))
      .returning();

    return c.json({ subscription: updatedSub });
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    return c.json({ error: "Failed to cancel subscription" }, 500);
  }
});

/**
 * Reactivate a subscription
 * PUT /admin/subscriptions/:id/reactivate
 */
app.put("/:id/reactivate", async (c) => {
  const id = c.req.param("id");

  try {
    const [sub] = await db
      .select({
        id: subscription.id,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      })
      .from(subscription)
      .where(eq(subscription.id, id))
      .limit(1);

    if (!sub) {
      return c.json({ error: "Subscription not found" }, 404);
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const nextBillingDate = endDate.toISOString().split("T")[0];
    const startDate = now.toISOString().split("T")[0];

    const [updatedSub] = await db
      .update(subscription)
      .set({
        status: "active",
        cancelledAt: null,
        startDate,
        endDate: nextBillingDate,
        nextBillingDate,
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, id))
      .returning();

    return c.json({ subscription: updatedSub });
  } catch (error) {
    console.error("Failed to reactivate subscription:", error);
    return c.json({ error: "Failed to reactivate subscription" }, 500);
  }
});

/**
 * Manually assign a subscription (Admin only override)
 * POST /admin/subscriptions
 */
app.post("/", zValidator("json", assignSubscriptionSchema), async (c) => {
  const data = c.req.valid("json");

  try {
    // Fetch plan details
    const [plan] = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.id, data.planId))
      .limit(1);

    if (!plan) return c.json({ error: "Plan not found" }, 404);

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    if (Number.isNaN(startDate.getTime())) {
      return c.json({ error: "Invalid start date" }, 400);
    }

    const endDate = new Date(startDate);

    // Yearly-only subscriptions
    endDate.setFullYear(endDate.getFullYear() + 1);

    const [newSub] = await db
      .insert(subscription)
      .values({
        id: nanoid(),
        userId: data.userId,
        planId: data.planId,
        status: "active",
        provider: "mock",
        basePrice: plan.price.toString(),
        discountAmount: "0",
        price: plan.price.toString(),
        currency: plan.currency,
        billingCycle: "yearly",
        startDate: startDate.toISOString().split("T")[0], // Cast to date string YYYY-MM-DD
        endDate: endDate.toISOString().split("T")[0],
        nextBillingDate: endDate.toISOString().split("T")[0],
        paymentMethod: JSON.stringify({ type: "manual_admin" }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update user status
    await db
      .update(user)
      .set({ subscriptionStatus: "active" })
      .where(eq(user.id, data.userId));

    return c.json({ subscription: newSub }, 201);
  } catch (error) {
    console.error("Failed to assign subscription:", error);
    return c.json({ error: "Failed to assign subscription" }, 500);
  }
});

export { app as subscriptionsRoutes };
