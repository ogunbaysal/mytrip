import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/index.ts";
import {
  blogPost,
  coupon,
  couponPlan,
  couponRedemption,
  payment,
  place,
  subscription,
  subscriptionPlan,
  subscriptionPlanFeature,
  user,
} from "../db/schemas/index.ts";
import { getSessionFromRequest } from "../lib/session.ts";
import { paymentProvider } from "../lib/payment-provider.ts";

const app = new Hono();

const paymentMethodSchema = z.object({
  type: z.enum(["credit_card"]),
  cardHolderName: z.string().min(2),
  cardNumber: z.string().min(16).max(19),
  expireMonth: z.string().min(2).max(2),
  expireYear: z.string().min(2).max(2),
  cvc: z.string().min(3).max(4),
});

const createSubscriptionSchema = z.object({
  planId: z.string().min(1),
  couponCode: z.string().trim().min(1).optional(),
  paymentMethod: paymentMethodSchema.optional(),
});

const validateCouponSchema = z.object({
  planId: z.string().min(1),
  code: z.string().trim().min(1),
});

type PlanRow = typeof subscriptionPlan.$inferSelect;
type CouponRow = typeof coupon.$inferSelect;

const normalizeCode = (code: string) => code.trim().toUpperCase();
const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const parseNumeric = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number.parseFloat(value);
};

const hydratePlansWithFeatures = async (plans: PlanRow[]) => {
  if (plans.length === 0) {
    return [];
  }

  const planIds = plans.map((plan) => plan.id);
  const features = await db
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
  for (const feature of features) {
    if (!featureMap.has(feature.planId)) {
      featureMap.set(feature.planId, []);
    }
    featureMap.get(feature.planId)!.push(feature.label);
  }

  return plans.map((plan) => {
    const planFeatures = featureMap.get(plan.id) ?? [];
    const limits = {
      maxPlaces: plan.maxPlaces,
      maxBlogs: plan.maxBlogs,
    };
    return {
      ...plan,
      billingCycle: "yearly" as const,
      features: planFeatures,
      limits,
    };
  });
};

const calculateCouponDiscount = ({
  basePrice,
  discountType,
  discountValue,
}: {
  basePrice: number;
  discountType: CouponRow["discountType"];
  discountValue: number;
}) => {
  if (discountType === "percent") {
    return roundCurrency((basePrice * discountValue) / 100);
  }

  return roundCurrency(Math.min(basePrice, discountValue));
};

const validateCouponForUser = async ({
  code,
  planId,
  userId,
  basePrice,
}: {
  code: string;
  planId: string;
  userId: string;
  basePrice: number;
}) => {
  const normalizedCode = normalizeCode(code);
  const now = new Date();

  const [couponData] = await db
    .select()
    .from(coupon)
    .where(eq(coupon.code, normalizedCode))
    .limit(1);

  if (!couponData || !couponData.active) {
    return { valid: false as const, error: "Geçersiz kupon kodu" };
  }

  if (couponData.startsAt && now < new Date(couponData.startsAt)) {
    return { valid: false as const, error: "Kupon henüz aktif değil" };
  }

  if (couponData.endsAt && now > new Date(couponData.endsAt)) {
    return { valid: false as const, error: "Kuponun süresi dolmuş" };
  }

  if (couponData.scope === "specific_plans") {
    const [allowedPlan] = await db
      .select({ id: couponPlan.id })
      .from(couponPlan)
      .where(and(eq(couponPlan.couponId, couponData.id), eq(couponPlan.planId, planId)))
      .limit(1);

    if (!allowedPlan) {
      return {
        valid: false as const,
        error: "Kupon bu plan için geçerli değil",
      };
    }
  }

  if (couponData.maxRedemptions !== null) {
    const [totalUsage] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(couponRedemption)
      .where(eq(couponRedemption.couponId, couponData.id));

    if ((totalUsage?.count ?? 0) >= couponData.maxRedemptions) {
      return { valid: false as const, error: "Kupon kullanım limiti doldu" };
    }
  }

  const [perUserUsage] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(couponRedemption)
    .where(
      and(
        eq(couponRedemption.couponId, couponData.id),
        eq(couponRedemption.userId, userId),
      ),
    );

  if ((perUserUsage?.count ?? 0) >= couponData.maxRedemptionsPerUser) {
    return {
      valid: false as const,
      error: "Bu kuponu kullanım hakkınız doldu",
    };
  }

  const discountValue = parseNumeric(couponData.discountValue);
  const discountAmount = calculateCouponDiscount({
    basePrice,
    discountType: couponData.discountType,
    discountValue,
  });
  const finalPrice = roundCurrency(Math.max(0, basePrice - discountAmount));

  return {
    valid: true as const,
    coupon: couponData,
    discountAmount,
    finalPrice,
    normalizedCode,
  };
};

/**
 * GET /subscriptions/plans
 */
app.get("/plans", async (c) => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlan)
      .where(
        and(
          eq(subscriptionPlan.active, true),
          eq(subscriptionPlan.billingCycle, "yearly"),
        ),
      )
      .orderBy(subscriptionPlan.sortOrder, desc(subscriptionPlan.createdAt));

    return c.json({ plans: await hydratePlansWithFeatures(plans) });
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return c.json({ error: "Failed to fetch plans" }, 500);
  }
});

/**
 * GET /subscriptions/current
 */
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
      })
      .from(subscription)
      .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
      .where(eq(subscription.userId, userId))
      .orderBy(desc(subscription.createdAt))
      .limit(1);

    if (!currentSub) {
      return c.json({ subscription: null, hasSubscription: false });
    }

    const [featureRows] = await Promise.all([
      db
        .select({ label: subscriptionPlanFeature.label })
        .from(subscriptionPlanFeature)
        .where(eq(subscriptionPlanFeature.planId, currentSub.planId))
        .orderBy(asc(subscriptionPlanFeature.sortOrder)),
    ]);

    const planFeatures = featureRows.map((item) => item.label);
    const planLimits = {
      maxPlaces: currentSub.planMaxPlaces,
      maxBlogs: currentSub.planMaxBlogs,
    };

    return c.json({
      subscription: {
        ...currentSub,
        planFeatures,
        planLimits,
      },
      hasSubscription: true,
    });
  } catch (error) {
    console.error("Failed to get current subscription:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * POST /subscriptions/coupons/validate
 */
app.post("/coupons/validate", zValidator("json", validateCouponSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { planId, code } = c.req.valid("json");
    const userId = session.user.id;

    const [plan] = await db
      .select()
      .from(subscriptionPlan)
      .where(
        and(
          eq(subscriptionPlan.id, planId),
          eq(subscriptionPlan.active, true),
          eq(subscriptionPlan.billingCycle, "yearly"),
        ),
      )
      .limit(1);

    if (!plan) {
      return c.json({ error: "Plan not found or inactive" }, 404);
    }

    const basePrice = parseNumeric(plan.price);
    const validation = await validateCouponForUser({
      code,
      planId,
      userId,
      basePrice,
    });

    if (!validation.valid) {
      return c.json({ valid: false, error: validation.error }, 400);
    }

    return c.json({
      valid: true,
      coupon: {
        id: validation.coupon.id,
        code: validation.coupon.code,
        discountType: validation.coupon.discountType,
        discountValue: validation.coupon.discountValue,
      },
      pricing: {
        basePrice,
        discountAmount: validation.discountAmount,
        finalPrice: validation.finalPrice,
        currency: plan.currency,
      },
    });
  } catch (error) {
    console.error("Coupon validation failed:", error);
    return c.json({ error: "Coupon validation failed" }, 500);
  }
});

/**
 * POST /subscriptions/create
 */
app.post("/create", zValidator("json", createSubscriptionSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const { planId, couponCode, paymentMethod } = c.req.valid("json");

    const [plan] = await db
      .select()
      .from(subscriptionPlan)
      .where(
        and(
          eq(subscriptionPlan.id, planId),
          eq(subscriptionPlan.active, true),
          eq(subscriptionPlan.billingCycle, "yearly"),
        ),
      )
      .limit(1);

    if (!plan) {
      return c.json({ error: "Plan not found or inactive" }, 404);
    }

    const [existingActiveSubscription] = await db
      .select({
        id: subscription.id,
        status: subscription.status,
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

    if (existingActiveSubscription) {
      return c.json(
        {
          error: "Active subscription exists",
          message:
            "Zaten aktif bir aboneliğiniz var. Checkout sayfasına tekrar erişemezsiniz.",
        },
        409,
      );
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    const nextBillingDate = new Date(endDate);

    const basePrice = parseNumeric(plan.price);
    let discountAmount = 0;
    let finalPrice = basePrice;
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;

    if (couponCode) {
      const validation = await validateCouponForUser({
        code: couponCode,
        planId,
        userId,
        basePrice,
      });

      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }

      discountAmount = validation.discountAmount;
      finalPrice = validation.finalPrice;
      appliedCouponId = validation.coupon.id;
      appliedCouponCode = validation.normalizedCode;
    }

    if (finalPrice > 0 && !paymentMethod) {
      return c.json(
        { error: "Payment method is required when payable amount is above zero" },
        400,
      );
    }

    let providerSubscriptionId: string | null = null;
    if (finalPrice > 0 && paymentMethod) {
      const paymentResult = await paymentProvider.createSubscription({
        userId,
        planId,
        price: finalPrice,
        currency: plan.currency,
        billingCycle: "yearly",
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

      providerSubscriptionId = paymentResult.providerSubscriptionId;
    }

    const [newSubscription] = await db
      .insert(subscription)
      .values({
        id: nanoid(),
        userId,
        planId,
        status: "active",
        provider: "mock",
        providerSubscriptionId,
        basePrice: basePrice.toString(),
        discountAmount: discountAmount.toString(),
        price: finalPrice.toString(),
        couponId: appliedCouponId,
        couponCode: appliedCouponCode,
        currency: plan.currency,
        billingCycle: "yearly",
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        nextBillingDate: nextBillingDate.toISOString().split("T")[0],
        paymentMethod:
          finalPrice > 0 && paymentMethod
            ? JSON.stringify({
                type: "credit_card",
                lastFour: paymentMethod.cardNumber.slice(-4),
              })
            : JSON.stringify({
                type: "coupon",
                code: appliedCouponCode,
              }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(payment).values({
      id: nanoid(),
      subscriptionId: newSubscription.id,
      userId,
      provider: "mock",
      amount: finalPrice.toString(),
      currency: plan.currency,
      status: "success",
      paymentMethod:
        finalPrice > 0 && paymentMethod
          ? JSON.stringify({
              type: "credit_card",
              lastFour: paymentMethod.cardNumber.slice(-4),
            })
          : JSON.stringify({
              type: "coupon",
              code: appliedCouponCode,
            }),
      gatewayResponse: JSON.stringify({
        status: "success",
        source: finalPrice > 0 ? "payment_provider" : "coupon",
      }),
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (appliedCouponId) {
      await db.insert(couponRedemption).values({
        id: nanoid(),
        couponId: appliedCouponId,
        userId,
        subscriptionId: newSubscription.id,
        planId: plan.id,
        discountAmount: discountAmount.toString(),
        finalAmount: finalPrice.toString(),
        currency: plan.currency,
        redeemedAt: new Date(),
      });
    }

    await db
      .update(user)
      .set({
        role: "owner",
        subscriptionStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    const [hydratedPlan] = await hydratePlansWithFeatures([plan]);

    return c.json(
      {
        success: true,
        message: "Aboneliğiniz başarıyla oluşturuldu",
        subscriptionId: newSubscription.id,
        subscription: {
          ...newSubscription,
          plan: hydratedPlan,
          coupon: appliedCouponCode
            ? {
                code: appliedCouponCode,
                discountAmount,
              }
            : null,
          pricing: {
            basePrice,
            discountAmount,
            finalPrice,
            currency: plan.currency,
          },
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

/**
 * POST /subscriptions/cancel
 */
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
      await paymentProvider.cancelSubscription(activeSub.providerSubscriptionId);
    }

    await db
      .update(subscription)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, activeSub.id));

    await db
      .update(user)
      .set({
        subscriptionStatus: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

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

/**
 * GET /subscriptions/usage
 */
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
        planMaxPlaces: subscriptionPlan.maxPlaces,
        planMaxBlogs: subscriptionPlan.maxBlogs,
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

    const [placeCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(place)
      .where(eq(place.ownerId, userId));

    const [blogCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(blogPost)
      .where(eq(blogPost.authorId, userId));

    return c.json({
      usage: {
        places: {
          current: placeCount.count,
          max: subscriptionData.planMaxPlaces,
        },
        blogs: {
          current: blogCount.count,
          max: subscriptionData.planMaxBlogs,
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
