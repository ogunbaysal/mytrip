import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/index.ts";
import {
  place,
  subscription,
  subscriptionPlan,
  user,
} from "../../db/schemas/index.ts";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { getSessionFromRequest } from "../../lib/session.ts";

const app = new Hono();

const placeStatusEnum = [
  "active",
  "inactive",
  "pending",
  "suspended",
  "rejected",
] as const;

const createPlaceSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum([
    "hotel",
    "restaurant",
    "cafe",
    "activity",
    "attraction",
    "transport",
  ]),
  categoryId: z.string().optional(),
  category: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  contactInfo: z.record(z.string(), z.any()).optional(),
  priceLevel: z.enum(["budget", "moderate", "expensive", "luxury"]).optional(),
  nightlyPrice: z.number().min(0).optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1).max(50),
  openingHours: z.record(z.string(), z.any()).optional(),
  checkInInfo: z.record(z.string(), z.any()).optional(),
  checkOutInfo: z.record(z.string(), z.any()).optional(),
});

const updatePlaceSchema = createPlaceSchema.partial();

async function checkPlaceLimit(
  userId: string,
): Promise<{ allowed: boolean; current: number; max: number }> {
  const [subscriptionData] = await db
    .select({
      planLimits: subscriptionPlan.limits,
      endDate: subscription.endDate,
      status: subscription.status,
    })
    .from(subscription)
    .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (!subscriptionData) {
    return { allowed: false, current: 0, max: 0 };
  }

  const endDate = new Date(subscriptionData.endDate);
  const now = new Date();
  if (endDate < now || subscriptionData.status !== "active") {
    return { allowed: false, current: 0, max: 0 };
  }

  const planLimits =
    typeof subscriptionData.planLimits === "string"
      ? JSON.parse(subscriptionData.planLimits)
      : subscriptionData.planLimits;

  const [placeCount] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(place)
    .where(eq(place.ownerId, userId));

  const currentCount = placeCount.count ?? 0;
  const maxPlaces = planLimits?.maxPlaces || 0;
  return {
    allowed: currentCount < maxPlaces,
    current: currentCount,
    max: maxPlaces,
  };
}

app.get("/", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const { page = "1", limit = "20", status } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const whereConditions = [eq(place.ownerId, userId)];
    if (status && placeStatusEnum.includes(status as any)) {
      whereConditions.push(eq(place.status, status as any));
    }

    const [totalCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(place)
      .where(and(...whereConditions));

    const places = await db
      .select()
      .from(place)
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
    console.error("Get owner places error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/", zValidator("json", createPlaceSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const data = c.req.valid("json");
    const { nanoid } = await import("nanoid");

    const limitCheck = await checkPlaceLimit(userId);
    if (!limitCheck.allowed) {
      return c.json(
        {
          error: "Plan limit reached",
          message: `Mekan limitinize ulaştınız (${limitCheck.current}/${limitCheck.max}). Lütfen abonelik planınızı yükseltin.`,
          current: limitCheck.current,
          max: limitCheck.max,
        },
        403,
      );
    }

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const [newPlace] = await db
      .insert(place)
      .values({
        id: nanoid(),
        slug,
        ownerId: userId,
        ...data,
        location: data.location ? JSON.stringify(data.location) : null,
        contactInfo: data.contactInfo ? JSON.stringify(data.contactInfo) : null,
        features: data.features ? JSON.stringify(data.features) : null,
        images: JSON.stringify(data.images),
        openingHours: data.openingHours
          ? JSON.stringify(data.openingHours)
          : null,
        checkInInfo: data.checkInInfo ? JSON.stringify(data.checkInInfo) : null,
        checkOutInfo: data.checkOutInfo
          ? JSON.stringify(data.checkOutInfo)
          : null,
        nightlyPrice: data.nightlyPrice ? data.nightlyPrice.toString() : null,
        status: "pending",
        verified: false,
        featured: false,
        views: 0,
        bookingCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db
      .update(user)
      .set({ placeCount: limitCheck.current + 1 })
      .where(eq(user.id, userId));

    return c.json(
      {
        success: true,
        message:
          "Mekanınız başarıyla oluşturuldu. Yöneticiler tarafından incelendikten sonra yayınlanacaktır.",
        place: newPlace,
      },
      201,
    );
  } catch (error) {
    console.error("Create place error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", issues: error.issues }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/:id", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const id = c.req.param("id");

    const [placeData] = await db
      .select()
      .from(place)
      .where(and(eq(place.id, id), eq(place.ownerId, userId)))
      .limit(1);

    if (!placeData) {
      return c.json({ error: "Place not found" }, 404);
    }

    return c.json({ place: placeData });
  } catch (error) {
    console.error("Get place error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/:id", zValidator("json", updatePlaceSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const [existingPlace] = await db
      .select()
      .from(place)
      .where(and(eq(place.id, id), eq(place.ownerId, userId)))
      .limit(1);

    if (!existingPlace) {
      return c.json({ error: "Place not found" }, 404);
    }

    const [updatedPlace] = await db
      .update(place)
      .set({
        ...data,
        location: data.location
          ? JSON.stringify(data.location)
          : existingPlace.location,
        contactInfo: data.contactInfo
          ? JSON.stringify(data.contactInfo)
          : existingPlace.contactInfo,
        features: data.features
          ? JSON.stringify(data.features)
          : existingPlace.features,
        images: data.images
          ? JSON.stringify(data.images)
          : existingPlace.images,
        openingHours: data.openingHours
          ? JSON.stringify(data.openingHours)
          : existingPlace.openingHours,
        checkInInfo: data.checkInInfo
          ? JSON.stringify(data.checkInInfo)
          : existingPlace.checkInInfo,
        checkOutInfo: data.checkOutInfo
          ? JSON.stringify(data.checkOutInfo)
          : existingPlace.checkOutInfo,
        nightlyPrice: data.nightlyPrice
          ? data.nightlyPrice.toString()
          : existingPlace.nightlyPrice,
        status:
          existingPlace.status === "rejected"
            ? "pending"
            : existingPlace.status,
        updatedAt: new Date(),
      })
      .where(and(eq(place.id, id), eq(place.ownerId, userId)))
      .returning();

    return c.json({
      success: true,
      message: "Mekanınız başarıyla güncellendi",
      place: updatedPlace,
    });
  } catch (error) {
    console.error("Update place error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", issues: error.issues }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/:id", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const id = c.req.param("id");

    const [existingPlace] = await db
      .select()
      .from(place)
      .where(and(eq(place.id, id), eq(place.ownerId, userId)))
      .limit(1);

    if (!existingPlace) {
      return c.json({ error: "Place not found" }, 404);
    }

    await db
      .delete(place)
      .where(and(eq(place.id, id), eq(place.ownerId, userId)));

    const [currentCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(place)
      .where(eq(place.ownerId, userId));

    await db
      .update(user)
      .set({ placeCount: currentCount.count ?? 0 })
      .where(eq(user.id, userId));

    return c.json({
      success: true,
      message: "Mekan başarıyla silindi",
    });
  } catch (error) {
    console.error("Delete place error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/:id/submit", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const id = c.req.param("id");

    const [existingPlace] = await db
      .select({ status: place.status })
      .from(place)
      .where(and(eq(place.id, id), eq(place.ownerId, userId)))
      .limit(1);

    if (!existingPlace) {
      return c.json({ error: "Place not found" }, 404);
    }

    if (
      existingPlace.status === "pending" ||
      existingPlace.status === "active"
    ) {
      return c.json(
        {
          error: "Place cannot be submitted",
          message: "Bu mekan zaten inceleniyor veya yayınlanmış durumda",
        },
        400,
      );
    }

    await db
      .update(place)
      .set({ status: "pending", updatedAt: new Date() })
      .where(and(eq(place.id, id), eq(place.ownerId, userId)));

    return c.json({
      success: true,
      message: "Mekanınız yeniden incelenmek üzere gönderildi",
    });
  } catch (error) {
    console.error("Submit place error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { app as placesRoutes };
