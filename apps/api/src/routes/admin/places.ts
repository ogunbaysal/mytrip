import { Hono } from "hono";
import { db } from "../../db/index.ts";
import {
  district,
  file,
  place,
  placeCategory,
  placeImage,
  province,
  user,
} from "../../db/schemas/index.ts";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  derivePlaceTypeFromCategorySlug,
  hydratePlaceMediaAndAmenities,
  replacePlaceAmenities,
  resolveCategorySlugsForType,
  resolveProvinceDistrictIds,
} from "../../lib/place-relations.ts";

const app = new Hono();

const safeParse = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string") return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const safeStringify = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const inferImageMimeType = (url: string): string => {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
};

const buildPlaceImages = (
  imageUrls: string[],
  placeId: string,
  uploadedById: string,
) => {
  const filesToInsert = imageUrls.map((url, index) => {
    const id = crypto.randomUUID();
    return {
      id,
      filename: `admin-place-${placeId}-${index + 1}`,
      storedFilename: `admin-place-${placeId}-${index + 1}-${Date.now()}`,
      url,
      mimeType: inferImageMimeType(url),
      size: 0,
      type: "image" as const,
      usage: "place_image" as const,
      uploadedById,
    };
  });

  const relations = filesToInsert.map((img, index) => ({
    placeId,
    fileId: img.id,
    sortOrder: index,
  }));

  return { filesToInsert, relations };
};

const normalizeOptionalId = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

async function resolveCategoryId(input: {
  categoryId?: string | null;
  category?: string | null;
  type?: string | null;
  fallbackCategoryId?: string | null;
}): Promise<{ id: string | null; slug: string | null; name: string | null }> {
  const categoryId = normalizeOptionalId(input.categoryId) ?? input.fallbackCategoryId ?? null;
  if (categoryId) {
    const [row] = await db
      .select({ id: placeCategory.id, slug: placeCategory.slug, name: placeCategory.name })
      .from(placeCategory)
      .where(eq(placeCategory.id, categoryId))
      .limit(1);

    if (row) {
      return row;
    }
  }

  const categoryText = input.category?.trim();
  if (!categoryText) {
    return { id: categoryId, slug: null, name: null };
  }

  const [match] = await db
    .select({ id: placeCategory.id, slug: placeCategory.slug, name: placeCategory.name })
    .from(placeCategory)
    .where(
      sql`LOWER(${placeCategory.slug}) = LOWER(${categoryText}) OR LOWER(${placeCategory.name}) = LOWER(${categoryText})`,
    )
    .limit(1);

  if (!match) {
    const fallbackSlugs = resolveCategorySlugsForType(input.type);
    const fallbackSlug = fallbackSlugs[0];
    if (!fallbackSlug) return { id: categoryId, slug: null, name: null };

    const [fallback] = await db
      .select({ id: placeCategory.id, slug: placeCategory.slug, name: placeCategory.name })
      .from(placeCategory)
      .where(eq(placeCategory.slug, fallbackSlug))
      .limit(1);

    if (!fallback) return { id: categoryId, slug: null, name: null };
    return fallback;
  }
  return match;
}

type JoinedPlace = {
  id: string;
  slug: string;
  name: string;
  categoryId: string | null;
  description: string | null;
  shortDescription: string | null;
  address: string | null;
  cityId: string | null;
  districtId: string | null;
  location: string | null;
  contactInfo: string | null;
  rating: string | null;
  reviewCount: number;
  priceLevel: "budget" | "moderate" | "expensive" | "luxury" | null;
  nightlyPrice: string | null;
  status: "active" | "inactive" | "pending" | "suspended" | "rejected";
  verified: boolean;
  featured: boolean;
  views: number;
  bookingCount: number;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  openingHours: string | null;
  checkInInfo: string | null;
  checkOutInfo: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  cityName: string | null;
  districtName: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
};

function toLegacyPlace(row: JoinedPlace) {
  return {
    ...row,
    type: derivePlaceTypeFromCategorySlug(row.categorySlug),
    category: row.categoryName ?? "",
    city: row.cityName ?? "",
    district: row.districtName ?? "",
  };
}

async function fetchPlaceById(placeId: string) {
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
      views: place.views,
      bookingCount: place.bookingCount,
      ownerId: place.ownerId,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
      openingHours: place.openingHours,
      checkInInfo: place.checkInInfo,
      checkOutInfo: place.checkOutInfo,
      categoryName: placeCategory.name,
      categorySlug: placeCategory.slug,
      cityName: province.name,
      districtName: district.name,
      ownerName: user.name,
      ownerEmail: user.email,
    })
    .from(place)
    .leftJoin(placeCategory, eq(place.categoryId, placeCategory.id))
    .leftJoin(province, eq(place.cityId, province.id))
    .leftJoin(district, eq(place.districtId, district.id))
    .leftJoin(user, eq(place.ownerId, user.id))
    .where(eq(place.id, placeId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [hydrated] = await hydratePlaceMediaAndAmenities([toLegacyPlace(row)]);
  return {
    ...hydrated,
    location: safeParse(hydrated.location, null),
    contactInfo: safeParse(hydrated.contactInfo, null),
    openingHours: safeParse(hydrated.openingHours, null),
    checkInInfo: safeParse(hydrated.checkInInfo, null),
    checkOutInfo: safeParse(hydrated.checkOutInfo, null),
  };
}

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

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        sql`(
          LOWER(${place.name}) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${place.description}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${place.address}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${placeCategory.name}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${province.name}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${district.name}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
        )`,
      );
    }

    if (type) {
      const categorySlugs = resolveCategorySlugsForType(type);
      if (categorySlugs.length > 0) {
        conditions.push(inArray(placeCategory.slug, categorySlugs));
      }
    }

    if (status) {
      conditions.push(eq(place.status, status as any));
    }

    if (category) {
      conditions.push(
        sql`${place.categoryId} = ${category}
            OR LOWER(COALESCE(${placeCategory.name}, '')) ILIKE ${"%" + category.toLowerCase() + "%"}
            OR LOWER(COALESCE(${placeCategory.slug}, '')) ILIKE ${"%" + category.toLowerCase() + "%"}`,
      );
    }

    if (featured !== "") {
      conditions.push(eq(place.featured, featured === "true"));
    }

    if (verified !== "") {
      conditions.push(eq(place.verified, verified === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByColumn =
      {
        name: place.name,
        status: place.status,
        rating: place.rating,
        reviewCount: place.reviewCount,
        views: place.views,
        bookingCount: place.bookingCount,
        createdAt: place.createdAt,
        updatedAt: place.updatedAt,
      }[sortBy] || place.createdAt;

    const orderDirection = sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    const countRows = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(place)
      .leftJoin(placeCategory, eq(place.categoryId, placeCategory.id))
      .leftJoin(province, eq(place.cityId, province.id))
      .leftJoin(district, eq(place.districtId, district.id))
      .where(whereClause);

    const count = countRows[0]?.count ?? 0;

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
        views: place.views,
        bookingCount: place.bookingCount,
        ownerId: place.ownerId,
        createdAt: place.createdAt,
        updatedAt: place.updatedAt,
        openingHours: place.openingHours,
        checkInInfo: place.checkInInfo,
        checkOutInfo: place.checkOutInfo,
        ownerName: user.name,
        ownerEmail: user.email,
        categoryName: placeCategory.name,
        categorySlug: placeCategory.slug,
        cityName: province.name,
        districtName: district.name,
      })
      .from(place)
      .leftJoin(user, eq(place.ownerId, user.id))
      .leftJoin(placeCategory, eq(place.categoryId, placeCategory.id))
      .leftJoin(province, eq(place.cityId, province.id))
      .leftJoin(district, eq(place.districtId, district.id))
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    const hydrated = await hydratePlaceMediaAndAmenities(rows.map((row) => toLegacyPlace(row as JoinedPlace)));

    const processedPlaces = hydrated.map((p) => ({
      ...p,
      location: safeParse(p.location, null),
    }));

    return c.json({
      places: processedPlaces,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitInt),
      },
    });
  } catch (error) {
    console.error("Failed to fetch places:", error);
    return c.json(
      {
        error: "Failed to fetch places",
        message: "Unable to retrieve places",
      },
      500,
    );
  }
});

/**
 * Get place statistics
 * GET /admin/places/stats
 */
app.get("/stats", async (c) => {
  try {
    const typeStatsRaw = await db
      .select({
        categorySlug: placeCategory.slug,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .leftJoin(placeCategory, eq(place.categoryId, placeCategory.id))
      .groupBy(placeCategory.slug);

    const byType = typeStatsRaw.reduce(
      (acc, stat) => {
        const legacyType = derivePlaceTypeFromCategorySlug(stat.categorySlug);
        acc[legacyType] = (acc[legacyType] ?? 0) + Number(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    const statusStats = await db
      .select({
        status: place.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .groupBy(place.status);

    const verificationStats = await db
      .select({
        verified: place.verified,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .groupBy(place.verified);

    const featuredStats = await db
      .select({
        featured: place.featured,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .groupBy(place.featured);

    const recentPlaces = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .where(sql`${place.createdAt} >= NOW() - INTERVAL '30 days'`);

    const engagementStats = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${place.views}), 0)::int`,
        totalBookings: sql<number>`COALESCE(SUM(${place.bookingCount}), 0)::int`,
        avgRating: sql<number>`COALESCE(AVG(${place.rating}), 0)::decimal(3,2)`,
      })
      .from(place);

    const stats = {
      totalPlaces: Object.values(byType).reduce((sum, count) => sum + count, 0),
      byType,
      byStatus: statusStats.reduce(
        (acc, stat) => {
          acc[stat.status] = Number(stat.count);
          return acc;
        },
        {} as Record<string, number>,
      ),
      verified: Number(verificationStats.find((s) => s.verified)?.count || 0),
      unverified: Number(verificationStats.find((s) => !s.verified)?.count || 0),
      featured: Number(featuredStats.find((s) => s.featured)?.count || 0),
      notFeatured: Number(featuredStats.find((s) => !s.featured)?.count || 0),
      recentPlaces: Number(recentPlaces[0]?.count || 0),
      totalViews: Number(engagementStats[0]?.totalViews || 0),
      totalBookings: Number(engagementStats[0]?.totalBookings || 0),
      averageRating: Number(engagementStats[0]?.avgRating || 0),
    };

    return c.json({ stats });
  } catch (error) {
    console.error("Failed to fetch place stats:", error);
    return c.json(
      {
        error: "Failed to fetch place statistics",
        message: "Unable to retrieve place statistics",
      },
      500,
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
    const placeData = await fetchPlaceById(placeId);

    if (!placeData) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist",
        },
        404,
      );
    }

    return c.json({ place: placeData });
  } catch (error) {
    console.error("Failed to fetch place:", error);
    return c.json(
      {
        error: "Failed to fetch place",
        message: "Unable to retrieve place details",
      },
      500,
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
    const ownerId = normalizeOptionalId(placeData.ownerId);
    if (!ownerId) {
      return c.json(
        {
          error: "Owner is required",
          message: "ownerId is required when creating a place",
        },
        400,
      );
    }

    const resolvedCategory = await resolveCategoryId({
      categoryId: placeData.categoryId,
      category: placeData.category,
      type: placeData.type,
    });

    const resolvedLocation = await resolveProvinceDistrictIds({
      cityId: placeData.cityId,
      districtId: placeData.districtId,
      city: placeData.city,
      district: placeData.district,
    });

    const id = nanoid();

    await db.insert(place).values({
      id,
      slug: placeData.slug || `${placeData.name.toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`,
      name: placeData.name,
      categoryId: resolvedCategory.id,
      description: placeData.description,
      shortDescription: placeData.shortDescription,
      address: placeData.address,
      cityId: resolvedLocation.cityId,
      districtId: resolvedLocation.districtId,
      location: safeStringify(placeData.location),
      contactInfo: safeStringify(placeData.contactInfo),
      priceLevel: placeData.priceLevel,
      nightlyPrice:
        placeData.nightlyPrice !== undefined && placeData.nightlyPrice !== null
          ? String(placeData.nightlyPrice)
          : null,
      openingHours: safeStringify(placeData.openingHours),
      checkInInfo: safeStringify(placeData.checkInInfo),
      checkOutInfo: safeStringify(placeData.checkOutInfo),
      ownerId,
      status: placeData.status || "pending",
      verified: Boolean(placeData.verified),
      featured: Boolean(placeData.featured),
      updatedAt: new Date(),
    });

    if (Array.isArray(placeData.images) && placeData.images.length > 0) {
      const { filesToInsert, relations } = buildPlaceImages(placeData.images, id, ownerId);
      await db.insert(file).values(filesToInsert);
      await db.insert(placeImage).values(relations);
    }

    if (Array.isArray(placeData.features)) {
      await replacePlaceAmenities(id, placeData.features);
    }

    const createdPlace = await fetchPlaceById(id);

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
        message: "Unable to create new place",
      },
      500,
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

    const [existingPlace] = await db
      .select({
        id: place.id,
        categoryId: place.categoryId,
        cityId: place.cityId,
        districtId: place.districtId,
        location: place.location,
        contactInfo: place.contactInfo,
        nightlyPrice: place.nightlyPrice,
        openingHours: place.openingHours,
        checkInInfo: place.checkInInfo,
        checkOutInfo: place.checkOutInfo,
        ownerId: place.ownerId,
      })
      .from(place)
      .where(eq(place.id, placeId))
      .limit(1);

    if (!existingPlace) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist",
        },
        404,
      );
    }

    const {
      id,
      createdAt,
      updatedAt,
      ownerName,
      ownerEmail,
      categoryName,
      categorySlug,
      category,
      type,
      city,
      district,
      images,
      features,
      ...allowedUpdates
    } = updates;

    const resolvedCategory = await resolveCategoryId({
      categoryId: allowedUpdates.categoryId,
      category,
      type,
      fallbackCategoryId: existingPlace.categoryId,
    });

    const resolvedLocation = await resolveProvinceDistrictIds({
      cityId: allowedUpdates.cityId ?? existingPlace.cityId,
      districtId: allowedUpdates.districtId ?? existingPlace.districtId,
      city,
      district,
    });

    const dbUpdates = {
      ...allowedUpdates,
      categoryId: resolvedCategory.id,
      cityId: resolvedLocation.cityId,
      districtId: resolvedLocation.districtId,
      location:
        allowedUpdates.location !== undefined
          ? safeStringify(allowedUpdates.location)
          : existingPlace.location,
      contactInfo:
        allowedUpdates.contactInfo !== undefined
          ? safeStringify(allowedUpdates.contactInfo)
          : existingPlace.contactInfo,
      nightlyPrice:
        allowedUpdates.nightlyPrice !== undefined
          ? String(allowedUpdates.nightlyPrice)
          : existingPlace.nightlyPrice,
      priceLevel:
        allowedUpdates.priceLevel === ""
          ? null
          : allowedUpdates.priceLevel,
      openingHours:
        allowedUpdates.openingHours !== undefined
          ? safeStringify(allowedUpdates.openingHours)
          : existingPlace.openingHours,
      checkInInfo:
        allowedUpdates.checkInInfo !== undefined
          ? safeStringify(allowedUpdates.checkInInfo)
          : existingPlace.checkInInfo,
      checkOutInfo:
        allowedUpdates.checkOutInfo !== undefined
          ? safeStringify(allowedUpdates.checkOutInfo)
          : existingPlace.checkOutInfo,
      updatedAt: new Date(),
    };

    await db.update(place).set(dbUpdates).where(eq(place.id, placeId));

    if (images !== undefined) {
      const existingImageLinks = await db
        .select({ fileId: placeImage.fileId })
        .from(placeImage)
        .where(eq(placeImage.placeId, placeId));

      const existingFileIds = existingImageLinks.map((img) => img.fileId);

      await db.delete(placeImage).where(eq(placeImage.placeId, placeId));

      if (existingFileIds.length > 0) {
        await db.delete(file).where(inArray(file.id, existingFileIds));
      }

      if (Array.isArray(images) && images.length > 0) {
        if (!existingPlace.ownerId) {
          return c.json(
            {
              error: "Owner is required",
              message: "Cannot attach images to a place without ownerId",
            },
            400,
          );
        }
        const uploadedById = existingPlace.ownerId;
        const { filesToInsert, relations } = buildPlaceImages(images, placeId, uploadedById);
        await db.insert(file).values(filesToInsert);
        await db.insert(placeImage).values(relations);
      }
    }

    if (features !== undefined) {
      await replacePlaceAmenities(placeId, Array.isArray(features) ? features : []);
    }

    const updatedPlace = await fetchPlaceById(placeId);

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
        message: "Unable to update place details",
      },
      500,
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
          message: "Status must be one of: active, inactive, pending, suspended",
        },
        400,
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
          message: "The specified place does not exist",
        },
        404,
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
        message: "Unable to update place status",
      },
      500,
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
    const body = await c.req.json().catch(() => ({} as { verified?: unknown }));
    const explicitVerified =
      typeof body?.verified === "boolean" ? body.verified : undefined;

    const [currentPlace] = await db
      .select({ verified: place.verified })
      .from(place)
      .where(eq(place.id, placeId))
      .limit(1);

    if (!currentPlace) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist",
        },
        404,
      );
    }

    const nextVerified =
      explicitVerified !== undefined ? explicitVerified : !currentPlace.verified;

    const [updatedPlace] = await db
      .update(place)
      .set({
        verified: nextVerified,
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
        message: "Unable to update place verification status",
      },
      500,
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
          message: "The specified place does not exist",
        },
        404,
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
        message: "Unable to update place featured status",
      },
      500,
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
          message: "The specified place does not exist",
        },
        404,
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
        message: "Unable to delete place",
      },
      500,
    );
  }
});

export { app as placesRoutes };
