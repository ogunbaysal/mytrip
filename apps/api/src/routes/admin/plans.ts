import { Hono } from "hono";
import { db } from "../../db/index.ts";
import {
  subscriptionPlan,
  subscriptionPlanFeature,
} from "../../db/schemas/index.ts";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";

const app = new Hono();

const planSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  billingCycle: z.enum(["yearly"]).optional().default("yearly"),
  maxPlaces: z.number().int().min(0),
  maxBlogs: z.number().int().min(0),
  features: z.array(z.string().min(1)).default([]),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

type PlanRow = typeof subscriptionPlan.$inferSelect;

const normalizeFeatures = (features: string[]) =>
  Array.from(
    new Set(
      features
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0),
    ),
  );

const hydratePlansWithFeatures = async (plans: PlanRow[]) => {
  if (plans.length === 0) {
    return [];
  }

  const planIds = plans.map((plan) => plan.id);
  const featureRows = await db
    .select({
      planId: subscriptionPlanFeature.planId,
      label: subscriptionPlanFeature.label,
    })
    .from(subscriptionPlanFeature)
    .where(inArray(subscriptionPlanFeature.planId, planIds))
    .orderBy(
      asc(subscriptionPlanFeature.planId),
      asc(subscriptionPlanFeature.sortOrder),
    );

  const featureMap = new Map<string, string[]>();
  for (const row of featureRows) {
    if (!featureMap.has(row.planId)) {
      featureMap.set(row.planId, []);
    }
    featureMap.get(row.planId)!.push(row.label);
  }

  return plans.map((plan) => ({
    ...plan,
    billingCycle: "yearly" as const,
    features: featureMap.get(plan.id) ?? [],
  }));
};

/**
 * List all plans
 * GET /admin/plans
 */
app.get("/", async (c) => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.billingCycle, "yearly"))
      .orderBy(asc(subscriptionPlan.sortOrder), desc(subscriptionPlan.createdAt));

    return c.json({ plans: await hydratePlansWithFeatures(plans) });
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return c.json({ error: "Failed to fetch plans" }, 500);
  }
});

/**
 * Get a single plan
 * GET /admin/plans/:id
 */
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const [plan] = await db
      .select()
      .from(subscriptionPlan)
      .where(and(eq(subscriptionPlan.id, id), eq(subscriptionPlan.billingCycle, "yearly")))
      .limit(1);

    if (!plan) {
      return c.json({ error: "Plan not found" }, 404);
    }

    const [hydrated] = await hydratePlansWithFeatures([plan]);
    return c.json({ plan: hydrated });
  } catch (error) {
    console.error("Failed to fetch plan:", error);
    return c.json({ error: "Failed to fetch plan" }, 500);
  }
});

/**
 * Create a new plan
 * POST /admin/plans
 */
app.post("/", zValidator("json", planSchema), async (c) => {
  const data = c.req.valid("json");
  const featureList = normalizeFeatures(data.features);

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
          maxPlaces: data.maxPlaces,
          maxBlogs: data.maxBlogs,
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

      return newPlan;
    });

    const [plan] = await hydratePlansWithFeatures([created]);
    return c.json({ plan }, 201);
  } catch (error) {
    console.error("Failed to create plan:", error);
    return c.json({ error: "Failed to create plan" }, 500);
  }
});

/**
 * Update a plan
 * PUT /admin/plans/:id
 */
app.put("/:id", zValidator("json", planSchema.partial()), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");

  try {
    const updatedPlan = await db.transaction(async (tx) => {
      const updatePayload: Partial<typeof subscriptionPlan.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.price !== undefined) updatePayload.price = data.price.toString();
      if (data.currency !== undefined) updatePayload.currency = data.currency;
      if (data.maxPlaces !== undefined) updatePayload.maxPlaces = data.maxPlaces;
      if (data.maxBlogs !== undefined) updatePayload.maxBlogs = data.maxBlogs;
      if (data.active !== undefined) updatePayload.active = data.active;
      if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;
      updatePayload.billingCycle = "yearly";

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

    const [hydrated] = await hydratePlansWithFeatures([updatedPlan]);
    return c.json({ plan: hydrated });
  } catch (error) {
    console.error("Failed to update plan:", error);
    return c.json({ error: "Failed to update plan" }, 500);
  }
});

/**
 * Delete a plan
 * DELETE /admin/plans/:id
 */
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
