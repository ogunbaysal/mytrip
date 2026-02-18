import { Hono } from "hono";
import { db } from "../db/index.ts";
import {
  amenity,
  district,
  place,
  placeAmenity,
  placeKind,
  province,
  review,
  user,
} from "../db/schemas/index.ts";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import {
  derivePlaceTypeFromCategorySlug,
  hydratePlaceMediaAndAmenities,
  resolvePlaceKindIdsForType,
} from "../lib/place-relations.ts";

const app = new Hono();

type PlaceRow = {
  id: string;
  slug: string;
  name: string;
  kind: string;
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
  verified: boolean;
  featured: boolean;
  ownerId: string | null;
  views: number;
  bookingCount: number;
  openingHours: string | null;
  checkInInfo: string | null;
  checkOutInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
  kindName: string | null;
  kindSlug: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  cityName: string | null;
  districtName: string | null;
  ownerName?: string | null;
  ownerAvatar?: string | null;
  ownerCreatedAt?: Date | null;
};

function toLegacyPlace(row: PlaceRow) {
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

const TYPE_NAMES: Record<string, string> = {
  hotel: "Hotels",
  restaurant: "Restaurants",
  cafe: "Cafes",
  activity: "Activities",
  attraction: "Attractions",
  transport: "Transportation",
};

const normalizeFilterSlug = (value: string): string =>
  value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Get all places with filtering and pagination
 * GET /places
 */
app.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = "",
      type = "",
      category = "",
      city = "",
      district: districtQuery = "",
      priceLevel = "",
      featured = "",
      verified = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      amenities = "",
      bounds = "",
      priceMin = "",
      priceMax = "",
    } = c.req.query();

    const pageInt = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitInt = Math.min(
      100,
      Math.max(1, Number.parseInt(limit, 10) || 20),
    );
    const offset = (pageInt - 1) * limitInt;

    const conditions: any[] = [eq(place.status, "active")];

    if (search) {
      conditions.push(
        sql`(
          LOWER(${place.name}) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${place.description}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${place.shortDescription}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${placeKind.name}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${place.address}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
        )`,
      );
    }

    if (type) {
      const kindIds = resolvePlaceKindIdsForType(type);
      if (kindIds.length > 0) {
        conditions.push(inArray(place.kind, kindIds as any));
      }
    }

    if (category) {
      conditions.push(
        sql`${place.kind} = ${category}
          OR LOWER(COALESCE(${placeKind.name}, '')) ILIKE ${"%" + category.toLowerCase() + "%"}
          OR LOWER(COALESCE(${placeKind.slug}, '')) ILIKE ${"%" + category.toLowerCase() + "%"}`,
      );
    }

    if (city) {
      const cityValue = city.trim();
      const citySlug = normalizeFilterSlug(cityValue);
      conditions.push(sql`(
        ${place.cityId} = ${cityValue}
        OR LOWER(COALESCE(${province.slug}, '')) = LOWER(${cityValue})
        OR LOWER(COALESCE(${province.slug}, '')) = LOWER(${citySlug})
        OR COALESCE(${province.name}, '') ILIKE ${"%" + cityValue + "%"}
      )`);
    }

    if (districtQuery) {
      const districtValue = districtQuery.trim();
      const districtSlug = normalizeFilterSlug(districtValue);
      conditions.push(
        sql`(
          ${place.districtId} = ${districtValue}
          OR LOWER(COALESCE(${district.slug}, '')) = LOWER(${districtValue})
          OR LOWER(COALESCE(${district.slug}, '')) = LOWER(${districtSlug})
          OR COALESCE(${district.name}, '') ILIKE ${"%" + districtValue + "%"}
        )`,
      );
    }

    if (priceLevel) {
      conditions.push(eq(place.priceLevel, priceLevel as any));
    }

    if (featured !== "") {
      conditions.push(eq(place.featured, featured === "true"));
    }

    if (verified !== "") {
      conditions.push(eq(place.verified, verified === "true"));
    }

    if (priceMin) {
      const minPrice = parseFloat(priceMin);
      if (!isNaN(minPrice)) {
        conditions.push(sql`CAST(${place.nightlyPrice} AS NUMERIC) >= ${minPrice}`);
      }
    }

    if (priceMax) {
      const maxPrice = parseFloat(priceMax);
      if (!isNaN(maxPrice)) {
        conditions.push(sql`CAST(${place.nightlyPrice} AS NUMERIC) <= ${maxPrice}`);
      }
    }

    if (amenities) {
      const amenityList = amenities
        .split(",")
        .map((item) => normalizeFilterSlug(item))
        .filter(Boolean);

      for (const amenitySlug of amenityList) {
        conditions.push(sql`
          EXISTS (
            SELECT 1
            FROM place_feature_assignment pa
            INNER JOIN place_feature a ON a.id = pa.amenity_id
            WHERE pa.place_id = ${place.id}
              AND a.slug = ${amenitySlug}
          )
        `);
      }
    }

    if (bounds) {
      const [minLat, minLng, maxLat, maxLng] = bounds.split(",").map(parseFloat);
      if (!isNaN(minLat) && !isNaN(minLng) && !isNaN(maxLat) && !isNaN(maxLng)) {
        conditions.push(
          sql`(${place.location}::json->>'lat')::numeric BETWEEN ${minLat} AND ${maxLat}`,
        );
        conditions.push(
          sql`(${place.location}::json->>'lng')::numeric BETWEEN ${minLng} AND ${maxLng}`,
        );
      }
    }

    const whereClause = and(...conditions);

    const orderByColumn =
      {
        name: place.name,
        rating: place.rating,
        reviewCount: place.reviewCount,
        price: place.nightlyPrice,
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
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    const places = await hydratePlaceMediaAndAmenities(rows.map((row) => toLegacyPlace(row as PlaceRow)));

    return c.json({
      places,
      pagination: {
        page: pageInt,
        limit: limitInt,
        total: Number(count),
        totalPages:
          Number(count) > 0 ? Math.ceil(Number(count) / limitInt) : 0,
      },
      filters: {
        search,
        type,
        category,
        city,
        district: districtQuery,
        priceLevel,
        featured,
        verified,
        amenities,
        bounds,
        priceMin,
        priceMax,
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
 * Get featured places
 * GET /places/featured
 */
app.get("/featured", async (c) => {
  try {
    const { limit = "12", type = "" } = c.req.query();
    const limitInt = parseInt(limit);

    const conditions: any[] = [eq(place.status, "active"), eq(place.featured, true)];

    if (type) {
      const kindIds = resolvePlaceKindIdsForType(type);
      if (kindIds.length > 0) {
        conditions.push(inArray(place.kind, kindIds as any));
      }
    }

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
      .where(and(...conditions))
      .orderBy(desc(place.featured), desc(place.rating))
      .limit(limitInt);

    const featuredPlaces = await hydratePlaceMediaAndAmenities(
      rows.map((row) => toLegacyPlace(row as PlaceRow)),
    );

    return c.json({
      places: featuredPlaces,
      count: featuredPlaces.length,
    });
  } catch (error) {
    console.error("Failed to fetch featured places:", error);
    return c.json(
      {
        error: "Failed to fetch featured places",
        message: "Unable to retrieve featured places",
      },
      500,
    );
  }
});

/**
 * Get popular places
 * GET /places/popular
 */
app.get("/popular", async (c) => {
  try {
    const { limit = "12", type = "" } = c.req.query();
    const limitInt = parseInt(limit);

    const conditions: any[] = [eq(place.status, "active"), gt(place.reviewCount, 0)];

    if (type) {
      const kindIds = resolvePlaceKindIdsForType(type);
      if (kindIds.length > 0) {
        conditions.push(inArray(place.kind, kindIds as any));
      }
    }

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
      .where(and(...conditions))
      .orderBy(desc(place.rating), desc(place.reviewCount), desc(place.bookingCount))
      .limit(limitInt);

    const popularPlaces = await hydratePlaceMediaAndAmenities(
      rows.map((row) => toLegacyPlace(row as PlaceRow)),
    );

    return c.json({
      places: popularPlaces,
      count: popularPlaces.length,
    });
  } catch (error) {
    console.error("Failed to fetch popular places:", error);
    return c.json(
      {
        error: "Failed to fetch popular places",
        message: "Unable to retrieve popular places",
      },
      500,
    );
  }
});

/**
 * Get place kinds
 * GET /places/categories
 */
app.get("/categories", async (c) => {
  try {
    const kinds = await db
      .select({
        id: placeKind.id,
        name: placeKind.name,
        slug: placeKind.slug,
        description: placeKind.description,
        icon: placeKind.icon,
        monetized: placeKind.monetized,
        supportsRooms: placeKind.supportsRooms,
        supportsMenu: placeKind.supportsMenu,
        supportsPackages: placeKind.supportsPackages,
        count: sql<number>`COUNT(${place.id})::int`,
      })
      .from(placeKind)
      .leftJoin(
        place,
        and(eq(place.kind, placeKind.id as any), eq(place.status, "active")),
      )
      .where(eq(placeKind.active, true))
      .groupBy(placeKind.id)
      .orderBy(sql`COUNT(${place.id}) DESC`);

    return c.json({
      categories: kinds.map((cat) => ({
        id: cat.id,
        title: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        monetized: cat.monetized,
        supportsRooms: cat.supportsRooms,
        supportsMenu: cat.supportsMenu,
        supportsPackages: cat.supportsPackages,
        description: cat.description || `${cat.count} seçenek`,
        count: Number(cat.count),
      })),
      kinds: kinds.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        monetized: cat.monetized,
        supportsRooms: cat.supportsRooms,
        supportsMenu: cat.supportsMenu,
        supportsPackages: cat.supportsPackages,
        count: Number(cat.count),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return c.json(
      {
        error: "Failed to fetch categories",
        message: "Unable to retrieve place categories",
      },
      500,
    );
  }
});

app.get("/kinds", async (c) => {
  try {
    const kinds = await db
      .select({
        id: placeKind.id,
        name: placeKind.name,
        slug: placeKind.slug,
        description: placeKind.description,
        icon: placeKind.icon,
        monetized: placeKind.monetized,
        supportsRooms: placeKind.supportsRooms,
        supportsMenu: placeKind.supportsMenu,
        supportsPackages: placeKind.supportsPackages,
        count: sql<number>`COUNT(${place.id})::int`,
      })
      .from(placeKind)
      .leftJoin(
        place,
        and(eq(place.kind, placeKind.id as any), eq(place.status, "active")),
      )
      .where(eq(placeKind.active, true))
      .groupBy(placeKind.id)
      .orderBy(sql`COUNT(${place.id}) DESC`);

    return c.json({ kinds });
  } catch (error) {
    console.error("Failed to fetch kinds:", error);
    return c.json(
      {
        error: "Failed to fetch kinds",
        message: "Unable to retrieve place kinds",
      },
      500,
    );
  }
});

/**
 * Get places by city
 * GET /places/cities
 */
app.get("/cities", async (c) => {
  try {
    const cities = await db
      .select({
        cityId: province.id,
        city: province.name,
        citySlug: province.slug,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .innerJoin(province, eq(place.cityId, province.id))
      .where(eq(place.status, "active"))
      .groupBy(province.id, province.name, province.slug)
      .orderBy(sql`COUNT(*) DESC`);

    return c.json({
      cities: cities.map((row) => ({
        id: row.cityId,
        name: row.city,
        count: Number(row.count),
        slug: row.citySlug || normalizeFilterSlug(row.city),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch cities:", error);
    return c.json(
      {
        error: "Failed to fetch cities",
        message: "Unable to retrieve cities",
      },
      500,
    );
  }
});

/**
 * Get available amenities/features across all places
 * GET /places/amenities
 */
app.get("/amenities", async (c) => {
  try {
    const rows = await db
      .select({
        key: amenity.slug,
        label: amenity.label,
        count: sql<number>`COUNT(${placeAmenity.placeId})::int`,
      })
      .from(placeAmenity)
      .innerJoin(amenity, eq(placeAmenity.amenityId, amenity.id))
      .innerJoin(place, and(eq(placeAmenity.placeId, place.id), eq(place.status, "active")))
      .groupBy(amenity.slug, amenity.label)
      .orderBy(desc(sql`COUNT(${placeAmenity.placeId})`), asc(amenity.slug));

    const amenities = rows.map((row) => ({
      key: row.key,
      label: row.label,
      count: Number(row.count),
    }));

    return c.json({ amenities });
  } catch (error) {
    console.error("Failed to fetch amenities:", error);
    return c.json(
      {
        error: "Failed to fetch amenities",
        message: "Unable to retrieve amenities",
      },
      500,
    );
  }
});

/**
 * Get place types
 * GET /places/types
 */
app.get("/types", async (c) => {
  try {
    const rows = await db
      .select({
        kindSlug: placeKind.slug,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .leftJoin(placeKind, eq(place.kind, placeKind.id as any))
      .where(eq(place.status, "active"))
      .groupBy(placeKind.slug)
      .orderBy(sql`COUNT(*) DESC`);

    const countsByType = rows.reduce(
      (acc, row) => {
        const type = derivePlaceTypeFromCategorySlug(row.kindSlug);
        acc[type] = (acc[type] ?? 0) + Number(row.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    const types = Object.entries(countsByType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type,
        name: TYPE_NAMES[type] || type,
        count,
        slug: type.toLowerCase(),
      }));

    return c.json({ types });
  } catch (error) {
    console.error("Failed to fetch place types:", error);
    return c.json(
      {
        error: "Failed to fetch place types",
        message: "Unable to retrieve place types",
      },
      500,
    );
  }
});

/**
 * Get place by slug
 * GET /places/:slug
 */
app.get("/:slug", async (c) => {
  try {
    const { slug } = c.req.param();

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
        ownerName: user.name,
        ownerAvatar: sql<string | null>`COALESCE(${user.avatar}, ${user.image})`,
        ownerCreatedAt: user.createdAt,
      })
      .from(place)
      .leftJoin(placeKind, eq(place.kind, placeKind.id as any))
      .leftJoin(province, eq(place.cityId, province.id))
      .leftJoin(district, eq(place.districtId, district.id))
      .leftJoin(user, eq(place.ownerId, user.id))
      .where(and(eq(place.slug, slug), eq(place.status, "active")))
      .limit(1);

    const placeRow = rows[0] as PlaceRow | undefined;

    if (!placeRow) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist or is not available",
        },
        404,
      );
    }

    await db
      .update(place)
      .set({ views: sql`${place.views} + 1` })
      .where(eq(place.id, placeRow.id));

    const recentReviews = await db
      .select({
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        helpfulCount: review.helpfulCount,
        verifiedStay: review.verifiedStay,
        createdAt: review.createdAt,
        userName: user.name,
        userAvatar: user.avatar,
      })
      .from(review)
      .innerJoin(user, eq(review.userId, user.id))
      .where(and(eq(review.placeId, placeRow.id), eq(review.status, "published")))
      .orderBy(desc(review.createdAt))
      .limit(5);

    let nearbyRows: PlaceRow[] = [];
    if (placeRow.cityId) {
      const rawNearby = await db
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
          ownerName: user.name,
          ownerAvatar: sql<string | null>`COALESCE(${user.avatar}, ${user.image})`,
          ownerCreatedAt: user.createdAt,
        })
        .from(place)
        .leftJoin(placeKind, eq(place.kind, placeKind.id as any))
        .leftJoin(province, eq(place.cityId, province.id))
        .leftJoin(district, eq(place.districtId, district.id))
        .leftJoin(user, eq(place.ownerId, user.id))
        .where(
          and(
            eq(place.cityId, placeRow.cityId),
            eq(place.status, "active"),
            sql`${place.id} != ${placeRow.id}`,
          ),
        )
        .orderBy(desc(place.rating), desc(place.reviewCount))
        .limit(6);

      nearbyRows = rawNearby as PlaceRow[];
    }

    const [hydratedPlace] = await hydratePlaceMediaAndAmenities([toLegacyPlace(placeRow)]);
    const nearbyPlaces = await hydratePlaceMediaAndAmenities(nearbyRows.map(toLegacyPlace));

    return c.json({
      place: {
        ...hydratedPlace,
        views: placeRow.views + 1,
      },
      recentReviews,
      nearbyPlaces,
    });
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

export { app as placesRoutes };
