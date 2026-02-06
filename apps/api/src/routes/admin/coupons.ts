import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../../db/index.ts";
import {
  coupon,
  couponPlan,
  couponRedemption,
  subscriptionPlan,
} from "../../db/schemas/index.ts";

const app = new Hono();

const couponSchema = z.object({
  code: z.string().trim().min(3).max(64),
  description: z.string().optional(),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().positive(),
  scope: z.enum(["all_plans", "specific_plans"]).default("all_plans"),
  planIds: z.array(z.string()).optional().default([]),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  maxRedemptionsPerUser: z.number().int().positive().default(1),
  active: z.boolean().default(true),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

const normalizeCode = (value: string) => value.trim().toUpperCase();

const hydrateCoupons = async (rows: typeof coupon.$inferSelect[]) => {
  if (rows.length === 0) {
    return [];
  }

  const couponIds = rows.map((row) => row.id);

  const [planRows, usageRows] = await Promise.all([
    db
      .select({
        couponId: couponPlan.couponId,
        planId: couponPlan.planId,
        planName: subscriptionPlan.name,
      })
      .from(couponPlan)
      .innerJoin(subscriptionPlan, eq(couponPlan.planId, subscriptionPlan.id))
      .where(inArray(couponPlan.couponId, couponIds))
      .orderBy(asc(couponPlan.createdAt)),
    db
      .select({
        couponId: couponRedemption.couponId,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(couponRedemption)
      .where(inArray(couponRedemption.couponId, couponIds))
      .groupBy(couponRedemption.couponId),
  ]);

  const plansByCoupon = new Map<string, Array<{ id: string; name: string }>>();
  for (const row of planRows) {
    if (!plansByCoupon.has(row.couponId)) {
      plansByCoupon.set(row.couponId, []);
    }
    plansByCoupon.get(row.couponId)!.push({
      id: row.planId,
      name: row.planName,
    });
  }

  const usageByCoupon = new Map<string, number>();
  for (const row of usageRows) {
    usageByCoupon.set(row.couponId, row.count);
  }

  return rows.map((row) => ({
    ...row,
    planIds: (plansByCoupon.get(row.id) ?? []).map((plan) => plan.id),
    plans: plansByCoupon.get(row.id) ?? [],
    usageCount: usageByCoupon.get(row.id) ?? 0,
  }));
};

/**
 * GET /admin/coupons
 */
app.get("/", async (c) => {
  try {
    const { active } = c.req.query();
    const whereClause =
      active === undefined ? undefined : eq(coupon.active, active === "true");

    const rows = await db
      .select()
      .from(coupon)
      .where(whereClause)
      .orderBy(desc(coupon.createdAt));

    return c.json({ coupons: await hydrateCoupons(rows) });
  } catch (error) {
    console.error("Failed to fetch coupons:", error);
    return c.json({ error: "Failed to fetch coupons" }, 500);
  }
});

/**
 * GET /admin/coupons/:id
 */
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [row] = await db.select().from(coupon).where(eq(coupon.id, id)).limit(1);
    if (!row) {
      return c.json({ error: "Coupon not found" }, 404);
    }

    const [hydrated] = await hydrateCoupons([row]);
    return c.json({ coupon: hydrated });
  } catch (error) {
    console.error("Failed to fetch coupon:", error);
    return c.json({ error: "Failed to fetch coupon" }, 500);
  }
});

/**
 * POST /admin/coupons
 */
app.post("/", zValidator("json", couponSchema), async (c) => {
  try {
    const body = c.req.valid("json");
    const normalizedCode = normalizeCode(body.code);
    const uniquePlanIds = Array.from(new Set(body.planIds ?? []));
    const scope = body.scope ?? "all_plans";

    if (body.discountType === "percent" && body.discountValue > 100) {
      return c.json({ error: "Percent discount cannot exceed 100" }, 400);
    }

    if (scope === "specific_plans" && uniquePlanIds.length === 0) {
      return c.json({ error: "At least one plan must be selected for this coupon" }, 400);
    }

    const [existingCode] = await db
      .select({ id: coupon.id })
      .from(coupon)
      .where(eq(coupon.code, normalizedCode))
      .limit(1);
    if (existingCode) {
      return c.json({ error: "Coupon code already exists" }, 400);
    }

    const [createdCoupon] = await db
      .insert(coupon)
      .values({
        id: nanoid(),
        code: normalizedCode,
        description: body.description,
        discountType: body.discountType,
        discountValue: body.discountValue.toString(),
        scope,
        maxRedemptions: body.maxRedemptions ?? null,
        maxRedemptionsPerUser: body.maxRedemptionsPerUser,
        active: body.active,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (scope === "specific_plans" && uniquePlanIds.length > 0) {
      await db.insert(couponPlan).values(
        uniquePlanIds.map((planId) => ({
          id: nanoid(),
          couponId: createdCoupon.id,
          planId,
          createdAt: new Date(),
        })),
      );
    }

    const [hydrated] = await hydrateCoupons([createdCoupon]);
    return c.json({ coupon: hydrated }, 201);
  } catch (error) {
    console.error("Failed to create coupon:", error);
    return c.json({ error: "Failed to create coupon" }, 500);
  }
});

/**
 * PUT /admin/coupons/:id
 */
app.put("/:id", zValidator("json", couponSchema.partial()), async (c) => {
  try {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const [existing] = await db
      .select()
      .from(coupon)
      .where(eq(coupon.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Coupon not found" }, 404);
    }

    const scope = body.scope ?? existing.scope;
    const planIds =
      body.planIds !== undefined
        ? Array.from(new Set(body.planIds))
        : (
            await db
              .select({ planId: couponPlan.planId })
              .from(couponPlan)
              .where(eq(couponPlan.couponId, id))
          ).map((row) => row.planId);

    if (scope === "specific_plans" && planIds.length === 0) {
      return c.json({ error: "At least one plan must be selected for this coupon" }, 400);
    }

    if (
      body.discountType === "percent" &&
      body.discountValue !== undefined &&
      body.discountValue > 100
    ) {
      return c.json({ error: "Percent discount cannot exceed 100" }, 400);
    }

    if (body.code) {
      const normalizedCode = normalizeCode(body.code);
      const [sameCode] = await db
        .select({ id: coupon.id })
        .from(coupon)
        .where(and(eq(coupon.code, normalizedCode), sql`${coupon.id} <> ${id}`))
        .limit(1);
      if (sameCode) {
        return c.json({ error: "Coupon code already exists" }, 400);
      }
    }

    const [updated] = await db
      .update(coupon)
      .set({
        code: body.code ? normalizeCode(body.code) : undefined,
        description: body.description,
        discountType: body.discountType,
        discountValue:
          body.discountValue !== undefined ? body.discountValue.toString() : undefined,
        scope,
        maxRedemptions:
          body.maxRedemptions !== undefined ? body.maxRedemptions : undefined,
        maxRedemptionsPerUser: body.maxRedemptionsPerUser,
        active: body.active,
        startsAt:
          body.startsAt !== undefined
            ? body.startsAt
              ? new Date(body.startsAt)
              : null
            : undefined,
        endsAt:
          body.endsAt !== undefined
            ? body.endsAt
              ? new Date(body.endsAt)
              : null
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(coupon.id, id))
      .returning();

    await db.delete(couponPlan).where(eq(couponPlan.couponId, id));
    if (scope === "specific_plans" && planIds.length > 0) {
      await db.insert(couponPlan).values(
        planIds.map((planId) => ({
          id: nanoid(),
          couponId: id,
          planId,
          createdAt: new Date(),
        })),
      );
    }

    const [hydrated] = await hydrateCoupons([updated]);
    return c.json({ coupon: hydrated });
  } catch (error) {
    console.error("Failed to update coupon:", error);
    return c.json({ error: "Failed to update coupon" }, 500);
  }
});

/**
 * DELETE /admin/coupons/:id
 * Soft delete by setting inactive=false to preserve redemption history.
 */
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [updated] = await db
      .update(coupon)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(coupon.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Coupon not found" }, 404);
    }

    return c.json({ success: true, coupon: updated });
  } catch (error) {
    console.error("Failed to delete coupon:", error);
    return c.json({ error: "Failed to delete coupon" }, 500);
  }
});

export { app as couponsRoutes };
