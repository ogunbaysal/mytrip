import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import { district, place, placeCategory, province, user } from "../../../db/schemas/index.ts";
import { and, desc, eq, sql } from "drizzle-orm";
import { getSessionFromRequest } from "../../../lib/session.ts";
import {
  derivePlaceTypeFromCategorySlug,
  hydratePlaceMediaAndAmenities,
} from "../../../lib/place-relations.ts";

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

    const rows = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        shortDescription: place.shortDescription,
        address: place.address,
        cityId: place.cityId,
        districtId: place.districtId,
        status: place.status,
        ownerId: place.ownerId,
        ownerName: user.name,
        ownerEmail: user.email,
        createdAt: place.createdAt,
        categoryName: placeCategory.name,
        categorySlug: placeCategory.slug,
        cityName: province.name,
        districtName: district.name,
      })
      .from(place)
      .innerJoin(user, eq(place.ownerId, user.id))
      .leftJoin(placeCategory, eq(place.categoryId, placeCategory.id))
      .leftJoin(province, eq(place.cityId, province.id))
      .leftJoin(district, eq(place.districtId, district.id))
      .where(and(...whereConditions))
      .orderBy(desc(place.createdAt))
      .limit(limitInt)
      .offset(offset);

    const places = rows.map((row) => ({
      ...row,
      type: derivePlaceTypeFromCategorySlug(row.categorySlug),
      category: row.categoryName ?? "",
      city: row.cityName ?? "",
      district: row.districtName ?? "",
    }));

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

    const rows = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        categoryId: place.categoryId,
        description: place.description,
        shortDescription: place.shortDescription,
        address: place.address,
        cityId: place.cityId,
        districtId: place.districtId,
        location: place.location,
        contactInfo: place.contactInfo,
        rating: place.rating,
        reviewCount: place.reviewCount,
        priceLevel: place.priceLevel,
        nightlyPrice: place.nightlyPrice,
        status: place.status,
        verified: place.verified,
        featured: place.featured,
        ownerId: place.ownerId,
        views: place.views,
        bookingCount: place.bookingCount,
        openingHours: place.openingHours,
        checkInInfo: place.checkInInfo,
        checkOutInfo: place.checkOutInfo,
        createdAt: place.createdAt,
        updatedAt: place.updatedAt,
        categoryName: placeCategory.name,
        categorySlug: placeCategory.slug,
        cityName: province.name,
        districtName: district.name,
      })
      .from(place)
      .leftJoin(placeCategory, eq(place.categoryId, placeCategory.id))
      .leftJoin(province, eq(place.cityId, province.id))
      .leftJoin(district, eq(place.districtId, district.id))
      .where(eq(place.id, id))
      .limit(1);

    const placeData = rows[0];
    if (!placeData) {
      return c.json({ error: "Place not found" }, 404);
    }

    const [hydrated] = await hydratePlaceMediaAndAmenities([
      {
        ...placeData,
        type: derivePlaceTypeFromCategorySlug(placeData.categorySlug),
        category: placeData.categoryName ?? "",
        city: placeData.cityName ?? "",
        district: placeData.districtName ?? "",
      },
    ]);

    return c.json({ place: hydrated });
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
