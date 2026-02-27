import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/index.ts";
import {
  booking,
  activityPackage,
  activityPackageMedia,
  activityPackagePriceTier,
  diningMenu,
  diningMenuItem,
  diningMenuItemTag,
  diningMenuSection,
  district,
  file,
  hotelRoom,
  hotelRoomAvailabilityBlock,
  hotelRoomFeature,
  hotelRoomMedia,
  hotelRoomRate,
  place,
  placeAvailabilityBlock,
  placePriceRule,
  placeKind,
  placeImage,
  province,
  user,
} from "../../db/schemas/index.ts";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import { getSessionFromRequest } from "../../lib/session.ts";
import {
  derivePlaceTypeFromCategorySlug,
  hydratePlaceMediaAndAmenities,
  replacePlaceAmenities,
  resolvePublicFileUrl,
  resolvePlaceKindIdsForType,
  resolveProvinceDistrictIds,
} from "../../lib/place-relations.ts";
import {
  getActiveSubscriptionForUser,
  getCurrentUsageByResource,
  getEntitlementsForPlan,
  resolveResourceKeyForPlaceKind,
} from "../../lib/plan-entitlements.ts";
import { evaluateEntitlementLimit } from "../../lib/entitlement-evaluator.ts";
import {
  isStayPlaceKind,
  supportsMenuForKind,
  supportsPackagesForKind,
  supportsRoomsForKind,
} from "../../lib/place-kind-registry.ts";
import { maybeAutoCompleteBookings } from "../../lib/booking-domain.ts";

const app = new Hono();

const placeStatusEnum = [
  "active",
  "inactive",
  "pending",
  "suspended",
  "rejected",
] as const;

const OWNER_PLACE_KIND_IDS = [
  "villa",
  "bungalow_tiny_house",
  "hotel_pension",
  "detached_house_apartment",
  "camp_site",
  "transfer",
  "boat_tour",
  "paragliding_microlight_skydiving",
  "safari",
  "water_sports",
  "ski",
  "balloon_tour",
] as const;

const placeKindEnum = z.enum(OWNER_PLACE_KIND_IDS);

const placeBaseSchema = z.object({
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
  contactInfo: z.record(z.string(), z.unknown()).optional(),
  priceLevel: z.enum(["budget", "moderate", "expensive", "luxury"]).optional(),
  nightlyPrice: z.number().min(0).optional(),
  businessDocumentFileId: z.string().optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1).max(50),
  openingHours: z.record(z.string(), z.unknown()).optional(),
  checkInInfo: z.record(z.string(), z.unknown()).optional(),
  checkOutInfo: z.record(z.string(), z.unknown()).optional(),
});

const createPlaceSchema = placeBaseSchema.extend({ kind: placeKindEnum });

const updatePlaceSchema = placeBaseSchema
  .partial()
  .extend({
    kind: placeKindEnum.optional(),
  });

const roomFeatureSchema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  maxAdults: z.number().int().min(1).max(20).default(2),
  maxChildren: z.number().int().min(0).max(20).default(0),
  bedCount: z.number().int().min(0).max(20).optional(),
  bathroomCount: z.number().int().min(0).max(20).optional(),
  areaSqm: z.number().min(0).optional(),
  baseNightlyPrice: z.number().min(0).optional(),
  status: z.enum(["active", "inactive", "maintenance"]).default("active"),
  features: z.array(roomFeatureSchema).optional(),
  mediaFileIds: z.array(z.string()).max(30).optional(),
});

const updateRoomSchema = createRoomSchema.partial();

const createRoomRateSchema = z.object({
  startsOn: z.string().min(1),
  endsOn: z.string().min(1),
  nightlyPrice: z.number().min(0),
  minStayNights: z.number().int().min(1).default(1),
  maxStayNights: z.number().int().min(1).optional(),
  isRefundable: z.boolean().default(true),
});

const updateRoomRateSchema = createRoomRateSchema.partial();

const createPlacePriceRuleSchema = z.object({
  startsOn: z.string().min(1),
  endsOn: z.string().min(1),
  nightlyPrice: z.number().min(0),
});

const updatePlacePriceRuleSchema = createPlacePriceRuleSchema.partial();

const createAvailabilityBlockSchema = z.object({
  startsOn: z.string().min(1),
  endsOn: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
});

const reservationStatusUpdateSchema = z.object({
  status: z.enum(["confirmed", "cancelled"]),
  reason: z.string().trim().max(500).optional(),
});

const reservationPaymentUpdateSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "refunded"]),
  reason: z.string().trim().max(500).optional(),
});

const menuItemInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  price: z.number().min(0).optional(),
  imageFileId: z.string().optional(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
});

const menuSectionInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  sortOrder: z.number().int().min(0).default(0),
  items: z.array(menuItemInputSchema).default([]),
});

const menuInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  sections: z.array(menuSectionInputSchema).default([]),
});

const upsertDiningMenuSchema = z.object({
  menus: z.array(menuInputSchema).min(1),
});

const packagePriceTierInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  minGroupSize: z.number().int().min(1).optional(),
  maxGroupSize: z.number().int().min(1).optional(),
  price: z.number().min(0),
  sortOrder: z.number().int().min(0).default(0),
});

const createActivityPackageSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  price: z.number().min(0).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  minParticipants: z.number().int().min(1).optional(),
  maxParticipants: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  mediaFileIds: z.array(z.string()).max(30).optional(),
  priceTiers: z.array(packagePriceTierInputSchema).optional(),
});

const updateActivityPackageSchema = createActivityPackageSchema.partial();

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

const normalizeSlugBase = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-+/g, "-");

const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, "\\$&");

const resolveUniquePlaceSlug = async (name: string): Promise<string> => {
  const baseSlug = normalizeSlugBase(name) || "mekan";
  const likePattern = `${escapeLikePattern(baseSlug)}%`;

  const existingRows = await db
    .select({ slug: place.slug })
    .from(place)
    .where(sql`${place.slug} LIKE ${likePattern} ESCAPE '\\'`);

  const existingSlugs = new Set(existingRows.map((row) => row.slug));
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
};

const isUniqueViolationError = (error: unknown): boolean => {
  const err = error as { code?: string; cause?: { code?: string } } | null;
  return err?.code === "23505" || err?.cause?.code === "23505";
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
  kind,
  excludePlaceId,
}: {
  nightlyPrice?: number | null;
  districtId?: string | null;
  kind?: string | null;
  excludePlaceId?: string;
}): Promise<"budget" | "moderate" | "expensive" | "luxury" | null> => {
  if (
    nightlyPrice === null ||
    nightlyPrice === undefined ||
    Number.isNaN(nightlyPrice)
  ) {
    return null;
  }

  if (!districtId || !kind) {
    return resolvePriceLevelFromThresholds(
      nightlyPrice,
      DEFAULT_PRICE_LEVEL_THRESHOLDS,
    );
  }

  const conditions = [
    eq(place.districtId, districtId),
    eq(place.kind, kind as any),
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

async function resolvePlaceKindInput(input: {
  kind?: string;
  categoryId?: string;
  category?: string;
  type?: string;
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
    const [kindRow] = await db
      .select({ id: placeKind.id, slug: placeKind.slug, name: placeKind.name })
      .from(placeKind)
      .where(eq(placeKind.id, kindInput))
      .limit(1);

    if (kindRow) {
      return {
        kind: kindRow.id,
        id: kindRow.id,
        slug: kindRow.slug,
        name: kindRow.name,
      };
    }
  }

  const categoryId =
    normalizeOptionalId(input.categoryId) ?? input.fallbackKindId ?? null;
  if (categoryId) {
    const [kindRow] = await db
      .select({ id: placeKind.id, slug: placeKind.slug, name: placeKind.name })
      .from(placeKind)
      .where(eq(placeKind.id, categoryId))
      .limit(1);

    if (kindRow) {
      return {
        kind: kindRow.id,
        id: kindRow.id,
        slug: kindRow.slug,
        name: kindRow.name,
      };
    }
  }

  const categoryText = input.category?.trim();
  if (!categoryText) {
    const fallbackKind = input.fallbackKind ?? null;
    return {
      kind: fallbackKind,
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

function toLegacyPlace<T extends {
  kind: string;
  kindSlug: string | null;
  kindName: string | null;
  cityName: string | null;
  districtName: string | null;
}>(placeRow: T) {
  return {
    ...placeRow,
    type: derivePlaceTypeFromCategorySlug(placeRow.kindSlug),
    category: placeRow.kindName ?? "",
    categoryId: placeRow.kind,
    categorySlug: placeRow.kindSlug,
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
      kind: place.kind,
      categoryId: place.kind,
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
      kindName: placeKind.name,
      kindSlug: placeKind.slug,
      categoryName: placeKind.name,
      categorySlug: placeKind.slug,
      cityName: province.name,
      districtName: district.name,
    })
    .from(place)
    .leftJoin(placeKind, eq(place.kind, placeKind.id as any))
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
  kind: string,
): Promise<{
  allowed: boolean;
  current: number;
  max: number | null;
  isUnlimited: boolean;
}> {
  const activeSubscription = await getActiveSubscriptionForUser(userId);
  if (!activeSubscription) {
    return { allowed: false, current: 0, max: 0, isUnlimited: false };
  }

  const now = new Date();
  const endDate = new Date(activeSubscription.endDate);
  if (endDate < now) {
    return { allowed: false, current: 0, max: 0, isUnlimited: false };
  }

  const [usageByResource, entitlements] = await Promise.all([
    getCurrentUsageByResource(userId),
    getEntitlementsForPlan(activeSubscription.planId),
  ]);

  const resourceKey = resolveResourceKeyForPlaceKind(kind);
  return evaluateEntitlementLimit({
    resourceKey,
    entitlements,
    usageByResource,
  });
}

type OwnerPlaceContext = {
  id: string;
  kind: string;
  name: string;
};

async function getOwnedPlaceContext(
  placeId: string,
  userId: string,
): Promise<OwnerPlaceContext | null> {
  const [row] = await db
    .select({
      id: place.id,
      kind: place.kind,
      name: place.name,
    })
    .from(place)
    .where(and(eq(place.id, placeId), eq(place.ownerId, userId)))
    .limit(1);

  return row ?? null;
}

async function ensureOwnedFiles(fileIds: string[], userId: string): Promise<boolean> {
  if (fileIds.length === 0) return true;

  const rows = await db
    .select({ id: file.id })
    .from(file)
    .where(and(eq(file.uploadedById, userId), inArray(file.id, fileIds)));

  return rows.length === fileIds.length;
}

const normalizeIdList = (values: string[] | undefined): string[] =>
  Array.from(
    new Set((values ?? []).map((item) => item.trim()).filter((item) => item.length > 0)),
  );

const normalizeOptionalSlug = (value: string | undefined, fallbackName: string): string =>
  normalizeSlugBase(value && value.trim().length > 0 ? value : fallbackName).slice(0, 200);

async function loadRoomsForPlace(placeId: string) {
  const rooms = await db
    .select({
      id: hotelRoom.id,
      placeId: hotelRoom.placeId,
      slug: hotelRoom.slug,
      name: hotelRoom.name,
      description: hotelRoom.description,
      maxAdults: hotelRoom.maxAdults,
      maxChildren: hotelRoom.maxChildren,
      bedCount: hotelRoom.bedCount,
      bathroomCount: hotelRoom.bathroomCount,
      areaSqm: hotelRoom.areaSqm,
      baseNightlyPrice: hotelRoom.baseNightlyPrice,
      status: hotelRoom.status,
      createdAt: hotelRoom.createdAt,
      updatedAt: hotelRoom.updatedAt,
    })
    .from(hotelRoom)
    .where(eq(hotelRoom.placeId, placeId))
    .orderBy(asc(hotelRoom.createdAt));

  if (rooms.length === 0) return [];

  const roomIds = rooms.map((room) => room.id);
  const [featureRows, mediaRows, rateRows] = await Promise.all([
    db
      .select({
        roomId: hotelRoomFeature.roomId,
        key: hotelRoomFeature.key,
        value: hotelRoomFeature.value,
        sortOrder: hotelRoomFeature.sortOrder,
      })
      .from(hotelRoomFeature)
      .where(inArray(hotelRoomFeature.roomId, roomIds))
      .orderBy(asc(hotelRoomFeature.roomId), asc(hotelRoomFeature.sortOrder)),
    db
      .select({
        roomId: hotelRoomMedia.roomId,
        fileId: hotelRoomMedia.fileId,
        url: file.url,
        sortOrder: hotelRoomMedia.sortOrder,
      })
      .from(hotelRoomMedia)
      .innerJoin(file, eq(hotelRoomMedia.fileId, file.id))
      .where(inArray(hotelRoomMedia.roomId, roomIds))
      .orderBy(asc(hotelRoomMedia.roomId), asc(hotelRoomMedia.sortOrder)),
    db
      .select({
        id: hotelRoomRate.id,
        roomId: hotelRoomRate.roomId,
        startsOn: hotelRoomRate.startsOn,
        endsOn: hotelRoomRate.endsOn,
        nightlyPrice: hotelRoomRate.nightlyPrice,
        minStayNights: hotelRoomRate.minStayNights,
        maxStayNights: hotelRoomRate.maxStayNights,
        isRefundable: hotelRoomRate.isRefundable,
      })
      .from(hotelRoomRate)
      .where(inArray(hotelRoomRate.roomId, roomIds))
      .orderBy(asc(hotelRoomRate.roomId), asc(hotelRoomRate.startsOn)),
  ]);

  const featureMap = new Map<string, typeof featureRows>();
  for (const row of featureRows) {
    const current = featureMap.get(row.roomId) ?? [];
    current.push(row);
    featureMap.set(row.roomId, current);
  }

  const mediaMap = new Map<string, typeof mediaRows>();
  for (const row of mediaRows) {
    const current = mediaMap.get(row.roomId) ?? [];
    current.push(row);
    mediaMap.set(row.roomId, current);
  }

  const rateMap = new Map<string, typeof rateRows>();
  for (const row of rateRows) {
    const current = rateMap.get(row.roomId) ?? [];
    current.push(row);
    rateMap.set(row.roomId, current);
  }

  return rooms.map((room) => ({
    ...room,
    features: featureMap.get(room.id) ?? [],
    media:
      mediaMap.get(room.id)?.map((item) => ({
        fileId: item.fileId,
        url: resolvePublicFileUrl(item.url),
        sortOrder: item.sortOrder,
      })) ?? [],
    rates: rateMap.get(room.id) ?? [],
  }));
}

async function loadDiningMenusForPlace(placeId: string) {
  const menus = await db
    .select({
      id: diningMenu.id,
      placeId: diningMenu.placeId,
      name: diningMenu.name,
      description: diningMenu.description,
      isActive: diningMenu.isActive,
      sortOrder: diningMenu.sortOrder,
      createdAt: diningMenu.createdAt,
      updatedAt: diningMenu.updatedAt,
    })
    .from(diningMenu)
    .where(eq(diningMenu.placeId, placeId))
    .orderBy(asc(diningMenu.sortOrder), asc(diningMenu.createdAt));

  if (menus.length === 0) return [];

  const menuIds = menus.map((item) => item.id);
  const sections = await db
    .select({
      id: diningMenuSection.id,
      menuId: diningMenuSection.menuId,
      name: diningMenuSection.name,
      description: diningMenuSection.description,
      sortOrder: diningMenuSection.sortOrder,
      createdAt: diningMenuSection.createdAt,
    })
    .from(diningMenuSection)
    .where(inArray(diningMenuSection.menuId, menuIds))
    .orderBy(asc(diningMenuSection.menuId), asc(diningMenuSection.sortOrder));

  if (sections.length === 0) {
    return menus.map((menu) => ({ ...menu, sections: [] }));
  }

  const sectionIds = sections.map((item) => item.id);
  const items = await db
    .select({
      id: diningMenuItem.id,
      sectionId: diningMenuItem.sectionId,
      name: diningMenuItem.name,
      description: diningMenuItem.description,
      price: diningMenuItem.price,
      imageFileId: diningMenuItem.imageFileId,
      imageUrl: file.url,
      isAvailable: diningMenuItem.isAvailable,
      sortOrder: diningMenuItem.sortOrder,
      createdAt: diningMenuItem.createdAt,
      updatedAt: diningMenuItem.updatedAt,
    })
    .from(diningMenuItem)
    .leftJoin(file, eq(diningMenuItem.imageFileId, file.id))
    .where(inArray(diningMenuItem.sectionId, sectionIds))
    .orderBy(asc(diningMenuItem.sectionId), asc(diningMenuItem.sortOrder));

  const itemIds = items.map((item) => item.id);
  const tags =
    itemIds.length > 0
      ? await db
          .select({
            itemId: diningMenuItemTag.itemId,
            tag: diningMenuItemTag.tag,
          })
          .from(diningMenuItemTag)
          .where(inArray(diningMenuItemTag.itemId, itemIds))
      : [];

  const tagsMap = new Map<string, string[]>();
  for (const row of tags) {
    const current = tagsMap.get(row.itemId) ?? [];
    current.push(row.tag);
    tagsMap.set(row.itemId, current);
  }

  const itemMap = new Map<string, Array<(typeof items)[number] & { tags: string[] }>>();
  for (const item of items) {
    const current = itemMap.get(item.sectionId) ?? [];
    current.push({
      ...item,
      imageUrl: item.imageUrl ? resolvePublicFileUrl(item.imageUrl) : null,
      tags: tagsMap.get(item.id) ?? [],
    });
    itemMap.set(item.sectionId, current);
  }

  const sectionMap = new Map<string, Array<(typeof sections)[number] & { items: unknown[] }>>();
  for (const section of sections) {
    const current = sectionMap.get(section.menuId) ?? [];
    current.push({
      ...section,
      items: itemMap.get(section.id) ?? [],
    });
    sectionMap.set(section.menuId, current);
  }

  return menus.map((menu) => ({
    ...menu,
    sections: sectionMap.get(menu.id) ?? [],
  }));
}

async function loadActivityPackagesForPlace(placeId: string) {
  const packages = await db
    .select({
      id: activityPackage.id,
      placeId: activityPackage.placeId,
      name: activityPackage.name,
      description: activityPackage.description,
      price: activityPackage.price,
      durationMinutes: activityPackage.durationMinutes,
      minParticipants: activityPackage.minParticipants,
      maxParticipants: activityPackage.maxParticipants,
      isActive: activityPackage.isActive,
      sortOrder: activityPackage.sortOrder,
      createdAt: activityPackage.createdAt,
      updatedAt: activityPackage.updatedAt,
    })
    .from(activityPackage)
    .where(eq(activityPackage.placeId, placeId))
    .orderBy(asc(activityPackage.sortOrder), asc(activityPackage.createdAt));

  if (packages.length === 0) return [];

  const packageIds = packages.map((item) => item.id);
  const [mediaRows, tierRows] = await Promise.all([
    db
      .select({
        packageId: activityPackageMedia.packageId,
        fileId: activityPackageMedia.fileId,
        url: file.url,
        sortOrder: activityPackageMedia.sortOrder,
      })
      .from(activityPackageMedia)
      .innerJoin(file, eq(activityPackageMedia.fileId, file.id))
      .where(inArray(activityPackageMedia.packageId, packageIds))
      .orderBy(asc(activityPackageMedia.packageId), asc(activityPackageMedia.sortOrder)),
    db
      .select({
        id: activityPackagePriceTier.id,
        packageId: activityPackagePriceTier.packageId,
        name: activityPackagePriceTier.name,
        minGroupSize: activityPackagePriceTier.minGroupSize,
        maxGroupSize: activityPackagePriceTier.maxGroupSize,
        price: activityPackagePriceTier.price,
        sortOrder: activityPackagePriceTier.sortOrder,
      })
      .from(activityPackagePriceTier)
      .where(inArray(activityPackagePriceTier.packageId, packageIds))
      .orderBy(asc(activityPackagePriceTier.packageId), asc(activityPackagePriceTier.sortOrder)),
  ]);

  const mediaMap = new Map<string, typeof mediaRows>();
  for (const row of mediaRows) {
    const current = mediaMap.get(row.packageId) ?? [];
    current.push(row);
    mediaMap.set(row.packageId, current);
  }

  const tierMap = new Map<string, typeof tierRows>();
  for (const row of tierRows) {
    const current = tierMap.get(row.packageId) ?? [];
    current.push(row);
    tierMap.set(row.packageId, current);
  }

  return packages.map((item) => ({
    ...item,
    media:
      mediaMap.get(item.id)?.map((media) => ({
        fileId: media.fileId,
        url: resolvePublicFileUrl(media.url),
        sortOrder: media.sortOrder,
      })) ?? [],
    priceTiers: tierMap.get(item.id) ?? [],
  }));
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
        kind: place.kind,
        categoryId: place.kind,
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
        kindName: placeKind.name,
        kindSlug: placeKind.slug,
        categoryName: placeKind.name,
        categorySlug: placeKind.slug,
        cityName: province.name,
        districtName: district.name,
      })
      .from(place)
      .leftJoin(placeKind, eq(place.kind, placeKind.id as any))
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

app.get("/kinds", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const kinds = await db
      .select({
        id: placeKind.id,
        name: placeKind.name,
        slug: placeKind.slug,
        icon: placeKind.icon,
        description: placeKind.description,
        monetized: placeKind.monetized,
        supportsRooms: placeKind.supportsRooms,
        supportsMenu: placeKind.supportsMenu,
        supportsPackages: placeKind.supportsPackages,
      })
      .from(placeKind)
      .where(eq(placeKind.active, true))
      .orderBy(asc(placeKind.sortOrder), asc(placeKind.name));

    return c.json({ kinds, categories: kinds });
  } catch (error) {
    console.error("Get owner kinds error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/categories", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const kinds = await db
      .select({
        id: placeKind.id,
        name: placeKind.name,
        slug: placeKind.slug,
        icon: placeKind.icon,
        description: placeKind.description,
        monetized: placeKind.monetized,
        supportsRooms: placeKind.supportsRooms,
        supportsMenu: placeKind.supportsMenu,
        supportsPackages: placeKind.supportsPackages,
      })
      .from(placeKind)
      .where(eq(placeKind.active, true))
      .orderBy(asc(placeKind.sortOrder), asc(placeKind.name));

    return c.json({ categories: kinds, kinds });
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

    const slug = await resolveUniquePlaceSlug(data.name);

    const resolvedKind = await resolvePlaceKindInput({
      kind: data.kind,
      categoryId: data.categoryId,
      category: data.category,
      type: data.type,
    });

    if (!resolvedKind.kind) {
      return c.json(
        {
          error: "Validation failed",
          message: "Geçerli bir yer türü seçimi zorunludur",
        },
        400,
      );
    }

    const limitCheck = await checkPlaceLimit(userId, resolvedKind.kind);
    if (!limitCheck.allowed) {
      const limitText = limitCheck.isUnlimited
        ? "∞"
        : `${limitCheck.current}/${limitCheck.max ?? 0}`;
      return c.json(
        {
          error: "Plan limit reached",
          message: `Bu tür için mekan limitinize ulaştınız (${limitText}). Lütfen abonelik planınızı yükseltin.`,
          current: limitCheck.current,
          max: limitCheck.max,
          kind: resolvedKind.kind,
        },
        403,
      );
    }

    const resolvedLocation = await resolveProvinceDistrictIds({
      cityId: data.cityId,
      districtId: data.districtId,
      city: data.city,
      district: data.district,
    });

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
      kind: resolvedKind.kind,
    });

    const placeId = nanoid();

    await db.insert(place).values({
      id: placeId,
      slug,
      ownerId: userId,
      name: data.name,
      kind: resolvedKind.kind as any,
      categoryId: resolvedKind.id,
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
    if (isUniqueViolationError(error)) {
      return c.json(
        {
          error: "Conflict",
          message:
            "Bu mekan adı için benzersiz bir URL oluşturulamadı. Lütfen tekrar deneyin.",
        },
        409,
      );
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

const resolveUniqueRoomSlug = async ({
  placeId,
  slugOrName,
  excludeRoomId,
}: {
  placeId: string;
  slugOrName: string;
  excludeRoomId?: string;
}) => {
  const baseSlug = normalizeSlugBase(slugOrName).slice(0, 200) || "room";
  const likePattern = `${escapeLikePattern(baseSlug)}%`;

  const rows = await db
    .select({
      id: hotelRoom.id,
      slug: hotelRoom.slug,
    })
    .from(hotelRoom)
    .where(
      and(
        eq(hotelRoom.placeId, placeId),
        sql`${hotelRoom.slug} LIKE ${likePattern} ESCAPE '\\'`,
      ),
    );

  const existing = new Set(
    rows.filter((row) => row.id !== excludeRoomId).map((row) => row.slug),
  );
  if (!existing.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existing.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
};

async function getOwnedRoomContext({
  placeId,
  roomId,
  userId,
}: {
  placeId: string;
  roomId: string;
  userId: string;
}) {
  const [row] = await db
    .select({
      id: hotelRoom.id,
      placeId: hotelRoom.placeId,
      slug: hotelRoom.slug,
    })
    .from(hotelRoom)
    .innerJoin(place, eq(hotelRoom.placeId, place.id))
    .where(
      and(
        eq(hotelRoom.id, roomId),
        eq(hotelRoom.placeId, placeId),
        eq(place.ownerId, userId),
      ),
    )
    .limit(1);

  return row ?? null;
}

async function getOwnedPackageContext({
  placeId,
  packageId,
  userId,
}: {
  placeId: string;
  packageId: string;
  userId: string;
}) {
  const [row] = await db
    .select({
      id: activityPackage.id,
      placeId: activityPackage.placeId,
    })
    .from(activityPackage)
    .innerJoin(place, eq(activityPackage.placeId, place.id))
    .where(
      and(
        eq(activityPackage.id, packageId),
        eq(activityPackage.placeId, placeId),
        eq(place.ownerId, userId),
      ),
    )
    .limit(1);

  return row ?? null;
}

const isStayKind = (kind: string) => isStayPlaceKind(kind);

const parsePricingSnapshot = (input: string | null) => {
  if (!input) return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};

const mapReservationStatusForOwner = (
  current: "pending" | "confirmed" | "cancelled" | "completed",
  next: "confirmed" | "cancelled",
) => {
  if (current === "completed") {
    return {
      ok: false as const,
      message: "Tamamlanmış rezervasyon güncellenemez",
    };
  }

  if (current === "cancelled") {
    return {
      ok: false as const,
      message: "İptal edilen rezervasyon güncellenemez",
    };
  }

  if (current === "pending" && (next === "confirmed" || next === "cancelled")) {
    return { ok: true as const };
  }

  if (current === "confirmed" && next === "cancelled") {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    message: "Bu durum geçişine izin verilmiyor",
  };
};

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const validateInclusiveDateRange = (startsOn: string, endsOn: string) => {
  if (!DATE_ONLY_REGEX.test(startsOn) || !DATE_ONLY_REGEX.test(endsOn)) {
    return {
      ok: false as const,
      message: "Tarihler YYYY-MM-DD formatında olmalıdır",
    };
  }

  if (startsOn > endsOn) {
    return {
      ok: false as const,
      message: "Başlangıç tarihi bitiş tarihinden sonra olamaz",
    };
  }

  return { ok: true as const };
};

app.get("/:id/rooms", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);

    if (!supportsRoomsForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message: "Bu mekan türü oda yönetimini desteklemiyor",
        },
        400,
      );
    }

    const rooms = await loadRoomsForPlace(placeId);
    return c.json({ rooms });
  } catch (error) {
    console.error("Get owner rooms error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/:id/rooms", zValidator("json", createRoomSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const data = c.req.valid("json");

    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!supportsRoomsForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message: "Bu mekan türü oda yönetimini desteklemiyor",
        },
        400,
      );
    }

    const mediaFileIds = normalizeIdList(data.mediaFileIds);
    if (!(await ensureOwnedFiles(mediaFileIds, userId))) {
      return c.json(
        {
          error: "Validation failed",
          message: "Oda görsellerinde size ait olmayan dosya var",
        },
        400,
      );
    }

    const slug = await resolveUniqueRoomSlug({
      placeId,
      slugOrName: normalizeOptionalSlug(data.slug, data.name),
    });

    const roomId = crypto.randomUUID();
    await db.insert(hotelRoom).values({
      id: roomId,
      placeId,
      slug,
      name: data.name,
      description: data.description,
      maxAdults: data.maxAdults,
      maxChildren: data.maxChildren,
      bedCount: data.bedCount,
      bathroomCount: data.bathroomCount,
      areaSqm: data.areaSqm !== undefined ? data.areaSqm.toString() : null,
      baseNightlyPrice:
        data.baseNightlyPrice !== undefined ? data.baseNightlyPrice.toString() : null,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (data.features && data.features.length > 0) {
      await db.insert(hotelRoomFeature).values(
        data.features.map((feature, index) => ({
          roomId,
          key: feature.key,
          value: feature.value ?? null,
          sortOrder: feature.sortOrder ?? index,
        })),
      );
    }

    if (mediaFileIds.length > 0) {
      await db.insert(hotelRoomMedia).values(
        mediaFileIds.map((fileId, index) => ({
          roomId,
          fileId,
          sortOrder: index,
        })),
      );
    }

    const rooms = await loadRoomsForPlace(placeId);
    const room = rooms.find((item) => item.id === roomId) ?? null;
    return c.json({ success: true, room }, 201);
  } catch (error) {
    console.error("Create owner room error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/:id/rooms/:roomId", zValidator("json", updateRoomSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const roomId = c.req.param("roomId");
    const data = c.req.valid("json");

    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!supportsRoomsForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message: "Bu mekan türü oda yönetimini desteklemiyor",
        },
        400,
      );
    }

    const roomCtx = await getOwnedRoomContext({ placeId, roomId, userId });
    if (!roomCtx) return c.json({ error: "Room not found" }, 404);

    const mediaFileIds =
      data.mediaFileIds !== undefined ? normalizeIdList(data.mediaFileIds) : undefined;
    if (mediaFileIds && !(await ensureOwnedFiles(mediaFileIds, userId))) {
      return c.json(
        {
          error: "Validation failed",
          message: "Oda görsellerinde size ait olmayan dosya var",
        },
        400,
      );
    }

    const updatePayload: Partial<typeof hotelRoom.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.slug !== undefined || data.name !== undefined) {
      updatePayload.slug = await resolveUniqueRoomSlug({
        placeId,
        slugOrName: normalizeOptionalSlug(data.slug, data.name ?? roomCtx.slug),
        excludeRoomId: roomId,
      });
    }
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.maxAdults !== undefined) updatePayload.maxAdults = data.maxAdults;
    if (data.maxChildren !== undefined) updatePayload.maxChildren = data.maxChildren;
    if (data.bedCount !== undefined) updatePayload.bedCount = data.bedCount;
    if (data.bathroomCount !== undefined) updatePayload.bathroomCount = data.bathroomCount;
    if (data.areaSqm !== undefined)
      updatePayload.areaSqm = data.areaSqm !== undefined ? data.areaSqm.toString() : null;
    if (data.baseNightlyPrice !== undefined)
      updatePayload.baseNightlyPrice =
        data.baseNightlyPrice !== undefined ? data.baseNightlyPrice.toString() : null;
    if (data.status !== undefined) updatePayload.status = data.status;

    await db.update(hotelRoom).set(updatePayload).where(eq(hotelRoom.id, roomId));

    if (data.features !== undefined) {
      await db.delete(hotelRoomFeature).where(eq(hotelRoomFeature.roomId, roomId));
      if (data.features.length > 0) {
        await db.insert(hotelRoomFeature).values(
          data.features.map((feature, index) => ({
            roomId,
            key: feature.key,
            value: feature.value ?? null,
            sortOrder: feature.sortOrder ?? index,
          })),
        );
      }
    }

    if (mediaFileIds !== undefined) {
      await db.delete(hotelRoomMedia).where(eq(hotelRoomMedia.roomId, roomId));
      if (mediaFileIds.length > 0) {
        await db.insert(hotelRoomMedia).values(
          mediaFileIds.map((fileId, index) => ({
            roomId,
            fileId,
            sortOrder: index,
          })),
        );
      }
    }

    const rooms = await loadRoomsForPlace(placeId);
    const room = rooms.find((item) => item.id === roomId) ?? null;
    return c.json({ success: true, room });
  } catch (error) {
    console.error("Update owner room error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/:id/rooms/:roomId", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const roomId = c.req.param("roomId");

    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!supportsRoomsForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message: "Bu mekan türü oda yönetimini desteklemiyor",
        },
        400,
      );
    }

    const roomCtx = await getOwnedRoomContext({ placeId, roomId, userId });
    if (!roomCtx) return c.json({ error: "Room not found" }, 404);

    await db.delete(hotelRoom).where(eq(hotelRoom.id, roomId));
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete owner room error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/:id/rooms/:roomId/rates", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const roomId = c.req.param("roomId");

    const roomCtx = await getOwnedRoomContext({ placeId, roomId, userId });
    if (!roomCtx) return c.json({ error: "Room not found" }, 404);

    const rates = await db
      .select()
      .from(hotelRoomRate)
      .where(eq(hotelRoomRate.roomId, roomId))
      .orderBy(asc(hotelRoomRate.startsOn));

    return c.json({ rates });
  } catch (error) {
    console.error("Get owner room rates error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post(
  "/:id/rooms/:roomId/rates",
  zValidator("json", createRoomRateSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

      const userId = session.user.id;
      const placeId = c.req.param("id");
      const roomId = c.req.param("roomId");
      const data = c.req.valid("json");

      const roomCtx = await getOwnedRoomContext({ placeId, roomId, userId });
      if (!roomCtx) return c.json({ error: "Room not found" }, 404);
      if (data.startsOn > data.endsOn) {
        return c.json(
          { error: "Validation failed", message: "Başlangıç tarihi bitişten sonra olamaz" },
          400,
        );
      }

      const rateId = crypto.randomUUID();
      await db.insert(hotelRoomRate).values({
        id: rateId,
        roomId,
        startsOn: data.startsOn,
        endsOn: data.endsOn,
        nightlyPrice: data.nightlyPrice.toString(),
        minStayNights: data.minStayNights,
        maxStayNights: data.maxStayNights,
        isRefundable: data.isRefundable,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const [rate] = await db
        .select()
        .from(hotelRoomRate)
        .where(eq(hotelRoomRate.id, rateId))
        .limit(1);

      return c.json({ success: true, rate }, 201);
    } catch (error) {
      console.error("Create owner room rate error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

app.put(
  "/:id/rooms/:roomId/rates/:rateId",
  zValidator("json", updateRoomRateSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

      const userId = session.user.id;
      const placeId = c.req.param("id");
      const roomId = c.req.param("roomId");
      const rateId = c.req.param("rateId");
      const data = c.req.valid("json");

      const roomCtx = await getOwnedRoomContext({ placeId, roomId, userId });
      if (!roomCtx) return c.json({ error: "Room not found" }, 404);

      const [existingRate] = await db
        .select()
        .from(hotelRoomRate)
        .where(and(eq(hotelRoomRate.id, rateId), eq(hotelRoomRate.roomId, roomId)))
        .limit(1);
      if (!existingRate) return c.json({ error: "Rate not found" }, 404);

      const startsOn = data.startsOn ?? existingRate.startsOn;
      const endsOn = data.endsOn ?? existingRate.endsOn;
      if (startsOn > endsOn) {
        return c.json(
          { error: "Validation failed", message: "Başlangıç tarihi bitişten sonra olamaz" },
          400,
        );
      }

      const updatePayload: Partial<typeof hotelRoomRate.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (data.startsOn !== undefined) updatePayload.startsOn = data.startsOn;
      if (data.endsOn !== undefined) updatePayload.endsOn = data.endsOn;
      if (data.nightlyPrice !== undefined)
        updatePayload.nightlyPrice = data.nightlyPrice.toString();
      if (data.minStayNights !== undefined)
        updatePayload.minStayNights = data.minStayNights;
      if (data.maxStayNights !== undefined)
        updatePayload.maxStayNights = data.maxStayNights;
      if (data.isRefundable !== undefined)
        updatePayload.isRefundable = data.isRefundable;

      await db.update(hotelRoomRate).set(updatePayload).where(eq(hotelRoomRate.id, rateId));

      const [rate] = await db
        .select()
        .from(hotelRoomRate)
        .where(eq(hotelRoomRate.id, rateId))
        .limit(1);

      return c.json({ success: true, rate });
    } catch (error) {
      console.error("Update owner room rate error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

app.delete("/:id/rooms/:roomId/rates/:rateId", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const roomId = c.req.param("roomId");
    const rateId = c.req.param("rateId");

    const roomCtx = await getOwnedRoomContext({ placeId, roomId, userId });
    if (!roomCtx) return c.json({ error: "Room not found" }, 404);

    const [deleted] = await db
      .delete(hotelRoomRate)
      .where(and(eq(hotelRoomRate.id, rateId), eq(hotelRoomRate.roomId, roomId)))
      .returning({ id: hotelRoomRate.id });

    if (!deleted) return c.json({ error: "Rate not found" }, 404);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete owner room rate error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

const upsertDiningMenus = async ({
  placeId,
  menus,
}: {
  placeId: string;
  menus: z.infer<typeof menuInputSchema>[];
}) => {
  await db.delete(diningMenu).where(eq(diningMenu.placeId, placeId));

  for (const [menuIndex, menuData] of menus.entries()) {
    const menuId = crypto.randomUUID();
    await db.insert(diningMenu).values({
      id: menuId,
      placeId,
      name: menuData.name,
      description: menuData.description,
      isActive: menuData.isActive,
      sortOrder: menuData.sortOrder ?? menuIndex,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (const [sectionIndex, sectionData] of menuData.sections.entries()) {
      const sectionId = crypto.randomUUID();
      await db.insert(diningMenuSection).values({
        id: sectionId,
        menuId,
        name: sectionData.name,
        description: sectionData.description,
        sortOrder: sectionData.sortOrder ?? sectionIndex,
        createdAt: new Date(),
      });

      for (const [itemIndex, itemData] of sectionData.items.entries()) {
        const itemId = crypto.randomUUID();
        await db.insert(diningMenuItem).values({
          id: itemId,
          sectionId,
          name: itemData.name,
          description: itemData.description,
          price: itemData.price !== undefined ? itemData.price.toString() : null,
          imageFileId: normalizeOptionalId(itemData.imageFileId),
          isAvailable: itemData.isAvailable,
          sortOrder: itemData.sortOrder ?? itemIndex,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const tags = Array.from(new Set((itemData.tags ?? []).map((tag) => tag.trim()))).filter(
          Boolean,
        );
        if (tags.length > 0) {
          await db.insert(diningMenuItemTag).values(
            tags.map((tag) => ({
              itemId,
              tag,
            })),
          );
        }
      }
    }
  }
};

app.get("/:id/menu", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!supportsMenuForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message: "Bu mekan türü menü yönetimini desteklemiyor",
        },
        400,
      );
    }

    const menus = await loadDiningMenusForPlace(placeId);
    return c.json({ menus });
  } catch (error) {
    console.error("Get owner menus error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/:id/menu", zValidator("json", upsertDiningMenuSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const data = c.req.valid("json");

    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!supportsMenuForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message: "Bu mekan türü menü yönetimini desteklemiyor",
        },
        400,
      );
    }

    const imageFileIds = normalizeIdList(
      data.menus.flatMap((menu) =>
        menu.sections.flatMap((section) =>
          section.items.map((item) => item.imageFileId ?? ""),
        ),
      ),
    );
    if (!(await ensureOwnedFiles(imageFileIds, userId))) {
      return c.json(
        {
          error: "Validation failed",
          message: "Menüde size ait olmayan görsel dosyası var",
        },
        400,
      );
    }

    await upsertDiningMenus({ placeId, menus: data.menus });
    const menus = await loadDiningMenusForPlace(placeId);
    return c.json({ success: true, menus });
  } catch (error) {
    console.error("Upsert owner menus error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/:id/packages", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!supportsPackagesForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message: "Bu mekan türü paket yönetimini desteklemiyor",
        },
        400,
      );
    }

    const packages = await loadActivityPackagesForPlace(placeId);
    return c.json({ packages });
  } catch (error) {
    console.error("Get owner activity packages error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/:id/packages", zValidator("json", createActivityPackageSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const data = c.req.valid("json");

    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!supportsPackagesForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message: "Bu mekan türü paket yönetimini desteklemiyor",
        },
        400,
      );
    }

    const mediaFileIds = normalizeIdList(data.mediaFileIds);
    if (!(await ensureOwnedFiles(mediaFileIds, userId))) {
      return c.json(
        {
          error: "Validation failed",
          message: "Paket medyasında size ait olmayan dosya var",
        },
        400,
      );
    }

    const packageId = crypto.randomUUID();
    await db.insert(activityPackage).values({
      id: packageId,
      placeId,
      name: data.name,
      description: data.description,
      price: data.price !== undefined ? data.price.toString() : null,
      durationMinutes: data.durationMinutes,
      minParticipants: data.minParticipants,
      maxParticipants: data.maxParticipants,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (mediaFileIds.length > 0) {
      await db.insert(activityPackageMedia).values(
        mediaFileIds.map((fileId, index) => ({
          packageId,
          fileId,
          sortOrder: index,
        })),
      );
    }

    if (data.priceTiers && data.priceTiers.length > 0) {
      await db.insert(activityPackagePriceTier).values(
        data.priceTiers.map((tier, index) => ({
          id: crypto.randomUUID(),
          packageId,
          name: tier.name,
          minGroupSize: tier.minGroupSize,
          maxGroupSize: tier.maxGroupSize,
          price: tier.price.toString(),
          sortOrder: tier.sortOrder ?? index,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    }

    const packages = await loadActivityPackagesForPlace(placeId);
    const activity = packages.find((item) => item.id === packageId) ?? null;
    return c.json({ success: true, package: activity }, 201);
  } catch (error) {
    console.error("Create owner activity package error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put(
  "/:id/packages/:packageId",
  zValidator("json", updateActivityPackageSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

      const userId = session.user.id;
      const placeId = c.req.param("id");
      const packageId = c.req.param("packageId");
      const data = c.req.valid("json");

      const placeCtx = await getOwnedPlaceContext(placeId, userId);
      if (!placeCtx) return c.json({ error: "Place not found" }, 404);
      if (!supportsPackagesForKind(placeCtx.kind)) {
        return c.json(
          {
            error: "Not supported",
            message: "Bu mekan türü paket yönetimini desteklemiyor",
          },
          400,
        );
      }

      const packageCtx = await getOwnedPackageContext({
        placeId,
        packageId,
        userId,
      });
      if (!packageCtx) return c.json({ error: "Package not found" }, 404);

      const mediaFileIds =
        data.mediaFileIds !== undefined ? normalizeIdList(data.mediaFileIds) : undefined;
      if (mediaFileIds && !(await ensureOwnedFiles(mediaFileIds, userId))) {
        return c.json(
          {
            error: "Validation failed",
            message: "Paket medyasında size ait olmayan dosya var",
          },
          400,
        );
      }

      const updatePayload: Partial<typeof activityPackage.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.price !== undefined)
        updatePayload.price = data.price !== undefined ? data.price.toString() : null;
      if (data.durationMinutes !== undefined)
        updatePayload.durationMinutes = data.durationMinutes;
      if (data.minParticipants !== undefined)
        updatePayload.minParticipants = data.minParticipants;
      if (data.maxParticipants !== undefined)
        updatePayload.maxParticipants = data.maxParticipants;
      if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
      if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

      await db.update(activityPackage).set(updatePayload).where(eq(activityPackage.id, packageId));

      if (mediaFileIds !== undefined) {
        await db
          .delete(activityPackageMedia)
          .where(eq(activityPackageMedia.packageId, packageId));
        if (mediaFileIds.length > 0) {
          await db.insert(activityPackageMedia).values(
            mediaFileIds.map((fileId, index) => ({
              packageId,
              fileId,
              sortOrder: index,
            })),
          );
        }
      }

      if (data.priceTiers !== undefined) {
        await db
          .delete(activityPackagePriceTier)
          .where(eq(activityPackagePriceTier.packageId, packageId));
        if (data.priceTiers.length > 0) {
          await db.insert(activityPackagePriceTier).values(
            data.priceTiers.map((tier, index) => ({
              id: crypto.randomUUID(),
              packageId,
              name: tier.name,
              minGroupSize: tier.minGroupSize,
              maxGroupSize: tier.maxGroupSize,
              price: tier.price.toString(),
              sortOrder: tier.sortOrder ?? index,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          );
        }
      }

      const packages = await loadActivityPackagesForPlace(placeId);
      const activity = packages.find((item) => item.id === packageId) ?? null;
      return c.json({ success: true, package: activity });
    } catch (error) {
      console.error("Update owner activity package error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

app.delete("/:id/packages/:packageId", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const packageId = c.req.param("packageId");

    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!supportsPackagesForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message: "Bu mekan türü paket yönetimini desteklemiyor",
        },
        400,
      );
    }

    const packageCtx = await getOwnedPackageContext({
      placeId,
      packageId,
      userId,
    });
    if (!packageCtx) return c.json({ error: "Package not found" }, 404);

    await db.delete(activityPackage).where(eq(activityPackage.id, packageId));
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete owner activity package error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/:id/reservations", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!isStayKind(placeCtx.kind)) {
      return c.json({ error: "Not supported", message: "Bu mekan türü rezervasyon desteklemiyor" }, 400);
    }

    await maybeAutoCompleteBookings();

    const {
      page = "1",
      limit = "20",
      status = "",
      paymentStatus = "",
      roomId = "",
      checkInFrom = "",
      checkInTo = "",
    } = c.req.query();

    const pageInt = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitInt = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const offset = (pageInt - 1) * limitInt;

    const conditions = [eq(booking.placeId, placeId)];
    if (status) {
      conditions.push(eq(booking.status, status as any));
    }
    if (paymentStatus) {
      conditions.push(eq(booking.paymentStatus, paymentStatus as any));
    }
    if (roomId) {
      conditions.push(eq(booking.roomId, roomId));
    }
    if (checkInFrom) {
      conditions.push(gte(booking.checkInDate, checkInFrom));
    }
    if (checkInTo) {
      conditions.push(lte(booking.checkInDate, checkInTo));
    }

    const whereClause = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(booking)
      .where(whereClause);

    const reservations = await db
      .select({
        id: booking.id,
        bookingReference: booking.bookingReference,
        placeId: booking.placeId,
        roomId: booking.roomId,
        userId: booking.userId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        specialRequests: booking.specialRequests,
        pricingSnapshot: booking.pricingSnapshot,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        travelerName: user.name,
        travelerEmail: user.email,
        roomName: hotelRoom.name,
      })
      .from(booking)
      .innerJoin(user, eq(booking.userId, user.id))
      .leftJoin(hotelRoom, eq(booking.roomId, hotelRoom.id))
      .where(whereClause)
      .orderBy(desc(booking.createdAt))
      .limit(limitInt)
      .offset(offset);

    return c.json({
      reservations: reservations.map((item) => ({
        ...item,
        pricingSnapshot: parsePricingSnapshot(item.pricingSnapshot),
      })),
      pagination: {
        page: pageInt,
        limit: limitInt,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitInt),
      },
    });
  } catch (error) {
    console.error("Get owner reservations error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/:id/reservations/:reservationId", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const reservationId = c.req.param("reservationId");
    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!isStayKind(placeCtx.kind)) {
      return c.json({ error: "Not supported", message: "Bu mekan türü rezervasyon desteklemiyor" }, 400);
    }

    await maybeAutoCompleteBookings();

    const [reservation] = await db
      .select({
        id: booking.id,
        bookingReference: booking.bookingReference,
        placeId: booking.placeId,
        roomId: booking.roomId,
        userId: booking.userId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        specialRequests: booking.specialRequests,
        pricingSnapshot: booking.pricingSnapshot,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        travelerName: user.name,
        travelerEmail: user.email,
        travelerPhone: user.phone,
        roomName: hotelRoom.name,
      })
      .from(booking)
      .innerJoin(user, eq(booking.userId, user.id))
      .leftJoin(hotelRoom, eq(booking.roomId, hotelRoom.id))
      .where(and(eq(booking.id, reservationId), eq(booking.placeId, placeId)))
      .limit(1);

    if (!reservation) return c.json({ error: "Reservation not found" }, 404);

    return c.json({
      reservation: {
        ...reservation,
        pricingSnapshot: parsePricingSnapshot(reservation.pricingSnapshot),
      },
    });
  } catch (error) {
    console.error("Get owner reservation detail error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.patch(
  "/:id/reservations/:reservationId/status",
  zValidator("json", reservationStatusUpdateSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

      const userId = session.user.id;
      const placeId = c.req.param("id");
      const reservationId = c.req.param("reservationId");
      const data = c.req.valid("json");

      const placeCtx = await getOwnedPlaceContext(placeId, userId);
      if (!placeCtx) return c.json({ error: "Place not found" }, 404);
      if (!isStayKind(placeCtx.kind)) {
        return c.json({ error: "Not supported", message: "Bu mekan türü rezervasyon desteklemiyor" }, 400);
      }

      await maybeAutoCompleteBookings();

      const [existing] = await db
        .select({
          id: booking.id,
          status: booking.status,
        })
        .from(booking)
        .where(and(eq(booking.id, reservationId), eq(booking.placeId, placeId)))
        .limit(1);

      if (!existing) return c.json({ error: "Reservation not found" }, 404);

      const transition = mapReservationStatusForOwner(existing.status, data.status);
      if (!transition.ok) {
        return c.json({ error: "Validation failed", message: transition.message }, 400);
      }

      const [updated] = await db
        .update(booking)
        .set({
          status: data.status,
          updatedAt: new Date(),
        })
        .where(eq(booking.id, reservationId))
        .returning();

      return c.json({
        success: true,
        reservation: {
          ...updated,
          pricingSnapshot: parsePricingSnapshot(updated.pricingSnapshot),
        },
        reason: data.reason ?? null,
      });
    } catch (error) {
      console.error("Update owner reservation status error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

app.patch(
  "/:id/reservations/:reservationId/payment",
  zValidator("json", reservationPaymentUpdateSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

      const userId = session.user.id;
      const placeId = c.req.param("id");
      const reservationId = c.req.param("reservationId");
      const data = c.req.valid("json");

      const placeCtx = await getOwnedPlaceContext(placeId, userId);
      if (!placeCtx) return c.json({ error: "Place not found" }, 404);
      if (!isStayKind(placeCtx.kind)) {
        return c.json({ error: "Not supported", message: "Bu mekan türü rezervasyon desteklemiyor" }, 400);
      }

      const [updated] = await db
        .update(booking)
        .set({
          paymentStatus: data.paymentStatus,
          updatedAt: new Date(),
        })
        .where(and(eq(booking.id, reservationId), eq(booking.placeId, placeId)))
        .returning();

      if (!updated) return c.json({ error: "Reservation not found" }, 404);

      return c.json({
        success: true,
        reservation: {
          ...updated,
          pricingSnapshot: parsePricingSnapshot(updated.pricingSnapshot),
        },
        reason: data.reason ?? null,
      });
    } catch (error) {
      console.error("Update owner reservation payment error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

app.get("/:id/price-rules", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!isStayKind(placeCtx.kind)) {
      return c.json({ error: "Not supported", message: "Bu mekan türü tarih bazlı fiyat desteklemiyor" }, 400);
    }

    const rules = await db
      .select()
      .from(placePriceRule)
      .where(eq(placePriceRule.placeId, placeId))
      .orderBy(asc(placePriceRule.startsOn), asc(placePriceRule.createdAt));

    return c.json({ rules });
  } catch (error) {
    console.error("Get owner place price rules error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post(
  "/:id/price-rules",
  zValidator("json", createPlacePriceRuleSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

      const userId = session.user.id;
      const placeId = c.req.param("id");
      const data = c.req.valid("json");
      const placeCtx = await getOwnedPlaceContext(placeId, userId);
      if (!placeCtx) return c.json({ error: "Place not found" }, 404);
      if (!isStayKind(placeCtx.kind)) {
        return c.json({ error: "Not supported", message: "Bu mekan türü tarih bazlı fiyat desteklemiyor" }, 400);
      }

      const dateValidation = validateInclusiveDateRange(data.startsOn, data.endsOn);
      if (!dateValidation.ok) {
        return c.json({ error: "Validation failed", message: dateValidation.message }, 400);
      }

      const id = crypto.randomUUID();
      const [rule] = await db
        .insert(placePriceRule)
        .values({
          id,
          placeId,
          startsOn: data.startsOn,
          endsOn: data.endsOn,
          nightlyPrice: data.nightlyPrice.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({ success: true, rule }, 201);
    } catch (error) {
      console.error("Create owner place price rule error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

app.put(
  "/:id/price-rules/:ruleId",
  zValidator("json", updatePlacePriceRuleSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

      const userId = session.user.id;
      const placeId = c.req.param("id");
      const ruleId = c.req.param("ruleId");
      const data = c.req.valid("json");

      const placeCtx = await getOwnedPlaceContext(placeId, userId);
      if (!placeCtx) return c.json({ error: "Place not found" }, 404);
      if (!isStayKind(placeCtx.kind)) {
        return c.json({ error: "Not supported", message: "Bu mekan türü tarih bazlı fiyat desteklemiyor" }, 400);
      }

      const [existing] = await db
        .select()
        .from(placePriceRule)
        .where(and(eq(placePriceRule.id, ruleId), eq(placePriceRule.placeId, placeId)))
        .limit(1);
      if (!existing) return c.json({ error: "Rule not found" }, 404);

      const startsOn = data.startsOn ?? existing.startsOn;
      const endsOn = data.endsOn ?? existing.endsOn;
      const dateValidation = validateInclusiveDateRange(startsOn, endsOn);
      if (!dateValidation.ok) {
        return c.json({ error: "Validation failed", message: dateValidation.message }, 400);
      }

      const [updated] = await db
        .update(placePriceRule)
        .set({
          startsOn,
          endsOn,
          nightlyPrice:
            data.nightlyPrice !== undefined
              ? data.nightlyPrice.toString()
              : existing.nightlyPrice,
          updatedAt: new Date(),
        })
        .where(eq(placePriceRule.id, ruleId))
        .returning();

      return c.json({ success: true, rule: updated });
    } catch (error) {
      console.error("Update owner place price rule error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

app.delete("/:id/price-rules/:ruleId", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const ruleId = c.req.param("ruleId");

    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!isStayKind(placeCtx.kind)) {
      return c.json({ error: "Not supported", message: "Bu mekan türü tarih bazlı fiyat desteklemiyor" }, 400);
    }

    const [deleted] = await db
      .delete(placePriceRule)
      .where(and(eq(placePriceRule.id, ruleId), eq(placePriceRule.placeId, placeId)))
      .returning({ id: placePriceRule.id });

    if (!deleted) return c.json({ error: "Rule not found" }, 404);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete owner place price rule error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/:id/availability-blocks", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!isStayKind(placeCtx.kind) || supportsRoomsForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message:
            "Sadece oda gerektirmeyen konaklama kategorileri için mekan bazlı takvim blokları kullanılabilir",
        },
        400,
      );
    }

    const blocks = await db
      .select()
      .from(placeAvailabilityBlock)
      .where(eq(placeAvailabilityBlock.placeId, placeId))
      .orderBy(asc(placeAvailabilityBlock.startsOn), asc(placeAvailabilityBlock.createdAt));

    return c.json({ blocks });
  } catch (error) {
    console.error("Get owner place availability blocks error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post(
  "/:id/availability-blocks",
  zValidator("json", createAvailabilityBlockSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

      const userId = session.user.id;
      const placeId = c.req.param("id");
      const data = c.req.valid("json");
      const placeCtx = await getOwnedPlaceContext(placeId, userId);
      if (!placeCtx) return c.json({ error: "Place not found" }, 404);
      if (!isStayKind(placeCtx.kind) || supportsRoomsForKind(placeCtx.kind)) {
        return c.json(
          {
            error: "Not supported",
            message:
              "Sadece oda gerektirmeyen konaklama kategorileri için mekan bazlı takvim blokları kullanılabilir",
          },
          400,
        );
      }

      const dateValidation = validateInclusiveDateRange(data.startsOn, data.endsOn);
      if (!dateValidation.ok) {
        return c.json({ error: "Validation failed", message: dateValidation.message }, 400);
      }

      const id = crypto.randomUUID();
      const [block] = await db
        .insert(placeAvailabilityBlock)
        .values({
          id,
          placeId,
          startsOn: data.startsOn,
          endsOn: data.endsOn,
          reason: data.reason,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({ success: true, block }, 201);
    } catch (error) {
      console.error("Create owner place availability block error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

app.delete("/:id/availability-blocks/:blockId", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const blockId = c.req.param("blockId");
    const placeCtx = await getOwnedPlaceContext(placeId, userId);
    if (!placeCtx) return c.json({ error: "Place not found" }, 404);
    if (!isStayKind(placeCtx.kind) || supportsRoomsForKind(placeCtx.kind)) {
      return c.json(
        {
          error: "Not supported",
          message:
            "Sadece oda gerektirmeyen konaklama kategorileri için mekan bazlı takvim blokları kullanılabilir",
        },
        400,
      );
    }

    const [deleted] = await db
      .delete(placeAvailabilityBlock)
      .where(and(eq(placeAvailabilityBlock.id, blockId), eq(placeAvailabilityBlock.placeId, placeId)))
      .returning({ id: placeAvailabilityBlock.id });
    if (!deleted) return c.json({ error: "Block not found" }, 404);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete owner place availability block error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/:id/rooms/:roomId/availability-blocks", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const roomId = c.req.param("roomId");
    const roomCtx = await getOwnedRoomContext({ placeId, roomId, userId });
    if (!roomCtx) return c.json({ error: "Room not found" }, 404);

    const blocks = await db
      .select()
      .from(hotelRoomAvailabilityBlock)
      .where(eq(hotelRoomAvailabilityBlock.roomId, roomId))
      .orderBy(
        asc(hotelRoomAvailabilityBlock.startsOn),
        asc(hotelRoomAvailabilityBlock.createdAt),
      );

    return c.json({ blocks });
  } catch (error) {
    console.error("Get owner room availability blocks error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post(
  "/:id/rooms/:roomId/availability-blocks",
  zValidator("json", createAvailabilityBlockSchema),
  async (c) => {
    try {
      const session = await getSessionFromRequest(c);
      if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

      const userId = session.user.id;
      const placeId = c.req.param("id");
      const roomId = c.req.param("roomId");
      const data = c.req.valid("json");
      const roomCtx = await getOwnedRoomContext({ placeId, roomId, userId });
      if (!roomCtx) return c.json({ error: "Room not found" }, 404);

      const dateValidation = validateInclusiveDateRange(data.startsOn, data.endsOn);
      if (!dateValidation.ok) {
        return c.json({ error: "Validation failed", message: dateValidation.message }, 400);
      }

      const id = crypto.randomUUID();
      const [block] = await db
        .insert(hotelRoomAvailabilityBlock)
        .values({
          id,
          roomId,
          startsOn: data.startsOn,
          endsOn: data.endsOn,
          reason: data.reason,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json({ success: true, block }, 201);
    } catch (error) {
      console.error("Create owner room availability block error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  },
);

app.delete("/:id/rooms/:roomId/availability-blocks/:blockId", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const userId = session.user.id;
    const placeId = c.req.param("id");
    const roomId = c.req.param("roomId");
    const blockId = c.req.param("blockId");
    const roomCtx = await getOwnedRoomContext({ placeId, roomId, userId });
    if (!roomCtx) return c.json({ error: "Room not found" }, 404);

    const [deleted] = await db
      .delete(hotelRoomAvailabilityBlock)
      .where(
        and(
          eq(hotelRoomAvailabilityBlock.id, blockId),
          eq(hotelRoomAvailabilityBlock.roomId, roomId),
        ),
      )
      .returning({ id: hotelRoomAvailabilityBlock.id });

    if (!deleted) return c.json({ error: "Block not found" }, 404);
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete owner room availability block error:", error);
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
        kind: place.kind,
        categoryId: place.kind,
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

    const resolvedKind = await resolvePlaceKindInput({
      kind: data.kind,
      categoryId: data.categoryId,
      category: data.category,
      type: data.type,
      fallbackKind: existingPlace.kind,
      fallbackKindId: existingPlace.kind,
    });

    if (!resolvedKind.kind) {
      return c.json(
        {
          error: "Validation failed",
          message: "Geçerli bir yer türü seçimi zorunludur",
        },
        400,
      );
    }

    if (resolvedKind.kind !== existingPlace.kind) {
      const kindLimitCheck = await checkPlaceLimit(userId, resolvedKind.kind);
      if (!kindLimitCheck.allowed) {
        const limitText = kindLimitCheck.isUnlimited
          ? "∞"
          : `${kindLimitCheck.current}/${kindLimitCheck.max ?? 0}`;
        return c.json(
          {
            error: "Plan limit reached",
            message: `Bu tür için mekan limitinize ulaştınız (${limitText}).`,
            current: kindLimitCheck.current,
            max: kindLimitCheck.max,
            kind: resolvedKind.kind,
          },
          403,
        );
      }
    }

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
      kind: resolvedKind.kind,
      excludePlaceId: id,
    });

    await db
      .update(place)
      .set({
        name: data.name ?? existingPlace.name,
        kind: resolvedKind.kind as any,
        categoryId: resolvedKind.id,
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
