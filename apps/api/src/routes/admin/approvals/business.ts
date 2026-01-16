import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import {
  businessRegistration,
  businessProfile,
  user,
} from "../../../db/schemas/index.ts";
import { eq, desc, sql } from "drizzle-orm";
import { getSessionFromRequest } from "../../../lib/session.ts";
import { nanoid } from "nanoid";

const app = new Hono();

const approveRejectSchema = z.object({
  rejectionReason: z.string().optional(),
});

app.get("/registrations", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { page = "1", limit = "20", status } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const whereConditions = status
      ? [eq(businessRegistration.status, status as any)]
      : [];

    const [totalCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(businessRegistration)
      .where(
        whereConditions.length > 0
          ? eq(businessRegistration.status, status as any)
          : undefined,
      );

    const registrations = await db
      .select()
      .from(businessRegistration)
      .innerJoin(user, eq(businessRegistration.userId, user.id))
      .where(
        whereConditions.length > 0
          ? eq(businessRegistration.status, status as any)
          : undefined,
      )
      .orderBy(desc(businessRegistration.createdAt))
      .limit(limitInt)
      .offset(offset);

    return c.json({
      registrations,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limitInt),
      },
    });
  } catch (error) {
    console.error("Get business registrations error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/registrations/:id/approve", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const adminId = session.user.id;
    const id = c.req.param("id");

    const [existingRegistration] = await db
      .select({
        status: businessRegistration.status,
        userId: businessRegistration.userId,
      })
      .from(businessRegistration)
      .where(eq(businessRegistration.id, id))
      .limit(1);

    if (!existingRegistration) {
      return c.json({ error: "Business registration not found" }, 404);
    }

    if (existingRegistration.status !== "pending") {
      return c.json(
        {
          error: "Cannot approve",
          message: "Sadece beklemede olan kayıtlar onaylanabilir",
        },
        400,
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(businessRegistration)
        .set({
          status: "approved",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(businessRegistration.id, id));

      await tx
        .update(user)
        .set({ role: "owner", updatedAt: new Date() })
        .where(eq(user.id, existingRegistration.userId));

      await tx
        .insert(businessProfile)
        .values({
          id: nanoid(),
          userId: existingRegistration.userId,
          logo: null,
          description: null,
          website: null,
          socialMedia: null,
          businessHours: null,
          responseTime: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    });

    return c.json({
      success: true,
      message: "İşletme kaydı başarıyla onaylandı",
    });
  } catch (error) {
    console.error("Approve business registration error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put(
  "/registrations/:id/reject",
  zValidator("json", approveRejectSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id || (session.user as any).role !== "admin") {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const adminId = session.user.id;
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const [existingRegistration] = await db
        .select({ status: businessRegistration.status })
        .from(businessRegistration)
        .where(eq(businessRegistration.id, id))
        .limit(1);

      if (!existingRegistration) {
        return c.json({ error: "Business registration not found" }, 404);
      }

      if (existingRegistration.status !== "pending") {
        return c.json(
          {
            error: "Cannot reject",
            message: "Sadece beklemede olan kayıtlar reddedilebilir",
          },
          400,
        );
      }

      await db
        .update(businessRegistration)
        .set({
          status: "rejected",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: data.rejectionReason || null,
          updatedAt: new Date(),
        })
        .where(eq(businessRegistration.id, id));

      return c.json({
        success: true,
        message: "İşletme kaydı başarıyla reddedildi",
      });
    } catch (error) {
      console.error("Reject business registration error:", error);
      if (error instanceof z.ZodError) {
        return c.json(
          { error: "Validation failed", issues: error.issues },
          400,
        );
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

export { app as businessApprovalRoutes };
