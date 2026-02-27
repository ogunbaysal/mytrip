import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/index.ts";
import {
  businessRegistration,
  coupon,
  couponPlan,
  couponRedemption,
  payment,
  subscription,
  subscriptionPlan,
  subscriptionPlanFeature,
  user,
} from "../db/schemas/index.ts";
import {
  getCurrentUsageByResource,
  getEntitlementsForPlan,
  getLatestSubscriptionForUser,
  hydratePlansWithFeaturesAndEntitlements,
} from "../lib/plan-entitlements.ts";
import { getSessionFromRequest } from "../lib/session.ts";
import {
  type CreateSubscriptionParams,
  paymentProvider,
} from "../lib/payment-provider.ts";
import {
  type IyzicoSubscriptionWebhookPayload,
  verifyIyzicoSubscriptionWebhookSignature,
} from "../lib/iyzico-webhook.ts";

const app = new Hono();

const paymentMethodSchema = z.object({
  type: z.enum(["credit_card"]),
  cardHolderName: z.string().min(2),
  cardNumber: z.string().min(16).max(19),
  expireMonth: z.string().min(2).max(2),
  expireYear: z.string().min(2).max(2),
  cvc: z.string().min(3).max(4),
});

const iyzicoAddressSchema = z.object({
  address: z.string().trim().min(3),
  zipCode: z.string().trim().min(2),
  contactName: z.string().trim().min(2),
  city: z.string().trim().min(2),
  country: z.string().trim().min(2),
  district: z.string().trim().min(2),
});

const iyzicoCustomerSchema = z.object({
  name: z.string().trim().min(1).optional(),
  surname: z.string().trim().min(1).optional(),
  identityNumber: z.string().trim().min(10).max(20).optional(),
  email: z.string().trim().email().optional(),
  gsmNumber: z.string().trim().min(10).max(20).optional(),
  billingAddress: iyzicoAddressSchema.optional(),
  shippingAddress: iyzicoAddressSchema.optional(),
});

const createSubscriptionSchema = z.object({
  planId: z.string().min(1),
  couponCode: z.string().trim().min(1).optional(),
  paymentMethod: paymentMethodSchema.optional(),
  customer: iyzicoCustomerSchema.optional(),
});

const validateCouponSchema = z.object({
  planId: z.string().min(1),
  code: z.string().trim().min(1),
});

type CouponRow = typeof coupon.$inferSelect;

const normalizeCode = (code: string) => code.trim().toUpperCase();
const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const parseNumeric = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number.parseFloat(value);
};

const toAddressString = (value: string | null | undefined) => value?.trim() || null;

const sanitizeCardNumber = (value: string) => value.replace(/\s+/g, "");

const normalizePhoneNumber = (value: string | null | undefined) => {
  if (!value) return null;

  const normalized = value.replace(/[^\d+]/g, "");
  if (normalized.startsWith("+")) {
    return normalized;
  }

  if (normalized.startsWith("90")) {
    return `+${normalized}`;
  }

  if (normalized.startsWith("0")) {
    return `+9${normalized}`;
  }

  return `+${normalized}`;
};

const splitName = (fullName: string | null | undefined) => {
  const fallback = {
    name: "Guest",
    surname: "User",
  };

  if (!fullName?.trim()) {
    return fallback;
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return fallback;
  }

  if (parts.length === 1) {
    return { name: parts[0], surname: "User" };
  }

  return {
    name: parts[0],
    surname: parts.slice(1).join(" "),
  };
};

const buildIyzicoCustomerPayload = ({
  userName,
  userEmail,
  userPhone,
  registrationTaxId,
  registrationAddress,
  registrationPhone,
  requestCustomer,
}: {
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  registrationTaxId: string | null;
  registrationAddress: string | null;
  registrationPhone: string | null;
  requestCustomer: z.infer<typeof iyzicoCustomerSchema> | undefined;
}): {
  customer: CreateSubscriptionParams["customer"] | null;
  missingFields: string[];
} => {
  const defaultCountry = process.env.IYZICO_DEFAULT_COUNTRY?.trim() || "Turkey";
  const defaultCity = process.env.IYZICO_DEFAULT_CITY?.trim() || "Istanbul";
  const defaultDistrict = process.env.IYZICO_DEFAULT_DISTRICT?.trim() || "Kadikoy";
  const defaultZipCode = process.env.IYZICO_DEFAULT_ZIP_CODE?.trim() || "34742";
  const defaultAddress =
    process.env.IYZICO_DEFAULT_ADDRESS?.trim() ||
    "Nidakule Goztepe, Merdivenkoy Mah. Bora Sok. No:1";
  const defaultIdentity =
    process.env.IYZICO_DEFAULT_IDENTITY_NUMBER?.trim() || "11111111111";
  const defaultGsm = normalizePhoneNumber(process.env.IYZICO_DEFAULT_GSM_NUMBER?.trim());

  const fallbackFullName = splitName(userName);
  const resolvedName = requestCustomer?.name || fallbackFullName.name;
  const resolvedSurname = requestCustomer?.surname || fallbackFullName.surname;
  const resolvedContactName = `${resolvedName} ${resolvedSurname}`.trim();
  const resolvedEmail = requestCustomer?.email || userEmail || null;
  const resolvedIdentity =
    requestCustomer?.identityNumber || registrationTaxId || defaultIdentity;
  const resolvedGsm =
    normalizePhoneNumber(requestCustomer?.gsmNumber) ||
    normalizePhoneNumber(registrationPhone) ||
    normalizePhoneNumber(userPhone) ||
    defaultGsm ||
    null;
  const resolvedAddressLine =
    requestCustomer?.billingAddress?.address ||
    toAddressString(registrationAddress) ||
    defaultAddress;

  const billingAddress = requestCustomer?.billingAddress ?? {
    address: resolvedAddressLine,
    zipCode: defaultZipCode,
    contactName: resolvedContactName,
    city: defaultCity,
    country: defaultCountry,
    district: defaultDistrict,
  };

  const shippingAddress = requestCustomer?.shippingAddress ?? {
    ...billingAddress,
    contactName:
      requestCustomer?.shippingAddress?.contactName ||
      billingAddress.contactName ||
      resolvedContactName,
  };

  const missingFields = [
    !resolvedName ? "customer.name" : null,
    !resolvedSurname ? "customer.surname" : null,
    !resolvedIdentity ? "customer.identityNumber" : null,
    !resolvedEmail ? "customer.email" : null,
    !resolvedGsm ? "customer.gsmNumber" : null,
    !billingAddress.address ? "customer.billingAddress.address" : null,
    !billingAddress.city ? "customer.billingAddress.city" : null,
    !billingAddress.country ? "customer.billingAddress.country" : null,
    !billingAddress.district ? "customer.billingAddress.district" : null,
    !shippingAddress.address ? "customer.shippingAddress.address" : null,
    !shippingAddress.city ? "customer.shippingAddress.city" : null,
    !shippingAddress.country ? "customer.shippingAddress.country" : null,
    !shippingAddress.district ? "customer.shippingAddress.district" : null,
  ].filter((field): field is string => Boolean(field));

  if (missingFields.length > 0 || !resolvedEmail || !resolvedGsm) {
    return {
      customer: null,
      missingFields,
    };
  }

  return {
    customer: {
      name: resolvedName,
      surname: resolvedSurname,
      identityNumber: resolvedIdentity,
      email: resolvedEmail,
      gsmNumber: resolvedGsm,
      billingAddress,
      shippingAddress,
    },
    missingFields: [],
  };
};

const parseWebhookTimestamp = (value: number | null | undefined) => {
  if (!value || !Number.isFinite(value)) return new Date();

  // Iyzi event time can arrive in seconds or milliseconds depending on integration mode.
  if (value > 1_000_000_000_000) {
    return new Date(value);
  }

  return new Date(value * 1000);
};

const formatDateOnly = (date: Date) => date.toISOString().split("T")[0];

const addBillingCycle = (
  date: Date,
  billingCycle: "monthly" | "quarterly" | "yearly",
) => {
  const next = new Date(date);
  if (billingCycle === "monthly") {
    next.setMonth(next.getMonth() + 1);
    return next;
  }
  if (billingCycle === "quarterly") {
    next.setMonth(next.getMonth() + 3);
    return next;
  }
  next.setFullYear(next.getFullYear() + 1);
  return next;
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
 * POST /subscriptions/webhook/iyzico
 */
app.post("/webhook/iyzico", async (c) => {
  try {
    const payload = (await c.req.json()) as IyzicoSubscriptionWebhookPayload &
      Record<string, unknown>;
    const eventType = payload.iyziEventType || payload.eventType || "";
    const subscriptionReferenceCode = payload.subscriptionReferenceCode?.trim() || "";
    const orderReferenceCode = payload.orderReferenceCode?.trim() || "";
    const providerTransactionId =
      orderReferenceCode || payload.iyziReferenceCode?.trim() || null;
    const eventDate = parseWebhookTimestamp(payload.iyziEventTime ?? null);
    const receivedSignature =
      c.req.header("x-iyz-signature-v3") || c.req.header("X-IYZ-SIGNATURE-V3") || "";

    if (!eventType || !subscriptionReferenceCode) {
      return c.json(
        {
          error: "Invalid webhook payload",
          message: "eventType and subscriptionReferenceCode are required",
        },
        400,
      );
    }

    const allowUnsigned = process.env.IYZICO_WEBHOOK_ALLOW_UNSIGNED === "true";
    const secretKey = process.env.IYZICO_SECRET_KEY?.trim() || "";
    const merchantId =
      payload.merchantId?.trim() || process.env.IYZICO_MERCHANT_ID?.trim() || "";

    if (!allowUnsigned) {
      if (!secretKey || !merchantId) {
        return c.json(
          {
            error: "Webhook verification misconfigured",
            message:
              "IYZICO_SECRET_KEY and IYZICO_MERCHANT_ID are required for signature verification",
          },
          500,
        );
      }

      if (!receivedSignature) {
        return c.json({ error: "Missing webhook signature" }, 401);
      }

      const verified = verifyIyzicoSubscriptionWebhookSignature({
        merchantId,
        secretKey,
        payload,
        signature: receivedSignature,
      });

      if (!verified) {
        return c.json({ error: "Invalid webhook signature" }, 401);
      }
    }

    if (
      eventType !== "subscription.order.success" &&
      eventType !== "subscription.order.failure"
    ) {
      return c.json({
        received: true,
        ignored: true,
        reason: "unsupported_event",
        eventType,
      });
    }

    const [targetSubscription] = await db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        status: subscription.status,
        price: subscription.price,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        paymentMethod: subscription.paymentMethod,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
      })
      .from(subscription)
      .where(eq(subscription.providerSubscriptionId, subscriptionReferenceCode))
      .limit(1);

    if (!targetSubscription) {
      return c.json({
        received: true,
        ignored: true,
        reason: "subscription_not_found",
        subscriptionReferenceCode,
      });
    }

    if (providerTransactionId) {
      const [existingPayment] = await db
        .select({ id: payment.id })
        .from(payment)
        .where(
          and(
            eq(payment.subscriptionId, targetSubscription.id),
            eq(payment.providerTransactionId, providerTransactionId),
          ),
        )
        .limit(1);

      if (existingPayment) {
        return c.json({
          received: true,
          duplicate: true,
          paymentId: existingPayment.id,
        });
      }
    }

    const isSuccess = eventType === "subscription.order.success";
    const paymentStatus = isSuccess ? "success" : "failed";

    await db.insert(payment).values({
      id: nanoid(),
      subscriptionId: targetSubscription.id,
      userId: targetSubscription.userId,
      provider: "iyzico",
      providerTransactionId,
      amount: targetSubscription.price,
      currency: targetSubscription.currency,
      status: paymentStatus,
      paymentMethod: targetSubscription.paymentMethod,
      gatewayResponse: JSON.stringify(payload),
      paidAt: isSuccess ? eventDate : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let nextSubscriptionStatus = targetSubscription.status;
    let nextEndDate = targetSubscription.endDate;
    let nextBillingDate = targetSubscription.nextBillingDate;

    if (isSuccess) {
      nextSubscriptionStatus = "active";
      if (targetSubscription.nextBillingDate) {
        const currentNextBillingDate = new Date(targetSubscription.nextBillingDate);
        const renewalThreshold = new Date(currentNextBillingDate);
        renewalThreshold.setDate(renewalThreshold.getDate() - 3);

        if (eventDate >= renewalThreshold) {
          const renewedUntil = addBillingCycle(
            currentNextBillingDate,
            targetSubscription.billingCycle,
          );
          nextEndDate = formatDateOnly(renewedUntil);
          nextBillingDate = formatDateOnly(renewedUntil);
        }
      } else {
        const baseDate = targetSubscription.endDate
          ? new Date(targetSubscription.endDate)
          : eventDate;
        const renewedUntil = addBillingCycle(baseDate, targetSubscription.billingCycle);
        nextEndDate = formatDateOnly(renewedUntil);
        nextBillingDate = formatDateOnly(renewedUntil);
      }
    } else if (targetSubscription.status !== "active") {
      nextSubscriptionStatus = "pending";
    }

    await db
      .update(subscription)
      .set({
        status: nextSubscriptionStatus,
        endDate: nextEndDate,
        nextBillingDate: nextBillingDate,
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, targetSubscription.id));

    await db
      .update(user)
      .set({
        subscriptionStatus: nextSubscriptionStatus,
        updatedAt: new Date(),
      })
      .where(eq(user.id, targetSubscription.userId));

    return c.json({
      received: true,
      processed: true,
      eventType,
      subscriptionId: targetSubscription.id,
      providerSubscriptionId: subscriptionReferenceCode,
    });
  } catch (error) {
    console.error("Iyzico webhook error:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

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

    return c.json({
      plans: await hydratePlansWithFeaturesAndEntitlements(plans),
    });
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
    const currentSub = await getLatestSubscriptionForUser(userId);

    if (!currentSub) {
      return c.json({ subscription: null, hasSubscription: false });
    }

    const [featureRows, planEntitlements] = await Promise.all([
      db
        .select({ label: subscriptionPlanFeature.label })
        .from(subscriptionPlanFeature)
        .where(eq(subscriptionPlanFeature.planId, currentSub.planId))
        .orderBy(asc(subscriptionPlanFeature.sortOrder)),
      getEntitlementsForPlan(currentSub.planId),
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
        planEntitlements,
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
    const { planId, couponCode, paymentMethod, customer } = c.req.valid("json");

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

    const [[subscriberProfile], [latestBusinessRegistration]] = await Promise.all([
      db
        .select({
          name: user.name,
          email: user.email,
          phone: user.phone,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1),
      db
        .select({
          taxId: businessRegistration.taxId,
          businessAddress: businessRegistration.businessAddress,
          contactPhone: businessRegistration.contactPhone,
        })
        .from(businessRegistration)
        .where(eq(businessRegistration.userId, userId))
        .orderBy(desc(businessRegistration.updatedAt))
        .limit(1),
    ]);

    if (!subscriberProfile) {
      return c.json({ error: "User not found" }, 404);
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

    const sanitizedPaymentMethod =
      finalPrice > 0 && paymentMethod
        ? {
            cardHolderName: paymentMethod.cardHolderName,
            cardNumber: sanitizeCardNumber(paymentMethod.cardNumber),
            expireMonth: paymentMethod.expireMonth,
            expireYear: paymentMethod.expireYear,
            cvc: paymentMethod.cvc,
          }
        : undefined;

    const { customer: iyzicoCustomer, missingFields } = buildIyzicoCustomerPayload({
      userName: subscriberProfile.name,
      userEmail: subscriberProfile.email,
      userPhone: subscriberProfile.phone,
      registrationTaxId: latestBusinessRegistration?.taxId ?? null,
      registrationAddress: latestBusinessRegistration?.businessAddress ?? null,
      registrationPhone: latestBusinessRegistration?.contactPhone ?? null,
      requestCustomer: customer,
    });

    if (finalPrice > 0 && !iyzicoCustomer) {
      return c.json(
        {
          error: "Missing iyzico customer fields",
          message: "Abonelik ödemesi için müşteri/fatura bilgileri eksik.",
          missingFields,
        },
        400,
      );
    }

    let providerSubscriptionId: string | null = null;
    let providerTransactionId: string | null = null;
    let providerStatus: "active" | "pending" = "active";
    let providerPayload: unknown = null;
    const paymentProviderName = finalPrice > 0 ? "iyzico" : "mock";

    if (finalPrice > 0 && sanitizedPaymentMethod && iyzicoCustomer) {
      const paymentResult = await paymentProvider.createSubscription({
        userId,
        planId,
        price: finalPrice,
        currency: plan.currency as CreateSubscriptionParams["currency"],
        billingCycle: "yearly",
        paymentCard: sanitizedPaymentMethod,
        customer: iyzicoCustomer,
      });

      if (paymentResult.status === "failed") {
        return c.json(
          {
            error: "Payment failed",
            message:
              paymentResult.errorMessage ||
              "Ödeme işleminiz başarısız oldu. Lütfen tekrar deneyiniz.",
            details: paymentResult.rawResponse,
          },
          400,
        );
      }

      providerSubscriptionId = paymentResult.providerSubscriptionId;
      providerTransactionId = paymentResult.providerTransactionId;
      providerStatus = paymentResult.status;
      providerPayload = paymentResult.rawResponse;
    }

    const [newSubscription] = await db
      .insert(subscription)
      .values({
        id: nanoid(),
        userId,
        planId,
        status: providerStatus,
        provider: paymentProviderName,
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
          finalPrice > 0 && sanitizedPaymentMethod
            ? JSON.stringify({
                type: "credit_card",
                lastFour: sanitizedPaymentMethod.cardNumber.slice(-4),
              })
            : JSON.stringify({
                type: "coupon",
                code: appliedCouponCode,
              }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const paymentStatus =
      finalPrice > 0 ? (providerStatus === "pending" ? "pending" : "success") : "success";

    await db.insert(payment).values({
      id: nanoid(),
      subscriptionId: newSubscription.id,
      userId,
      provider: paymentProviderName,
      providerTransactionId,
      amount: finalPrice.toString(),
      currency: plan.currency,
      status: paymentStatus,
      paymentMethod:
        finalPrice > 0 && sanitizedPaymentMethod
          ? JSON.stringify({
              type: "credit_card",
              lastFour: sanitizedPaymentMethod.cardNumber.slice(-4),
            })
          : JSON.stringify({
              type: "coupon",
              code: appliedCouponCode,
            }),
      gatewayResponse: JSON.stringify(
        providerPayload ?? {
          status: "success",
          source: finalPrice > 0 ? "payment_provider" : "coupon",
        },
      ),
      paidAt: paymentStatus === "success" ? new Date() : null,
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
        subscriptionStatus: providerStatus,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    const [hydratedPlan] = await hydratePlansWithFeaturesAndEntitlements([plan]);

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
    const subscriptionData = await getLatestSubscriptionForUser(userId);

    if (!subscriptionData) {
      return c.json(
        {
          error: "No subscription found",
          message: "Lütfen abonelik planı seçiniz",
        },
        404,
      );
    }

    const [usageByResource, planEntitlements] = await Promise.all([
      getCurrentUsageByResource(userId),
      getEntitlementsForPlan(subscriptionData.planId),
    ]);

    const placeResourceKeys = [
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
    ] as const;

    const placesCurrent = placeResourceKeys.reduce(
      (sum, key) => sum + (usageByResource[key] ?? 0),
      0,
    );
    const blogsCurrent = usageByResource["blog.post"] ?? 0;

    const resourceUsage = planEntitlements.map((entitlement) => {
      const current = usageByResource[entitlement.resourceKey] ?? 0;
      const max = entitlement.isUnlimited ? null : entitlement.limitCount;
      const remaining =
        entitlement.isUnlimited || entitlement.limitCount === null
          ? null
          : Math.max(0, entitlement.limitCount - current);

      return {
        resourceKey: entitlement.resourceKey,
        current,
        max,
        remaining,
        isUnlimited: entitlement.isUnlimited,
      };
    });

    return c.json({
      usage: {
        resources: resourceUsage,
        places: {
          current: placesCurrent,
          max: subscriptionData.planMaxPlaces,
        },
        blogs: {
          current: blogsCurrent,
          max: subscriptionData.planMaxBlogs,
        },
      },
      subscription: {
        status: subscriptionData.status,
        endDate: subscriptionData.endDate,
        nextBillingDate: subscriptionData.nextBillingDate,
        planId: subscriptionData.planId,
        planEntitlements,
      },
    });
  } catch (error) {
    console.error("Get usage error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { app as subscriptionRoutes };
