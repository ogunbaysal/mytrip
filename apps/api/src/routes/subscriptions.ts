import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.ts";
import {
  subscription,
  subscriptionPlan,
  user,
  place,
  blogPost,
} from "../db/schemas/index.ts";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { getSessionFromRequest } from "../lib/session.ts";
import { paymentProvider } from "../lib/payment-provider.ts";

const app = new Hono();

const createSubscriptionSchema = z.object({
  planId: z.string().min(1),
  paymentMethod: z.object({
    type: z.enum(["credit_card"]),
    cardHolderName: z.string().min(2),
    cardNumber: z.string().min(16).max(19),
    expireMonth: z.string().min(2).max(2),
    expireYear: z.string().min(2).max(2),
    cvc: z.string().min(3).max(4),
  }),
});

app.get("/plans", async (c) => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.active, true))
      .orderBy(subscriptionPlan.sortOrder, desc(subscriptionPlan.createdAt));

    const plansWithParsedData = plans.map((plan) => ({
      ...plan,
      features:
        typeof plan.features === "string"
          ? JSON.parse(plan.features)
          : plan.features,
      limits:
        typeof plan.limits === "string" ? JSON.parse(plan.limits) : plan.limits,
    }));

    return c.json({ plans: plansWithParsedData });
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return c.json({ error: "Failed to fetch plans" }, 500);
  }
});

app.get("/current", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;

    const [currentSub] = await db
      .select({
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        cancelledAt: subscription.cancelledAt,
        planId: subscription.planId,
        planName: subscriptionPlan.name,
        planDescription: subscriptionPlan.description,
        planPrice: subscriptionPlan.price,
        planCurrency: subscriptionPlan.currency,
        planBillingCycle: subscriptionPlan.billingCycle,
        planFeatures: subscriptionPlan.features,
        planLimits: subscriptionPlan.limits,
      })
      .from(subscription)
      .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
      .where(eq(subscription.userId, userId))
      .orderBy(desc(subscription.createdAt))
      .limit(1);

    if (!currentSub) {
      return c.json({ subscription: null, hasSubscription: false });
    }

    const planLimits =
      typeof currentSub.planLimits === "string"
        ? JSON.parse(currentSub.planLimits)
        : currentSub.planLimits;
    const planFeatures =
      typeof currentSub.planFeatures === "string"
        ? JSON.parse(currentSub.planFeatures)
        : currentSub.planFeatures;

    return c.json({
      subscription: {
        ...currentSub,
        planLimits,
        planFeatures,
      },
      hasSubscription: true,
    });
  } catch (error) {
    console.error("Failed to get current subscription:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/create", zValidator("json", createSubscriptionSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const { planId, paymentMethod } = c.req.valid("json");
    const { nanoid } = await import("nanoid");

    const [plan] = await db
      .select()
      .from(subscriptionPlan)
      .where(
        and(eq(subscriptionPlan.id, planId), eq(subscriptionPlan.active, true)),
      )
      .limit(1);

    if (!plan) {
      return c.json({ error: "Plan not found or inactive" }, 404);
    }

    const startDate = new Date();
    const endDate = new Date(startDate);

    switch (plan.billingCycle) {
      case "monthly":
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case "quarterly":
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case "yearly":
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    const nextBillingDate = new Date(endDate);

    const paymentResult = await paymentProvider.createSubscription({
      userId,
      planId,
      price: parseFloat(plan.price.toString()),
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      paymentCard: paymentMethod,
    });

    if (paymentResult.status === "failed") {
      return c.json(
        {
          error: "Payment failed",
          message: "Ödeme işleminiz başarısız oldu. Lütfen tekrar deneyiniz.",
        },
        400,
      );
    }

    const [newSubscription] = await db
      .insert(subscription)
      .values({
        id: nanoid(),
        userId,
        planId,
        status: "active",
        provider: "mock",
        providerSubscriptionId: paymentResult.providerSubscriptionId,
        price: plan.price.toString(),
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        nextBillingDate: nextBillingDate.toISOString().split("T")[0],
        paymentMethod: JSON.stringify({
          type: "credit_card",
          lastFour: paymentMethod.cardNumber.slice(-4),
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db
      .update(user)
      .set({
        role: "owner",
        subscriptionStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    // Return fresh user data to update session
    const [updatedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return c.json(
      {
        success: true,
        message: "Aboneliğiniz başarıyla oluşturuldu",
        subscriptionId: newSubscription.id,
        subscription: {
          ...newSubscription,
          plan,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Create subscription error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", issues: error.issues }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/cancel", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;

    const [activeSub] = await db
      .select()
      .from(subscription)
      .where(
        and(eq(subscription.userId, userId), eq(subscription.status, "active")),
      )
      .limit(1);

    if (!activeSub) {
      return c.json({ error: "No active subscription found" }, 404);
    }

    if (activeSub.providerSubscriptionId) {
      await paymentProvider.cancelSubscription(
        activeSub.providerSubscriptionId,
      );
    }

    await db
      .update(subscription)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, activeSub.id));

    return c.json({
      success: true,
      message: "Aboneliğiniz başarıyla iptal edildi",
      endDate: activeSub.endDate,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/usage", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;

    const [subscriptionData] = await db
      .select({
        id: subscription.id,
        status: subscription.status,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        planId: subscription.planId,
        planLimits: subscriptionPlan.limits,
      })
      .from(subscription)
      .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
      .where(eq(subscription.userId, userId))
      .orderBy(desc(subscription.createdAt))
      .limit(1);

    if (!subscriptionData) {
      return c.json(
        {
          error: "No subscription found",
          message: "Lütfen abonelik planı seçiniz",
        },
        404,
      );
    }

    const planLimits =
      typeof subscriptionData.planLimits === "string"
        ? JSON.parse(subscriptionData.planLimits)
        : subscriptionData.planLimits;

    const [placeCount] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(place)
      .where(eq(place.ownerId, userId));

    const [blogCount] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(blogPost)
      .where(eq(blogPost.authorId, userId));

    return c.json({
      usage: {
        places: {
          current: placeCount.count,
          max: planLimits?.maxPlaces || 0,
        },
        blogs: {
          current: blogCount.count,
          max: planLimits?.maxBlogs || 0,
        },
      },
      subscription: {
        status: subscriptionData.status,
        endDate: subscriptionData.endDate,
        nextBillingDate: subscriptionData.nextBillingDate,
        planId: subscriptionData.planId,
      },
    });
  } catch (error) {
    console.error("Get usage error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { app as subscriptionRoutes };
