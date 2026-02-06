import { Hono } from "hono";
import { db } from "../db/index.ts";
import {
  amenity,
  district,
  place,
  placeAmenity,
  placeCategory,
  province,
  review,
  user,
} from "../db/schemas/index.ts";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import {
  derivePlaceTypeFromCategorySlug,
  hydratePlaceMediaAndAmenities,
  resolveCategorySlugsForType,
} from "../lib/place-relations.ts";

const app = new Hono();

type PlaceRow = {
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
  categoryName: string | null;
  categorySlug: string | null;
  cityName: string | null;
  districtName: string | null;
};

function toLegacyPlace(row: PlaceRow) {
  return {
    ...row,
    type: derivePlaceTypeFromCategorySlug(row.categorySlug),
    category: row.categoryName ?? "",
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

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const conditions: any[] = [eq(place.status, "active")];

    if (search) {
      conditions.push(
        sql`(
          LOWER(${place.name}) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${place.description}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${place.shortDescription}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${placeCategory.name}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
          OR LOWER(COALESCE(${place.address}, '')) ILIKE ${"%" + search.toLowerCase() + "%"}
        )`,
      );
    }

    if (type) {
      const slugs = resolveCategorySlugsForType(type);
      if (slugs.length > 0) {
        conditions.push(inArray(placeCategory.slug, slugs));
      }
    }

    if (category) {
      conditions.push(
        sql`LOWER(COALESCE(${placeCategory.name}, '')) ILIKE ${"%" + category.toLowerCase() + "%"} OR LOWER(COALESCE(${placeCategory.slug}, '')) ILIKE ${"%" + category.toLowerCase() + "%"}`,
      );
    }

    if (city) {
      conditions.push(sql`LOWER(COALESCE(${province.name}, '')) ILIKE ${"%" + city.toLowerCase() + "%"}`);
    }

    if (districtQuery) {
      conditions.push(
        sql`LOWER(COALESCE(${district.name}, '')) ILIKE ${"%" + districtQuery.toLowerCase() + "%"}`,
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
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      for (const amenitySlug of amenityList) {
        conditions.push(sql`
          EXISTS (
            SELECT 1
            FROM place_amenity pa
            INNER JOIN amenity a ON a.id = pa.amenity_id
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
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    const places = await hydratePlaceMediaAndAmenities(rows.map((row) => toLegacyPlace(row as PlaceRow)));

    return c.json({
      places,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitInt),
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
      const slugs = resolveCategorySlugsForType(type);
      if (slugs.length > 0) {
        conditions.push(inArray(placeCategory.slug, slugs));
      }
    }

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
      const slugs = resolveCategorySlugsForType(type);
      if (slugs.length > 0) {
        conditions.push(inArray(placeCategory.slug, slugs));
      }
    }

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
 * Get place categories
 * GET /places/categories
 */
app.get("/categories", async (c) => {
  try {
    const categories = await db
      .select({
        id: placeCategory.id,
        name: placeCategory.name,
        slug: placeCategory.slug,
        description: placeCategory.description,
        icon: placeCategory.icon,
        count: sql<number>`COUNT(${place.id})::int`,
      })
      .from(placeCategory)
      .leftJoin(
        place,
        and(eq(place.categoryId, placeCategory.id), eq(place.status, "active")),
      )
      .groupBy(placeCategory.id)
      .orderBy(sql`COUNT(${place.id}) DESC`);

    return c.json({
      categories: categories.map((cat) => ({
        id: cat.slug,
        title: cat.name,
        description: cat.description || `${cat.count} seçenek`,
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

/**
 * Get places by city
 * GET /places/cities
 */
app.get("/cities", async (c) => {
  try {
    const cities = await db
      .select({
        city: province.name,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .innerJoin(province, eq(place.cityId, province.id))
      .where(eq(place.status, "active"))
      .groupBy(province.name)
      .orderBy(sql`COUNT(*) DESC`);

    return c.json({
      cities: cities.map((row) => ({
        name: row.city,
        count: Number(row.count),
        slug: row.city.toLowerCase().replace(/\s+/g, "-"),
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
        categorySlug: placeCategory.slug,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(place)
      .leftJoin(placeCategory, eq(place.categoryId, placeCategory.id))
      .where(eq(place.status, "active"))
      .groupBy(placeCategory.slug)
      .orderBy(sql`COUNT(*) DESC`);

    const countsByType = rows.reduce(
      (acc, row) => {
        const type = derivePlaceTypeFromCategorySlug(row.categorySlug);
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
