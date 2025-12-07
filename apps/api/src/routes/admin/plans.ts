import { Hono } from "hono";
import { db } from "../../db";
import { subscriptionPlan } from "../../db/schemas";
import { eq, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const app = new Hono();

// Schema for creating/updating a plan
const planSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]),
  features: z.array(z.string()).optional(), // Expecting array of strings from frontend
  limits: z.record(z.any()).optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

/**
 * List all plans
 * GET /admin/plans
 */
app.get("/", async (c) => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlan)
      .orderBy(asc(subscriptionPlan.sortOrder), desc(subscriptionPlan.createdAt));

    // Parse features JSON string to array if needed
    const plansWithParsedFeatures = plans.map(p => ({
        ...p,
        features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features,
        limits: typeof p.limits === 'string' ? JSON.parse(p.limits) : p.limits
    }));

    return c.json({ plans: plansWithParsedFeatures });
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
      .where(eq(subscriptionPlan.id, id))
      .limit(1);

    if (!plan) {
      return c.json({ error: "Plan not found" }, 404);
    }
    
    const parsedPlan = {
        ...plan,
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
        limits: typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits
    };

    return c.json({ plan: parsedPlan });
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
  const { nanoid } = await import("nanoid");

  try {
    const [newPlan] = await db
      .insert(subscriptionPlan)
      .values({
        id: nanoid(),
        ...data,
        price: data.price.toString(), // Drizzle numeric is string
        features: data.features ? JSON.stringify(data.features) : undefined,
        limits: data.limits ? JSON.stringify(data.limits) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return c.json({ plan: newPlan }, 201);
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
    const [updatedPlan] = await db
      .update(subscriptionPlan)
      .set({
        ...data,
        price: data.price ? data.price.toString() : undefined,
         features: data.features ? JSON.stringify(data.features) : undefined,
        limits: data.limits ? JSON.stringify(data.limits) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlan.id, id))
      .returning();

    if (!updatedPlan) {
      return c.json({ error: "Plan not found" }, 404);
    }

    return c.json({ plan: updatedPlan });
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
    // Check if plan has active subscriptions?
    // For now, just delete. Foreign key constraints might stop it if subscriptions exist.
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
    // Likely FK violation
    if ((error as any).code === '23503') { // Postgres generic FK violation code usually
         return c.json({ error: "Cannot delete plan with existing subscriptions" }, 400);
    }
    return c.json({ error: "Failed to delete plan" }, 500);
  }
});

export { app as plansRoutes };
