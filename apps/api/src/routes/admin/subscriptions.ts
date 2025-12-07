import { Hono } from "hono";
import { db } from "../../db";
import { subscription, user, subscriptionPlan } from "../../db/schemas";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { paymentProvider } from "../../lib/payment-provider";

const app = new Hono();

// Schema for manually assigning a subscription
const assignSubscriptionSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1),
  startDate: z.string().optional(), // ISO date string
});

/**
 * List all subscriptions
 * GET /admin/subscriptions
 */
app.get("/", async (c) => {
  try {
    const { status, planId } = c.req.query();
    
    let conditions = [];
    if (status) conditions.push(eq(subscription.status, status as any));
    if (planId) conditions.push(eq(subscription.planId, planId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const subscriptions = await db
      .select({
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
        plan: {
            id: subscriptionPlan.id,
            name: subscriptionPlan.name,
            price: subscriptionPlan.price,
        }
      })
      .from(subscription)
      .leftJoin(user, eq(subscription.userId, user.id))
      .leftJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
      .where(whereClause)
      .orderBy(desc(subscription.createdAt));

    return c.json({ subscriptions });
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return c.json({ error: "Failed to fetch subscriptions" }, 500);
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
 * Manually assign a subscription (Admin only override)
 * POST /admin/subscriptions
 */
app.post("/", zValidator("json", assignSubscriptionSchema), async (c) => {
    const data = c.req.valid("json");
    const { nanoid } = await import("nanoid");

    try {
        // Fetch plan details
        const [plan] = await db.select().from(subscriptionPlan).where(eq(subscriptionPlan.id, data.planId)).limit(1);
        
        if (!plan) return c.json({ error: "Plan not found" }, 404);

        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = new Date(startDate);
        
        // Calculate end date based on billing cycle
        if (plan.billingCycle === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        else if (plan.billingCycle === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
        else if (plan.billingCycle === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);

        const [newSub] = await db.insert(subscription).values({
            id: nanoid(),
            userId: data.userId,
            planId: data.planId,
            status: 'active',
            price: plan.price.toString(),
            currency: plan.currency,
            billingCycle: plan.billingCycle,
            startDate: startDate.toISOString().split('T')[0], // Cast to date string YYYY-MM-DD
            endDate: endDate.toISOString().split('T')[0],
            paymentMethod: JSON.stringify({ type: 'manual_admin' }),
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        // Update user status
        await db.update(user).set({ subscriptionStatus: 'active' }).where(eq(user.id, data.userId));

        return c.json({ subscription: newSub }, 201);

    } catch (error) {
        console.error("Failed to assign subscription:", error);
        return c.json({ error: "Failed to assign subscription" }, 500);
    }
});

export { app as subscriptionsRoutes };
