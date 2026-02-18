import { Hono } from "hono";
import { db } from "../../db/index.ts";
import {
  amenity,
  district,
  file,
  place,
  placeAmenity,
  placeKind,
  placeImage,
  province,
  user,
} from "../../db/schemas/index.ts";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  derivePlaceTypeFromCategorySlug,
  hydratePlaceMediaAndAmenities,
  replacePlaceAmenities,
  resolvePublicFileUrl,
  resolvePlaceKindIdsForType,
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

async function resolvePlaceKindInput(input: {
  kind?: string | null;
  categoryId?: string | null;
  category?: string | null;
  type?: string | null;
  fallbackKind?: string | null;
  fallbackKindId?: string | null;
}): Promise<{
  kind: string | null;
  id: string | null;
  slug: string | null;
  name: string | null;
}> {
  const kindInput = normalizeOptionalId(input.kind);
  if (kindInput) {
    const [row] = await db
      .select({ id: placeKind.id, slug: placeKind.slug, name: placeKind.name })
      .from(placeKind)
      .where(eq(placeKind.id, kindInput))
      .limit(1);

    if (row) {
      return {
        kind: row.id,
        id: row.id,
        slug: row.slug,
        name: row.name,
      };
    }
  }

  const categoryId =
    normalizeOptionalId(input.categoryId) ?? input.fallbackKindId ?? null;
  if (categoryId) {
    const [row] = await db
      .select({ id: placeKind.id, slug: placeKind.slug, name: placeKind.name })
      .from(placeKind)
      .where(eq(placeKind.id, categoryId))
      .limit(1);

    if (row) {
      return {
        kind: row.id,
        id: row.id,
        slug: row.slug,
        name: row.name,
      };
    }
  }

  const categoryText = input.category?.trim();
  if (!categoryText) {
    return {
      kind: input.fallbackKind ?? null,
      id: categoryId,
      slug: null,
      name: null,
    };
  }

  const [match] = await db
    .select({ id: placeKind.id, slug: placeKind.slug, name: placeKind.name })
    .from(placeKind)
    .where(
      sql`LOWER(${placeKind.slug}) = LOWER(${categoryText}) OR LOWER(${placeKind.name}) = LOWER(${categoryText})`,
    )
    .limit(1);

  if (!match) {
    const fallbackCandidates = [
      ...(input.fallbackKind ? [input.fallbackKind] : []),
      ...resolvePlaceKindIdsForType(input.type),
    ];
    for (const candidate of fallbackCandidates) {
      const [fallback] = await db
        .select({ id: placeKind.id, slug: placeKind.slug, name: placeKind.name })
        .from(placeKind)
        .where(eq(placeKind.id, candidate))
        .limit(1);
      if (fallback) {
        return {
          kind: fallback.id,
          id: fallback.id,
          slug: fallback.slug,
          name: fallback.name,
        };
      }
    }
    return {
      kind: input.fallbackKind ?? null,
      id: categoryId,
      slug: null,
      name: null,
    };
  }
  return { kind: match.id, id: match.id, slug: match.slug, name: match.name };
}

type JoinedPlace = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  categoryId: string | null;
  businessDocumentFileId: string | null;
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
  kindName: string | null;
  kindSlug: string | null;
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
    type: derivePlaceTypeFromCategorySlug(row.kindSlug),
    category: row.kindName ?? "",
    categoryId: row.kind,
    categorySlug: row.kindSlug,
    city: row.cityName ?? "",
    district: row.districtName ?? "",
  };
}

async function getBusinessDocumentById(fileId: string | null) {
  if (!fileId) return null;

  const [doc] = await db
    .select({
      id: file.id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url,
      usage: file.usage,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt,
    })
    .from(file)
    .where(eq(file.id, fileId))
    .limit(1);

  if (!doc || doc.usage !== "business_document") return null;

  return {
    ...doc,
    url: resolvePublicFileUrl(doc.url),
  };
}

async function fetchPlaceById(placeId: string) {
  const rows = await db
    .select({
      id: place.id,
      slug: place.slug,
      name: place.name,
      kind: place.kind,
      categoryId: place.kind,
      businessDocumentFileId: place.businessDocumentFileId,
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
      kindName: placeKind.name,
      kindSlug: placeKind.slug,
      categoryName: placeKind.name,
      categorySlug: placeKind.slug,
      cityName: province.name,
      districtName: district.name,
      ownerName: user.name,
      ownerEmail: user.email,
    })
    .from(place)
    .leftJoin(placeKind, eq(place.kind, placeKind.id as any))
    .leftJoin(province, eq(place.cityId, province.id))
    .leftJoin(district, eq(place.districtId, district.id))
    .leftJoin(user, eq(place.ownerId, user.id))
    .where(eq(place.id, placeId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [hydrated] = await hydratePlaceMediaAndAmenities([toLegacyPlace(row)]);
  const businessDocument = await getBusinessDocumentById(
    row.businessDocumentFileId,
  );
  return {
    ...hydrated,
    businessDocumentFileId: row.businessDocumentFileId,
    businessDocument,
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
      kind = "",
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
          OR LOWER(COALESCE(${placeKind.name}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${province.name}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${district.name}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
        )`,
      );
    }

    if (type) {
      const kindIds = resolvePlaceKindIdsForType(type);
      if (kindIds.length > 0) {
        conditions.push(inArray(place.kind, kindIds as any));
      }
    }

    if (kind) {
      conditions.push(eq(place.kind, kind as any));
    }

    if (status) {
      conditions.push(eq(place.status, status as any));
    }

    if (category) {
      conditions.push(
        sql`${place.kind} = ${category}
            OR LOWER(COALESCE(${placeKind.name}, '')) ILIKE ${"%" + category.toLowerCase() + "%"}
            OR LOWER(COALESCE(${placeKind.slug}, '')) ILIKE ${"%" + category.toLowerCase() + "%"}`,
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
      .leftJoin(placeKind, eq(place.kind, placeKind.id as any))
      .leftJoin(province, eq(place.cityId, province.id))
      .leftJoin(district, eq(place.districtId, district.id))
      .where(whereClause);

    const count = countRows[0]?.count ?? 0;

    const rows = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        kind: place.kind,
        categoryId: place.kind,
        businessDocumentFileId: place.businessDocumentFileId,
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
        kindName: placeKind.name,
        kindSlug: placeKind.slug,
        categoryName: placeKind.name,
        categorySlug: placeKind.slug,
        cityName: province.name,
        districtName: district.name,
      })
      .from(place)
      .leftJoin(user, eq(place.ownerId, user.id))
      .leftJoin(placeKind, eq(place.kind, placeKind.id as any))
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
 * Get active place kinds
 * GET /admin/places/kinds
 */
app.get("/kinds", async (c) => {
  try {
    const kinds = await db
      .select({
        id: placeKind.id,
        slug: placeKind.slug,
        name: placeKind.name,
        icon: placeKind.icon,
        description: placeKind.description,
        monetized: placeKind.monetized,
        supportsRooms: placeKind.supportsRooms,
        supportsMenu: placeKind.supportsMenu,
        supportsPackages: placeKind.supportsPackages,
        sortOrder: placeKind.sortOrder,
        active: placeKind.active,
      })
      .from(placeKind)
      .where(eq(placeKind.active, true))
      .orderBy(asc(placeKind.sortOrder), asc(placeKind.name));

    return c.json({ kinds });
  } catch (error) {
    console.error("Failed to fetch place kinds:", error);
    return c.json(
      {
        error: "Failed to fetch place kinds",
        message: "Unable to retrieve place kinds",
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
        kindSlug: placeKind.slug,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .leftJoin(placeKind, eq(place.kind, placeKind.id as any))
      .groupBy(placeKind.slug);

    const byType = typeStatsRaw.reduce(
      (acc, stat) => {
        const legacyType = derivePlaceTypeFromCategorySlug(stat.kindSlug);
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
 * Get all available place features/amenities
 * GET /admin/places/features
 */
app.get("/features", async (c) => {
  try {
    const rows = await db
      .select({
        id: amenity.id,
        slug: amenity.slug,
        label: amenity.label,
        count: sql<number>`COUNT(${placeAmenity.placeId})::int`,
      })
      .from(amenity)
      .leftJoin(placeAmenity, eq(placeAmenity.amenityId, amenity.id))
      .groupBy(amenity.id, amenity.slug, amenity.label)
      .orderBy(desc(sql`COUNT(${placeAmenity.placeId})`), asc(amenity.label));

    return c.json({
      features: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        label: row.label,
        count: Number(row.count),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch place features:", error);
    return c.json(
      {
        error: "Failed to fetch place features",
        message: "Unable to retrieve place features",
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

    const resolvedKind = await resolvePlaceKindInput({
      kind: placeData.kind,
      categoryId: placeData.categoryId,
      category: placeData.category,
      type: placeData.type,
    });
    if (!resolvedKind.kind) {
      return c.json(
        {
          error: "Invalid place kind",
          message: "Geçerli bir yer türü seçimi zorunludur",
        },
        400,
      );
    }

    const resolvedLocation = await resolveProvinceDistrictIds({
      cityId: placeData.cityId,
      districtId: placeData.districtId,
      city: placeData.city,
      district: placeData.district,
    });

    const normalizedBusinessDocumentFileId = normalizeOptionalId(
      placeData.businessDocumentFileId,
    );
    if (normalizedBusinessDocumentFileId) {
      const doc = await getBusinessDocumentById(normalizedBusinessDocumentFileId);
      if (!doc) {
        return c.json(
          {
            error: "Invalid business document",
            message: "Geçersiz işletme belgesi dosyası",
          },
          400,
        );
      }
    }

    const id = nanoid();

    await db.insert(place).values({
      id,
      slug: placeData.slug || `${placeData.name.toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`,
      name: placeData.name,
      kind: resolvedKind.kind as any,
      categoryId: resolvedKind.id,
      description: placeData.description,
      shortDescription: placeData.shortDescription,
      address: placeData.address,
      cityId: resolvedLocation.cityId,
      districtId: resolvedLocation.districtId,
      location: safeStringify(placeData.location),
      contactInfo: safeStringify(placeData.contactInfo),
      businessDocumentFileId: normalizedBusinessDocumentFileId,
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
        kind: place.kind,
        categoryId: place.kind,
        cityId: place.cityId,
        districtId: place.districtId,
        location: place.location,
        contactInfo: place.contactInfo,
        businessDocumentFileId: place.businessDocumentFileId,
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
      businessDocumentFileId,
      ...allowedUpdates
    } = updates;

    const resolvedKind = await resolvePlaceKindInput({
      kind: updates.kind,
      categoryId: allowedUpdates.categoryId,
      category,
      type,
      fallbackKind: existingPlace.kind,
      fallbackKindId: existingPlace.kind,
    });
    if (!resolvedKind.kind) {
      return c.json(
        {
          error: "Invalid place kind",
          message: "Geçerli bir yer türü seçimi zorunludur",
        },
        400,
      );
    }

    const resolvedLocation = await resolveProvinceDistrictIds({
      cityId: allowedUpdates.cityId ?? existingPlace.cityId,
      districtId: allowedUpdates.districtId ?? existingPlace.districtId,
      city,
      district,
    });

    const normalizedBusinessDocumentFileId =
      businessDocumentFileId === undefined
        ? existingPlace.businessDocumentFileId
        : normalizeOptionalId(businessDocumentFileId);

    if (businessDocumentFileId !== undefined && normalizedBusinessDocumentFileId) {
      const doc = await getBusinessDocumentById(normalizedBusinessDocumentFileId);
      if (!doc) {
        return c.json(
          {
            error: "Invalid business document",
            message: "Geçersiz işletme belgesi dosyası",
          },
          400,
        );
      }
    }

    const dbUpdates = {
      ...allowedUpdates,
      kind: resolvedKind.kind as any,
      categoryId: resolvedKind.id,
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
      businessDocumentFileId: normalizedBusinessDocumentFileId,
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
