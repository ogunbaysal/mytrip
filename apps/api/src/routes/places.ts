import { Hono } from "hono";
import { db } from "../db";
import { place, user, review } from "../db/schemas";
import { eq, desc, ilike, sql, and, gt } from "drizzle-orm";

const app = new Hono();

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
      priceLevel = "",
      featured = "",
      verified = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions for public API (only active places)
    const conditions = [eq(place.status, "active")];

    if (search) {
      conditions.push(
        sql`(LOWER(${place.name}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${place.description}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${place.shortDescription}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${place.category}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${place.address}) ILIKE ${'%' + search.toLowerCase() + '%'})`
      );
    }

    if (type) {
      conditions.push(eq(place.type, type as any));
    }

    if (category) {
      conditions.push(ilike(place.category, `%${category}%`));
    }

    if (city) {
      conditions.push(ilike(place.city, `%${city}%`));
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

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    // Build order by clause
    const orderByColumn = {
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

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(place)
      .where(whereClause);

    // Get places with basic owner info
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
        location: place.location,
        rating: place.rating,
        reviewCount: place.reviewCount,
        priceLevel: place.priceLevel,
        nightlyPrice: place.nightlyPrice,
        images: place.images,
        verified: place.verified,
        featured: place.featured,
        ownerId: place.ownerId,
        views: place.views,
        bookingCount: place.bookingCount,
        createdAt: place.createdAt,
      })
      .from(place)
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
      filters: {
        search,
        type,
        category,
        city,
        priceLevel,
        featured,
        verified,
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
 * Get featured places
 * GET /places/featured
 */
app.get("/featured", async (c) => {
  try {
    const { limit = "12", type = "" } = c.req.query();
    const limitInt = parseInt(limit);

    const conditions = [
      eq(place.status, "active"),
      eq(place.featured, true),
    ];

    if (type) {
      conditions.push(eq(place.type, type as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    const featuredPlaces = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        type: place.type,
        category: place.category,
        shortDescription: place.shortDescription,
        address: place.address,
        city: place.city,
        location: place.location,
        rating: place.rating,
        reviewCount: place.reviewCount,
        priceLevel: place.priceLevel,
        nightlyPrice: place.nightlyPrice,
        images: place.images,
        verified: place.verified,
        views: place.views,
        bookingCount: place.bookingCount,
      })
      .from(place)
      .where(whereClause)
      .orderBy(desc(place.featured), desc(place.rating))
      .limit(limitInt);

    return c.json({
      places: featuredPlaces,
      count: featuredPlaces.length,
    });
  } catch (error) {
    console.error("Failed to fetch featured places:", error);
    return c.json(
      {
        error: "Failed to fetch featured places",
        message: "Unable to retrieve featured places"
      },
      500
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

    const conditions = [
      eq(place.status, "active"),
      gt(place.reviewCount, 0),
    ];

    if (type) {
      conditions.push(eq(place.type, type as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    const popularPlaces = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        type: place.type,
        category: place.category,
        shortDescription: place.shortDescription,
        address: place.address,
        city: place.city,
        location: place.location,
        rating: place.rating,
        reviewCount: place.reviewCount,
        priceLevel: place.priceLevel,
        nightlyPrice: place.nightlyPrice,
        images: place.images,
        verified: place.verified,
        views: place.views,
        bookingCount: place.bookingCount,
      })
      .from(place)
      .where(whereClause)
      .orderBy(desc(place.rating), desc(place.reviewCount), desc(place.bookingCount))
      .limit(limitInt);

    return c.json({
      places: popularPlaces,
      count: popularPlaces.length,
    });
  } catch (error) {
    console.error("Failed to fetch popular places:", error);
    return c.json(
      {
        error: "Failed to fetch popular places",
        message: "Unable to retrieve popular places"
      },
      500
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
        verified: place.verified,
        featured: place.featured,
        views: place.views,
        bookingCount: place.bookingCount,
        openingHours: place.openingHours,
        checkInInfo: place.checkInInfo,
        checkOutInfo: place.checkOutInfo,
        createdAt: place.createdAt,
      })
      .from(place)
      .where(and(eq(place.slug, slug), eq(place.status, "active")))
      .limit(1);

    if (!placeData) {
      return c.json(
        {
          error: "Place not found",
          message: "The specified place does not exist or is not available"
        },
        404
      );
    }

    // Increment view count
    await db
      .update(place)
      .set({ views: sql`${place.views} + 1` })
      .where(eq(place.id, placeData.id));

    // Get recent reviews for this place
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
      .where(and(eq(review.placeId, placeData.id), eq(review.status, "published")))
      .orderBy(desc(review.createdAt))
      .limit(5);

    // Get nearby places (same city, excluding current place)
    const nearbyPlaces = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        type: place.type,
        category: place.category,
        shortDescription: place.shortDescription,
        address: place.address,
        rating: place.rating,
        reviewCount: place.reviewCount,
        priceLevel: place.priceLevel,
        nightlyPrice: place.nightlyPrice,
        images: place.images,
        verified: place.verified,
      })
      .from(place)
      .where(and(eq(place.city, placeData.city), eq(place.status, "active"), sql`${place.id} != ${placeData.id}`))
      .orderBy(desc(place.rating), desc(place.reviewCount))
      .limit(6);

    return c.json({
      place: {
        ...placeData,
        views: placeData.views + 1, // Return incremented count
      },
      recentReviews,
      nearbyPlaces,
    });
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
 * Get place categories
 * GET /places/categories
 */
app.get("/categories", async (c) => {
  try {
    const categories = await db
      .select({
        category: place.category,
        count: sql`COUNT(*)::int`,
      })
      .from(place)
      .where(eq(place.status, "active"))
      .groupBy(place.category)
      .orderBy(sql`COUNT(*) DESC`);

    return c.json({
      categories: categories.map(cat => ({
        name: cat.category,
        count: cat.count,
        slug: cat.category.toLowerCase().replace(/\s+/g, '-'),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return c.json(
      {
        error: "Failed to fetch categories",
        message: "Unable to retrieve place categories"
      },
      500
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
        city: place.city,
        count: sql`COUNT(*)::int`,
      })
      .from(place)
      .where(and(eq(place.status, "active"), sql`${place.city} IS NOT NULL`))
      .groupBy(place.city)
      .orderBy(sql`COUNT(*) DESC`);

    return c.json({
      cities: cities.map(city => ({
        name: city.city,
        count: city.count,
        slug: city.city.toLowerCase().replace(/\s+/g, '-'),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch cities:", error);
    return c.json(
      {
        error: "Failed to fetch cities",
        message: "Unable to retrieve cities"
      },
      500
    );
  }
});

/**
 * Get place types
 * GET /places/types
 */
app.get("/types", async (c) => {
  try {
    const placeTypes = await db
      .select({
        type: place.type,
        count: sql`COUNT(*)::int`,
      })
      .from(place)
      .where(eq(place.status, "active"))
      .groupBy(place.type)
      .orderBy(sql`COUNT(*) DESC`);

    const typeNames = {
      hotel: "Hotels",
      restaurant: "Restaurants",
      cafe: "Cafes",
      activity: "Activities",
      attraction: "Attractions",
      transport: "Transportation",
    };

    return c.json({
      types: placeTypes.map(pt => ({
        type: pt.type,
        name: typeNames[pt.type as keyof typeof typeNames] || pt.type,
        count: pt.count,
        slug: pt.type.toLowerCase(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch place types:", error);
    return c.json(
      {
        error: "Failed to fetch place types",
        message: "Unable to retrieve place types"
      },
      500
    );
  }
});

export { app as placesRoutes };