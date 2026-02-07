import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/index.ts";
import {
  district,
  file,
  place,
  placeCategory,
  placeImage,
  province,
  subscription,
  subscriptionPlan,
  user,
} from "../../db/schemas/index.ts";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { getSessionFromRequest } from "../../lib/session.ts";
import {
  derivePlaceTypeFromCategorySlug,
  hydratePlaceMediaAndAmenities,
  replacePlaceAmenities,
  resolvePublicFileUrl,
  resolveCategorySlugsForType,
  resolveProvinceDistrictIds,
} from "../../lib/place-relations.ts";

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
  type: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  cityId: z.string().optional(),
  districtId: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  contactInfo: z.record(z.string(), z.any()).optional(),
  priceLevel: z.enum(["budget", "moderate", "expensive", "luxury"]).optional(),
  nightlyPrice: z.number().min(0).optional(),
  businessDocumentFileId: z.string().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1).max(50),
  openingHours: z.record(z.string(), z.any()).optional(),
  checkInInfo: z.record(z.string(), z.any()).optional(),
  checkOutInfo: z.record(z.string(), z.any()).optional(),
});

const updatePlaceSchema = createPlaceSchema.partial();

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
      filename: `owner-place-${placeId}-${index + 1}`,
      storedFilename: `owner-place-${placeId}-${index + 1}-${Date.now()}`,
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

const DEFAULT_PRICE_LEVEL_THRESHOLDS = {
  budget: 1000,
  moderate: 2500,
  expensive: 5000,
};

const resolvePriceLevelFromThresholds = (
  nightlyPrice: number,
  thresholds: { budget: number; moderate: number; expensive: number },
): "budget" | "moderate" | "expensive" | "luxury" => {
  if (nightlyPrice <= thresholds.budget) return "budget";
  if (nightlyPrice <= thresholds.moderate) return "moderate";
  if (nightlyPrice <= thresholds.expensive) return "expensive";
  return "luxury";
};

const getQuantile = (sortedValues: number[], quantile: number) => {
  if (sortedValues.length === 0) return 0;
  const position = (sortedValues.length - 1) * quantile;
  const baseIndex = Math.floor(position);
  const remainder = position - baseIndex;

  if (sortedValues[baseIndex + 1] !== undefined) {
    return (
      sortedValues[baseIndex] +
      remainder * (sortedValues[baseIndex + 1] - sortedValues[baseIndex])
    );
  }

  return sortedValues[baseIndex];
};

const resolveAutomaticPriceLevel = async ({
  nightlyPrice,
  districtId,
  categoryId,
  excludePlaceId,
}: {
  nightlyPrice?: number | null;
  districtId?: string | null;
  categoryId?: string | null;
  excludePlaceId?: string;
}): Promise<"budget" | "moderate" | "expensive" | "luxury" | null> => {
  if (
    nightlyPrice === null ||
    nightlyPrice === undefined ||
    Number.isNaN(nightlyPrice)
  ) {
    return null;
  }

  if (!districtId || !categoryId) {
    return resolvePriceLevelFromThresholds(
      nightlyPrice,
      DEFAULT_PRICE_LEVEL_THRESHOLDS,
    );
  }

  const conditions = [
    eq(place.districtId, districtId),
    eq(place.categoryId, categoryId),
    sql`${place.nightlyPrice} IS NOT NULL`,
  ];

  if (excludePlaceId) {
    conditions.push(sql`${place.id} <> ${excludePlaceId}`);
  }

  const peerRows = await db
    .select({ nightlyPrice: place.nightlyPrice })
    .from(place)
    .where(and(...conditions));

  const peerPrices = peerRows
    .map((row) => Number.parseFloat(row.nightlyPrice ?? ""))
    .filter((price) => Number.isFinite(price) && price >= 0)
    .sort((a, b) => a - b);

  if (peerPrices.length < 3) {
    return resolvePriceLevelFromThresholds(
      nightlyPrice,
      DEFAULT_PRICE_LEVEL_THRESHOLDS,
    );
  }

  const q1 = getQuantile(peerPrices, 0.25);
  const q2 = getQuantile(peerPrices, 0.5);
  const q3 = getQuantile(peerPrices, 0.75);

  return resolvePriceLevelFromThresholds(nightlyPrice, {
    budget: q1,
    moderate: q2,
    expensive: q3,
  });
};

async function validateBusinessDocumentFileId(
  userId: string,
  businessDocumentFileId: string | null,
) {
  if (!businessDocumentFileId) return null;

  const [uploadedFile] = await db
    .select({
      id: file.id,
      mimeType: file.mimeType,
      uploadedById: file.uploadedById,
      filename: file.filename,
      url: file.url,
      usage: file.usage,
    })
    .from(file)
    .where(and(eq(file.id, businessDocumentFileId), eq(file.uploadedById, userId)))
    .limit(1);

  if (!uploadedFile) {
    throw new Error("İşletme belgesi bulunamadı veya size ait değil");
  }

  if (uploadedFile.mimeType !== "application/pdf") {
    throw new Error("İşletme belgesi PDF olmalıdır");
  }

  if (uploadedFile.usage !== "business_document") {
    throw new Error("İşletme belgesi için geçersiz dosya tipi");
  }

  return uploadedFile;
}

async function getOwnerBusinessDocument(userId: string, businessDocumentFileId: string | null) {
  if (!businessDocumentFileId) return null;

  const [doc] = await db
    .select({
      id: file.id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url,
      uploadedById: file.uploadedById,
      usage: file.usage,
      createdAt: file.createdAt,
    })
    .from(file)
    .where(and(eq(file.id, businessDocumentFileId), eq(file.uploadedById, userId)))
    .limit(1);

  if (!doc || doc.usage !== "business_document") return null;

  return {
    ...doc,
    url: resolvePublicFileUrl(doc.url),
  };
}

async function resolveCategoryId(input: {
  categoryId?: string;
  category?: string;
  type?: string;
  fallbackCategoryId?: string | null;
}): Promise<{ id: string | null; slug: string | null; name: string | null }> {
  const categoryId = normalizeOptionalId(input.categoryId) ?? input.fallbackCategoryId ?? null;
  if (categoryId) {
    const [categoryRow] = await db
      .select({ id: placeCategory.id, slug: placeCategory.slug, name: placeCategory.name })
      .from(placeCategory)
      .where(eq(placeCategory.id, categoryId))
      .limit(1);

    if (categoryRow) {
      return { id: categoryRow.id, slug: categoryRow.slug, name: categoryRow.name };
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
    if (!fallbackSlug) {
      return { id: categoryId, slug: null, name: null };
    }

    const [fallback] = await db
      .select({ id: placeCategory.id, slug: placeCategory.slug, name: placeCategory.name })
      .from(placeCategory)
      .where(eq(placeCategory.slug, fallbackSlug))
      .limit(1);

    if (!fallback) {
      return { id: categoryId, slug: null, name: null };
    }

    return fallback;
  }

  return { id: match.id, slug: match.slug, name: match.name };
}

function toLegacyPlace<T extends {
  categorySlug: string | null;
  categoryName: string | null;
  cityName: string | null;
  districtName: string | null;
}>(placeRow: T) {
  return {
    ...placeRow,
    type: derivePlaceTypeFromCategorySlug(placeRow.categorySlug),
    category: placeRow.categoryName ?? "",
    city: placeRow.cityName ?? "",
    district: placeRow.districtName ?? "",
  };
}

async function fetchOwnerPlaceById(placeId: string, ownerId: string) {
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
      businessDocumentFileId: place.businessDocumentFileId,
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
    .where(and(eq(place.id, placeId), eq(place.ownerId, ownerId)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [hydrated] = await hydratePlaceMediaAndAmenities([toLegacyPlace(row)]);
  const businessDocument = await getOwnerBusinessDocument(
    ownerId,
    row.businessDocumentFileId,
  );
  return {
    ...hydrated,
    businessDocumentFileId: row.businessDocumentFileId,
    businessDocument,
  };
}

async function checkPlaceLimit(
  userId: string,
): Promise<{ allowed: boolean; current: number; max: number }> {
  const [subscriptionData] = await db
    .select({
      maxPlaces: subscriptionPlan.maxPlaces,
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

  const [placeCount] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(place)
    .where(eq(place.ownerId, userId));

  const currentCount = placeCount.count ?? 0;
  const maxPlaces = subscriptionData.maxPlaces || 0;
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
      .where(and(...whereConditions))
      .orderBy(desc(place.createdAt))
      .limit(limitInt)
      .offset(offset);

    const places = await hydratePlaceMediaAndAmenities(rows.map(toLegacyPlace));

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

app.get("/categories", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const categories = await db
      .select({
        id: placeCategory.id,
        name: placeCategory.name,
        slug: placeCategory.slug,
        icon: placeCategory.icon,
      })
      .from(placeCategory)
      .orderBy(asc(placeCategory.name));

    return c.json({ categories });
  } catch (error) {
    console.error("Get owner categories error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/cities", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const cities = await db
      .select({
        id: province.id,
        name: province.name,
        slug: province.slug,
      })
      .from(province)
      .orderBy(asc(province.name));

    return c.json({ cities });
  } catch (error) {
    console.error("Get owner cities error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/districts/:cityId", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const cityIdOrName = c.req.param("cityId").trim();

    const [targetCity] = await db
      .select({ id: province.id, name: province.name })
      .from(province)
      .where(eq(province.id, cityIdOrName))
      .limit(1);

    const resolvedCity =
      targetCity ??
      (
        await db
          .select({ id: province.id, name: province.name })
          .from(province)
          .where(ilike(province.name, cityIdOrName))
          .limit(1)
      )[0];

    if (!resolvedCity) {
      return c.json({ city: null, districts: [] });
    }

    const districts = await db
      .select({
        id: district.id,
        name: district.name,
        slug: district.slug,
      })
      .from(district)
      .where(eq(district.provinceId, resolvedCity.id))
      .orderBy(asc(district.name));

    return c.json({
      city: resolvedCity,
      districts,
    });
  } catch (error) {
    console.error("Get owner districts error:", error);
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

    const resolvedCategory = await resolveCategoryId({
      categoryId: data.categoryId,
      category: data.category,
      type: data.type,
    });

    const resolvedLocation = await resolveProvinceDistrictIds({
      cityId: data.cityId,
      districtId: data.districtId,
      city: data.city,
      district: data.district,
    });

    if (!resolvedCategory.id) {
      return c.json(
        {
          error: "Validation failed",
          message: "Geçerli bir kategori seçimi zorunludur",
        },
        400,
      );
    }

    if (!resolvedLocation.cityId || !resolvedLocation.districtId) {
      return c.json(
        {
          error: "Validation failed",
          message: "Geçerli il ve ilçe seçimi zorunludur",
        },
        400,
      );
    }

    const normalizedBusinessDocumentFileId = normalizeOptionalId(
      data.businessDocumentFileId,
    );
    if (!normalizedBusinessDocumentFileId) {
      return c.json(
        {
          error: "Validation failed",
          message: "İşletme belgesi zorunludur",
        },
        400,
      );
    }

    await validateBusinessDocumentFileId(
      userId,
      normalizedBusinessDocumentFileId,
    );

    const automaticPriceLevel = await resolveAutomaticPriceLevel({
      nightlyPrice: data.nightlyPrice,
      districtId: resolvedLocation.districtId,
      categoryId: resolvedCategory.id,
    });

    const placeId = nanoid();

    await db.insert(place).values({
      id: placeId,
      slug,
      ownerId: userId,
      name: data.name,
      categoryId: resolvedCategory.id,
      description: data.description,
      shortDescription: data.shortDescription,
      address: data.address,
      cityId: resolvedLocation.cityId,
      districtId: resolvedLocation.districtId,
      location: data.location ? JSON.stringify(data.location) : null,
      contactInfo: data.contactInfo ? JSON.stringify(data.contactInfo) : null,
      businessDocumentFileId: normalizedBusinessDocumentFileId,
      openingHours: data.openingHours ? JSON.stringify(data.openingHours) : null,
      checkInInfo: data.checkInInfo ? JSON.stringify(data.checkInInfo) : null,
      checkOutInfo: data.checkOutInfo ? JSON.stringify(data.checkOutInfo) : null,
      priceLevel: automaticPriceLevel,
      nightlyPrice: data.nightlyPrice !== undefined ? data.nightlyPrice.toString() : null,
      status: "pending",
      verified: false,
      featured: false,
      views: 0,
      bookingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (data.images.length > 0) {
      const { filesToInsert, relations } = buildPlaceImages(
        data.images,
        placeId,
        userId,
      );
      await db.insert(file).values(filesToInsert);
      await db.insert(placeImage).values(relations);
    }

    if (data.features && data.features.length > 0) {
      await replacePlaceAmenities(placeId, data.features);
    }

    await db
      .update(user)
      .set({ placeCount: limitCheck.current + 1 })
      .where(eq(user.id, userId));

    const createdPlace = await fetchOwnerPlaceById(placeId, userId);

    return c.json(
      {
        success: true,
        message:
          "Mekanınız başarıyla oluşturuldu. Yöneticiler tarafından incelendikten sonra yayınlanacaktır.",
        place: createdPlace,
      },
      201,
    );
  } catch (error) {
    console.error("Create place error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", issues: error.issues }, 400);
    }
    if (
      error instanceof Error &&
      (error.message.includes("İşletme belgesi") ||
        error.message.includes("belgesi"))
    ) {
      return c.json({ error: "Validation failed", message: error.message }, 400);
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

    const placeData = await fetchOwnerPlaceById(id, userId);

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
      .select({
        id: place.id,
        name: place.name,
        categoryId: place.categoryId,
        description: place.description,
        shortDescription: place.shortDescription,
        address: place.address,
        cityId: place.cityId,
        districtId: place.districtId,
        location: place.location,
        contactInfo: place.contactInfo,
        businessDocumentFileId: place.businessDocumentFileId,
        openingHours: place.openingHours,
        checkInInfo: place.checkInInfo,
        checkOutInfo: place.checkOutInfo,
        nightlyPrice: place.nightlyPrice,
        priceLevel: place.priceLevel,
        status: place.status,
      })
      .from(place)
      .where(and(eq(place.id, id), eq(place.ownerId, userId)))
      .limit(1);

    if (!existingPlace) {
      return c.json({ error: "Place not found" }, 404);
    }

    const resolvedCategory = await resolveCategoryId({
      categoryId: data.categoryId,
      category: data.category,
      type: data.type,
      fallbackCategoryId: existingPlace.categoryId,
    });

    const resolvedLocation = await resolveProvinceDistrictIds({
      cityId: data.cityId ?? existingPlace.cityId,
      districtId: data.districtId ?? existingPlace.districtId,
      city: data.city,
      district: data.district,
    });

    const normalizedBusinessDocumentFileId =
      data.businessDocumentFileId !== undefined
        ? normalizeOptionalId(data.businessDocumentFileId)
        : existingPlace.businessDocumentFileId;

    if (data.businessDocumentFileId !== undefined) {
      if (!normalizedBusinessDocumentFileId) {
        return c.json(
          {
            error: "Validation failed",
            message: "İşletme belgesi boş bırakılamaz",
          },
          400,
        );
      }
      await validateBusinessDocumentFileId(userId, normalizedBusinessDocumentFileId);
    }

    const resolvedNightlyPrice =
      data.nightlyPrice !== undefined
        ? data.nightlyPrice
        : existingPlace.nightlyPrice !== null
          ? Number.parseFloat(existingPlace.nightlyPrice)
          : undefined;

    const automaticPriceLevel = await resolveAutomaticPriceLevel({
      nightlyPrice: resolvedNightlyPrice,
      districtId: resolvedLocation.districtId,
      categoryId: resolvedCategory.id,
      excludePlaceId: id,
    });

    await db
      .update(place)
      .set({
        name: data.name ?? existingPlace.name,
        categoryId: resolvedCategory.id,
        description: data.description ?? existingPlace.description,
        shortDescription: data.shortDescription ?? existingPlace.shortDescription,
        address: data.address ?? existingPlace.address,
        cityId: resolvedLocation.cityId,
        districtId: resolvedLocation.districtId,
        location:
          data.location !== undefined
            ? JSON.stringify(data.location)
            : existingPlace.location,
        contactInfo:
          data.contactInfo !== undefined
            ? JSON.stringify(data.contactInfo)
            : existingPlace.contactInfo,
        businessDocumentFileId: normalizedBusinessDocumentFileId,
        openingHours:
          data.openingHours !== undefined
            ? JSON.stringify(data.openingHours)
            : existingPlace.openingHours,
        checkInInfo:
          data.checkInInfo !== undefined
            ? JSON.stringify(data.checkInInfo)
            : existingPlace.checkInInfo,
        checkOutInfo:
          data.checkOutInfo !== undefined
            ? JSON.stringify(data.checkOutInfo)
            : existingPlace.checkOutInfo,
        nightlyPrice:
          data.nightlyPrice !== undefined
            ? data.nightlyPrice.toString()
            : existingPlace.nightlyPrice,
        priceLevel: automaticPriceLevel,
        status:
          existingPlace.status === "rejected"
            ? "pending"
            : existingPlace.status,
        updatedAt: new Date(),
      })
      .where(and(eq(place.id, id), eq(place.ownerId, userId)));

    if (data.images) {
      const existingImageLinks = await db
        .select({ fileId: placeImage.fileId })
        .from(placeImage)
        .where(eq(placeImage.placeId, id));

      const existingFileIds = existingImageLinks.map((img) => img.fileId);

      await db.delete(placeImage).where(eq(placeImage.placeId, id));

      if (existingFileIds.length > 0) {
        await db.delete(file).where(inArray(file.id, existingFileIds));
      }

      if (data.images.length > 0) {
        const { filesToInsert, relations } = buildPlaceImages(data.images, id, userId);
        await db.insert(file).values(filesToInsert);
        await db.insert(placeImage).values(relations);
      }
    }

    if (data.features !== undefined) {
      await replacePlaceAmenities(id, data.features);
    }

    const updatedPlace = await fetchOwnerPlaceById(id, userId);

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
    if (
      error instanceof Error &&
      (error.message.includes("İşletme belgesi") ||
        error.message.includes("belgesi"))
    ) {
      return c.json({ error: "Validation failed", message: error.message }, 400);
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
      .select({
        status: place.status,
        businessDocumentFileId: place.businessDocumentFileId,
      })
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

    if (!existingPlace.businessDocumentFileId) {
      return c.json(
        {
          error: "Business document required",
          message:
            "Mekanı yeniden incelemeye göndermeden önce işletme belgesi yüklemelisiniz",
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
