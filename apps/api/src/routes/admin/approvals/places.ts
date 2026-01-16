import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import { place, user } from "../../../db/schemas/index.ts";
import { eq, and, desc, sql } from "drizzle-orm";
import { getSessionFromRequest } from "../../../lib/session.ts";

const app = new Hono();

const approveRejectSchema = z.object({
  rejectionReason: z.string().optional(),
});

app.get("/places", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { page = "1", limit = "20", status } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const whereConditions = [eq(place.status, "pending")];
    if (status) {
      whereConditions[0] = eq(place.status, status as any);
    }

    const [totalCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(place)
      .where(and(...whereConditions));

    const places = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        type: place.type,
        category: place.category,
        shortDescription: place.shortDescription,
        address: place.address,
        city: place.city,
        district: place.district,
        status: place.status,
        ownerId: place.ownerId,
        ownerName: user.name,
        ownerEmail: user.email,
        createdAt: place.createdAt,
      })
      .from(place)
      .innerJoin(user, eq(place.ownerId, user.id))
      .where(and(...whereConditions))
      .orderBy(desc(place.createdAt))
      .limit(limitInt)
      .offset(offset);

    return c.json({
      places,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limitInt),
      },
    });
  } catch (error) {
    console.error("Get pending places error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/places/:id", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");

    const [placeData] = await db
      .select()
      .from(place)
      .where(eq(place.id, id))
      .limit(1);

    if (!placeData) {
      return c.json({ error: "Place not found" }, 404);
    }

    return c.json({ place: placeData });
  } catch (error) {
    console.error("Get place details error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/places/:id/approve", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");

    const [existingPlace] = await db
      .select({ status: place.status, ownerId: place.ownerId })
      .from(place)
      .where(eq(place.id, id))
      .limit(1);

    if (!existingPlace) {
      return c.json({ error: "Place not found" }, 404);
    }

    if (existingPlace.status !== "pending") {
      return c.json(
        {
          error: "Cannot approve",
          message: "Sadece beklemede olan mekanlar onaylanabilir",
        },
        400,
      );
    }

    const [updatedPlace] = await db
      .update(place)
      .set({
        status: "active",
        verified: true,
        updatedAt: new Date(),
      })
      .where(eq(place.id, id))
      .returning();

    return c.json({
      success: true,
      message: "Mekan başarıyla onaylandı",
      place: updatedPlace,
    });
  } catch (error) {
    console.error("Approve place error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put(
  "/places/:id/reject",
  zValidator("json", approveRejectSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id || (session.user as any).role !== "admin") {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");
      const data = c.req.valid("json");

      const [existingPlace] = await db
        .select({ status: place.status })
        .from(place)
        .where(eq(place.id, id))
        .limit(1);

      if (!existingPlace) {
        return c.json({ error: "Place not found" }, 404);
      }

      if (existingPlace.status !== "pending") {
        return c.json(
          {
            error: "Cannot reject",
            message: "Sadece beklemede olan mekanlar reddedilebilir",
          },
          400,
        );
      }

      const [updatedPlace] = await db
        .update(place)
        .set({
          status: "rejected",
          updatedAt: new Date(),
        })
        .where(eq(place.id, id))
        .returning();

      return c.json({
        success: true,
        message: "Mekan başarıyla reddedildi",
        place: updatedPlace,
      });
    } catch (error) {
      console.error("Reject place error:", error);
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

export { app as approvalsRoutes };
