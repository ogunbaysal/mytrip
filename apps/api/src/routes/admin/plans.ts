import { Hono } from "hono";
import { db } from "../../db/index.ts";
import {
  subscriptionPlan,
  subscriptionPlanEntitlement,
  subscriptionPlanFeature,
} from "../../db/schemas/index.ts";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import {
  hydratePlansWithFeaturesAndEntitlements,
  type PlanResourceKey,
} from "../../lib/plan-entitlements.ts";

const app = new Hono();

const PLAN_RESOURCE_KEYS = [
  "place.hotel",
  "place.villa",
  "place.restaurant",
  "place.cafe",
  "place.bar_club",
  "place.beach",
  "place.natural_location",
  "place.activity_location",
  "place.visit_location",
  "place.other_monetized",
  "blog.post",
] as const satisfies readonly PlanResourceKey[];

const entitlementSchema = z.object({
  resourceKey: z.enum(PLAN_RESOURCE_KEYS),
  limitCount: z.number().int().min(0).nullable().optional(),
  isUnlimited: z.boolean().optional().default(false),
});

const planSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  billingCycle: z.enum(["yearly"]).optional().default("yearly"),
  maxPlaces: z.number().int().min(0).optional(),
  maxBlogs: z.number().int().min(0).optional(),
  features: z.array(z.string().min(1)).default([]),
  entitlements: z.array(entitlementSchema).default([]),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const normalizeFeatures = (features: string[]) =>
  Array.from(
    new Set(
      features
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0),
    ),
  );

const normalizeEntitlements = (
  values: z.infer<typeof entitlementSchema>[],
): Array<{
  resourceKey: PlanResourceKey;
  limitCount: number | null;
  isUnlimited: boolean;
}> => {
  const byKey = new Map<
    PlanResourceKey,
    { resourceKey: PlanResourceKey; limitCount: number | null; isUnlimited: boolean }
  >();

  for (const item of values) {
    const resourceKey = item.resourceKey as PlanResourceKey;
    const isUnlimited = Boolean(item.isUnlimited);
    byKey.set(resourceKey, {
      resourceKey,
      isUnlimited,
      limitCount: isUnlimited ? null : (item.limitCount ?? 0),
    });
  }

  return [...byKey.values()].sort((a, b) =>
    a.resourceKey.localeCompare(b.resourceKey),
  );
};

const buildDefaultEntitlements = (
  maxPlaces: number,
  maxBlogs: number,
): z.infer<typeof entitlementSchema>[] => [
  { resourceKey: "place.hotel", limitCount: maxPlaces, isUnlimited: false },
  { resourceKey: "place.villa", limitCount: maxPlaces, isUnlimited: false },
  { resourceKey: "place.restaurant", limitCount: maxPlaces, isUnlimited: false },
  { resourceKey: "place.cafe", limitCount: maxPlaces, isUnlimited: false },
  { resourceKey: "place.bar_club", limitCount: maxPlaces, isUnlimited: false },
  { resourceKey: "place.beach", limitCount: maxPlaces, isUnlimited: false },
  { resourceKey: "place.natural_location", limitCount: maxPlaces, isUnlimited: false },
  { resourceKey: "place.activity_location", limitCount: maxPlaces, isUnlimited: false },
  { resourceKey: "place.other_monetized", limitCount: maxPlaces, isUnlimited: false },
  { resourceKey: "place.visit_location", limitCount: null, isUnlimited: true },
  { resourceKey: "blog.post", limitCount: maxBlogs, isUnlimited: false },
];

const deriveLegacyLimits = (
  entitlements: Array<{
    resourceKey: PlanResourceKey;
    limitCount: number | null;
    isUnlimited: boolean;
  }>,
  fallbackMaxPlaces?: number,
  fallbackMaxBlogs?: number,
) => {
  const blogEntitlement = entitlements.find((e) => e.resourceKey === "blog.post");
  const placeTotal = entitlements
    .filter((e) => e.resourceKey.startsWith("place.") && !e.isUnlimited)
    .reduce((sum, item) => sum + (item.limitCount ?? 0), 0);

  return {
    maxPlaces: fallbackMaxPlaces ?? placeTotal,
    maxBlogs: fallbackMaxBlogs ?? (blogEntitlement?.limitCount ?? 0),
  };
};

const hydratePlans = async (plans: (typeof subscriptionPlan.$inferSelect)[]) =>
  hydratePlansWithFeaturesAndEntitlements(plans);

app.get("/", async (c) => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlan)
      .orderBy(asc(subscriptionPlan.sortOrder), desc(subscriptionPlan.createdAt));

    return c.json({ plans: await hydratePlans(plans) });
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return c.json({ error: "Failed to fetch plans" }, 500);
  }
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const [plan] = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.id, id))
      .limit(1);

    if (!plan) {
      return c.json({ error: "Plan not found" }, 404);
    }

    const [hydrated] = await hydratePlans([plan]);
    return c.json({ plan: hydrated });
  } catch (error) {
    console.error("Failed to fetch plan:", error);
    return c.json({ error: "Failed to fetch plan" }, 500);
  }
});

app.post("/", zValidator("json", planSchema), async (c) => {
  const data = c.req.valid("json");
  const featureList = normalizeFeatures(data.features);

  const normalizedEntitlements = normalizeEntitlements(
    data.entitlements.length > 0
      ? data.entitlements
      : buildDefaultEntitlements(data.maxPlaces ?? 0, data.maxBlogs ?? 0),
  );
  const legacyLimits = deriveLegacyLimits(
    normalizedEntitlements,
    data.maxPlaces,
    data.maxBlogs,
  );

  try {
    const created = await db.transaction(async (tx) => {
      const [newPlan] = await tx
        .insert(subscriptionPlan)
        .values({
          id: nanoid(),
          name: data.name,
          description: data.description,
          price: data.price.toString(),
          currency: data.currency,
          billingCycle: "yearly",
          maxPlaces: legacyLimits.maxPlaces,
          maxBlogs: legacyLimits.maxBlogs,
          active: data.active,
          sortOrder: data.sortOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (featureList.length > 0) {
        await tx.insert(subscriptionPlanFeature).values(
          featureList.map((feature, index) => ({
            id: nanoid(),
            planId: newPlan.id,
            label: feature,
            sortOrder: index,
          })),
        );
      }

      if (normalizedEntitlements.length > 0) {
        await tx.insert(subscriptionPlanEntitlement).values(
          normalizedEntitlements.map((item) => ({
            id: nanoid(),
            planId: newPlan.id,
            resourceKey: item.resourceKey,
            limitCount: item.limitCount,
            isUnlimited: item.isUnlimited,
          })),
        );
      }

      return newPlan;
    });

    const [plan] = await hydratePlans([created]);
    return c.json({ plan }, 201);
  } catch (error) {
    console.error("Failed to create plan:", error);
    return c.json({ error: "Failed to create plan" }, 500);
  }
});

app.put("/:id", zValidator("json", planSchema.partial()), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");

  try {
    const updatedPlan = await db.transaction(async (tx) => {
      const [existingPlan] = await tx
        .select()
        .from(subscriptionPlan)
        .where(eq(subscriptionPlan.id, id))
        .limit(1);

      if (!existingPlan) {
        return null;
      }

      const updatePayload: Partial<typeof subscriptionPlan.$inferInsert> = {
        updatedAt: new Date(),
        billingCycle: "yearly",
      };

      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.price !== undefined) updatePayload.price = data.price.toString();
      if (data.currency !== undefined) updatePayload.currency = data.currency;
      if (data.active !== undefined) updatePayload.active = data.active;
      if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

      const shouldUpdateEntitlements =
        data.entitlements !== undefined ||
        data.maxPlaces !== undefined ||
        data.maxBlogs !== undefined;

      if (shouldUpdateEntitlements) {
        const effectiveMaxPlaces = data.maxPlaces ?? existingPlan.maxPlaces ?? 0;
        const effectiveMaxBlogs = data.maxBlogs ?? existingPlan.maxBlogs ?? 0;
        const entitlementInput =
          data.entitlements ??
          buildDefaultEntitlements(effectiveMaxPlaces, effectiveMaxBlogs);

        const normalizedEntitlements = normalizeEntitlements(entitlementInput);
        const legacyLimits = deriveLegacyLimits(
          normalizedEntitlements,
          data.maxPlaces,
          data.maxBlogs,
        );

        updatePayload.maxPlaces = legacyLimits.maxPlaces;
        updatePayload.maxBlogs = legacyLimits.maxBlogs;

        await tx
          .delete(subscriptionPlanEntitlement)
          .where(eq(subscriptionPlanEntitlement.planId, id));

        if (normalizedEntitlements.length > 0) {
          await tx.insert(subscriptionPlanEntitlement).values(
            normalizedEntitlements.map((item) => ({
              id: nanoid(),
              planId: id,
              resourceKey: item.resourceKey,
              limitCount: item.limitCount,
              isUnlimited: item.isUnlimited,
            })),
          );
        }
      }

      const [plan] = await tx
        .update(subscriptionPlan)
        .set(updatePayload)
        .where(eq(subscriptionPlan.id, id))
        .returning();

      if (!plan) {
        return null;
      }

      if (data.features !== undefined) {
        const featureList = normalizeFeatures(data.features);
        await tx
          .delete(subscriptionPlanFeature)
          .where(eq(subscriptionPlanFeature.planId, id));
        if (featureList.length > 0) {
          await tx.insert(subscriptionPlanFeature).values(
            featureList.map((feature, index) => ({
              id: nanoid(),
              planId: id,
              label: feature,
              sortOrder: index,
            })),
          );
        }
      }

      return plan;
    });

    if (!updatedPlan) {
      return c.json({ error: "Plan not found" }, 404);
    }

    const [hydrated] = await hydratePlans([updatedPlan]);
    return c.json({ plan: hydrated });
  } catch (error) {
    console.error("Failed to update plan:", error);
    return c.json({ error: "Failed to update plan" }, 500);
  }
});

app.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const [deletedPlan] = await db
      .delete(subscriptionPlan)
      .where(eq(subscriptionPlan.id, id))
      .returning();

    if (!deletedPlan) {
      return c.json({ error: "Plan not found" }, 404);
    }

    return c.json({ message: "Plan deleted successfully", plan: deletedPlan });
  } catch (error) {
    console.error("Failed to delete plan:", error);
    if ((error as { code?: string }).code === "23503") {
      return c.json({ error: "Cannot delete plan with existing subscriptions" }, 400);
    }
    return c.json({ error: "Failed to delete plan" }, 500);
  }
});

export { app as plansRoutes };
