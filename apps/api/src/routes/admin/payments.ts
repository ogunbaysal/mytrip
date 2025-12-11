import { Hono } from "hono";
import { db } from "../../db/index.ts";
import { payment, user, subscription, subscriptionPlan } from "../../db/schemas/index.ts";
import { eq, desc } from "drizzle-orm";

const app = new Hono();

/**
 * List all payments
 * GET /admin/payments
 */
app.get("/", async (c) => {
  try {
    const payments = await db
      .select({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        date: payment.createdAt,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
        },
        plan: {
            name: subscriptionPlan.name,
        }
      })
      .from(payment)
      .leftJoin(user, eq(payment.userId, user.id))
      .leftJoin(subscription, eq(payment.subscriptionId, subscription.id))
      .leftJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
      .orderBy(desc(payment.createdAt));

    return c.json({ payments });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return c.json({ error: "Failed to fetch payments" }, 500);
  }
});

export { app as paymentsRoutes };
