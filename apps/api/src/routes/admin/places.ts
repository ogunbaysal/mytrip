import { Hono } from "hono";
import { db } from "../../db";
import { place, user } from "../../db/schemas";
import { eq, desc, ilike, sql, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const app = new Hono();

/**
 * Get all places with pagination and filtering
 * GET /admin/places
 */
app.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = "",
      type = "",
      status = "",
      category = "",
      featured = "",
      verified = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(LOWER(${place.name}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${place.description}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${place.address}) ILIKE ${'%' + search.toLowerCase() + '%'})`
      );
    }

    if (type) {
      conditions.push(eq(place.type, type as any));
    }

    if (status) {
      conditions.push(eq(place.status, status as any));
    }

    if (category) {
      conditions.push(ilike(place.category, `%${category}%`));
    }

    if (featured !== "") {
      conditions.push(eq(place.featured, featured === "true"));
    }

    if (verified !== "") {
      conditions.push(eq(place.verified, verified === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    // Build order by clause
    const orderByColumn = {
      name: place.name,
      type: place.type,
      status: place.status,
      rating: place.rating,
      reviewCount: place.reviewCount,
      views: place.views,
      bookingCount: place.bookingCount,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    }[sortBy] || place.createdAt;

    const orderDirection = sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(place)
      .where(whereClause);

    // Get places with owner info
    const places = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        type: place.type,
        category: place.category,
        description: place.description,
        shortDescription: place.shortDescription,
        address: place.address,
        city: place.city,
        district: place.district,
        location: place.location,
        rating: place.rating,
        reviewCount: place.reviewCount,
        priceLevel: place.priceLevel,
        nightlyPrice: place.nightlyPrice,
        status: place.status,
        verified: place.featured,
        featured: place.featured,
        views: place.views,
        bookingCount: place.bookingCount,
        ownerId: place.ownerId,
        createdAt: place.createdAt,
        updatedAt: place.updatedAt,
        ownerName: user.name,
        ownerEmail: user.email,
      })
      .from(place)
      .leftJoin(user, eq(place.ownerId, user.id))
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    return c.json({
      places,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count,
        totalPages: Math.ceil(count / limitInt),
      },
    });
  } catch (error) {
    console.error("Failed to fetch places:", error);
    return c.json(
      {
        error: "Failed to fetch places",
        message: "Unable to retrieve places"
      },
      500
    );
  }
});

/**
 * Get place by ID
 * GET /admin/places/:placeId
 */
app.get("/:placeId", async (c) => {
  try {
    const { placeId } = c.req.param();

    const [placeData] = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        type: place.type,
        category: place.category,
        description: place.description,
        shortDescription: place.shortDescription,
        address: place.address,
        city: place.city,
        district: place.district,
        location: place.location,
        contactInfo: place.contactInfo,
        rating: place.rating,
        reviewCount: place.reviewCount,
        priceLevel: place.priceLevel,
        nightlyPrice: place.nightlyPrice,
        features: place.features,
        images: place.images,
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
        ownerName: user.name,
        ownerEmail: user.email,
      })
      .from(place)
      .leftJoin(user, eq(place.ownerId, user.id))
      .where(eq(place.id, placeId))
      .limit(1);

    if (!placeData) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist"
        },
        404
      );
    }

    return c.json({ place: placeData });
  } catch (error) {
    console.error("Failed to fetch place:", error);
    return c.json(
      {
        error: "Failed to fetch place",
        message: "Unable to retrieve place details"
      },
      500
    );
  }
});

/**
 * Create new place
 * POST /admin/places
 */
app.post("/", async (c) => {
  try {
    const placeData = await c.req.json();

    const newPlace = {
      id: nanoid(),
      slug: placeData.slug || `${placeData.name.toLowerCase().replace(/\s+/g, '-')}-${nanoid(6)}`,
      name: placeData.name,
      type: placeData.type,
      category: placeData.category,
      description: placeData.description,
      shortDescription: placeData.shortDescription,
      address: placeData.address,
      city: placeData.city,
      district: placeData.district,
      location: placeData.location,
      contactInfo: placeData.contactInfo,
      priceLevel: placeData.priceLevel,
      nightlyPrice: placeData.nightlyPrice,
      features: placeData.features,
      images: placeData.images,
      openingHours: placeData.openingHours,
      checkInInfo: placeData.checkInInfo,
      checkOutInfo: placeData.checkOutInfo,
      ownerId: placeData.ownerId,
      status: placeData.status || "pending",
      verified: placeData.verified || false,
      featured: placeData.featured || false,
    };

    const [createdPlace] = await db.insert(place).values(newPlace).returning();

    return c.json({
      success: true,
      message: "Place created successfully",
      place: createdPlace,
    });
  } catch (error) {
    console.error("Failed to create place:", error);
    return c.json(
      {
        error: "Failed to create place",
        message: "Unable to create new place"
      },
      500
    );
  }
});

/**
 * Update place
 * PUT /admin/places/:placeId
 */
app.put("/:placeId", async (c) => {
  try {
    const { placeId } = c.req.param();
    const updates = await c.req.json();

    // Remove fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, ownerName, ownerEmail, ...allowedUpdates } = updates;

    const [updatedPlace] = await db
      .update(place)
      .set({
        ...allowedUpdates,
        updatedAt: new Date(),
      })
      .where(eq(place.id, placeId))
      .returning();

    if (!updatedPlace) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Place updated successfully",
      place: updatedPlace,
    });
  } catch (error) {
    console.error("Failed to update place:", error);
    return c.json(
      {
        error: "Failed to update place",
        message: "Unable to update place details"
      },
      500
    );
  }
});

/**
 * Update place status
 * PATCH /admin/places/:placeId/status
 */
app.patch("/:placeId/status", async (c) => {
  try {
    const { placeId } = c.req.param();
    const { status, reason } = await c.req.json();

    if (!["active", "inactive", "pending", "suspended"].includes(status)) {
      return c.json(
        {
          error: "Invalid status",
          message: "Status must be one of: active, inactive, pending, suspended"
        },
        400
      );
    }

    const [updatedPlace] = await db
      .update(place)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(place.id, placeId))
      .returning();

    if (!updatedPlace) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: `Place ${status} successfully`,
      place: updatedPlace,
      reason: reason || null,
    });
  } catch (error) {
    console.error("Failed to update place status:", error);
    return c.json(
      {
        error: "Failed to update place status",
        message: "Unable to update place status"
      },
      500
    );
  }
});

/**
 * Toggle place verification
 * PATCH /admin/places/:placeId/verify
 */
app.patch("/:placeId/verify", async (c) => {
  try {
    const { placeId } = c.req.param();

    const [currentPlace] = await db
      .select({ verified: place.verified })
      .from(place)
      .where(eq(place.id, placeId))
      .limit(1);

    if (!currentPlace) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist"
        },
        404
      );
    }

    const [updatedPlace] = await db
      .update(place)
      .set({
        verified: !currentPlace.verified,
        updatedAt: new Date(),
      })
      .where(eq(place.id, placeId))
      .returning();

    return c.json({
      success: true,
      message: `Place ${updatedPlace.verified ? "verified" : "unverified"} successfully`,
      place: updatedPlace,
    });
  } catch (error) {
    console.error("Failed to toggle place verification:", error);
    return c.json(
      {
        error: "Failed to toggle place verification",
        message: "Unable to update place verification status"
      },
      500
    );
  }
});

/**
 * Toggle place featured status
 * PATCH /admin/places/:placeId/feature
 */
app.patch("/:placeId/feature", async (c) => {
  try {
    const { placeId } = c.req.param();

    const [currentPlace] = await db
      .select({ featured: place.featured })
      .from(place)
      .where(eq(place.id, placeId))
      .limit(1);

    if (!currentPlace) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist"
        },
        404
      );
    }

    const [updatedPlace] = await db
      .update(place)
      .set({
        featured: !currentPlace.featured,
        updatedAt: new Date(),
      })
      .where(eq(place.id, placeId))
      .returning();

    return c.json({
      success: true,
      message: `Place ${updatedPlace.featured ? "featured" : "unfeatured"} successfully`,
      place: updatedPlace,
    });
  } catch (error) {
    console.error("Failed to toggle place featured status:", error);
    return c.json(
      {
        error: "Failed to toggle place featured status",
        message: "Unable to update place featured status"
      },
      500
    );
  }
});

/**
 * Delete place
 * DELETE /admin/places/:placeId
 */
app.delete("/:placeId", async (c) => {
  try {
    const { placeId } = c.req.param();

    const [deletedPlace] = await db
      .delete(place)
      .where(eq(place.id, placeId))
      .returning();

    if (!deletedPlace) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Place deleted successfully",
      place: deletedPlace,
    });
  } catch (error) {
    console.error("Failed to delete place:", error);
    return c.json(
      {
        error: "Failed to delete place",
        message: "Unable to delete place"
      },
      500
    );
  }
});

/**
 * Get place statistics
 * GET /admin/places/stats
 */
app.get("/stats", async (c) => {
  try {
    // Get place counts by type
    const typeStats = await db
      .select({
        type: place.type,
        count: sql`COUNT(*)::int`,
      })
      .from(place)
      .groupBy(place.type);

    // Get place counts by status
    const statusStats = await db
      .select({
        status: place.status,
        count: sql`COUNT(*)::int`,
      })
      .from(place)
      .groupBy(place.status);

    // Get verification and featured counts
    const verificationStats = await db
      .select({
        verified: place.verified,
        count: sql`COUNT(*)::int`,
      })
      .from(place)
      .groupBy(place.verified);

    const featuredStats = await db
      .select({
        featured: place.featured,
        count: sql`COUNT(*)::int`,
      })
      .from(place)
      .groupBy(place.featured);

    // Get recent places (last 30 days)
    const recentPlaces = await db
      .select({
        count: sql`COUNT(*)::int`,
      })
      .from(place)
      .where(sql`${place.createdAt} >= NOW() - INTERVAL '30 days'`);

    // Get total views and bookings
    const engagementStats = await db
      .select({
        totalViews: sql`SUM(${place.views})::int`,
        totalBookings: sql`SUM(${place.bookingCount})::int`,
        avgRating: sql`AVG(${place.rating})::decimal(3,2)`,
      })
      .from(place);

    const stats = {
      totalPlaces: typeStats.reduce((sum, stat) => sum + stat.count, 0),
      byType: typeStats.reduce((acc, stat) => {
        acc[stat.type] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      verified: verificationStats.find(s => s.verified)?.count || 0,
      unverified: verificationStats.find(s => !s.verified)?.count || 0,
      featured: featuredStats.find(s => s.featured)?.count || 0,
      notFeatured: featuredStats.find(s => !s.featured)?.count || 0,
      recentPlaces: recentPlaces[0]?.count || 0,
      totalViews: engagementStats[0]?.totalViews || 0,
      totalBookings: engagementStats[0]?.totalBookings || 0,
      averageRating: engagementStats[0]?.avgRating || 0,
    };

    return c.json({ stats });
  } catch (error) {
    console.error("Failed to fetch place stats:", error);
    return c.json(
      {
        error: "Failed to fetch place statistics",
        message: "Unable to retrieve place statistics"
      },
      500
    );
  }
});

export { app as placesRoutes };