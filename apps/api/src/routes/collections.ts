import { Hono } from "hono";
import { db } from "../db/index.ts";
import { collection, place } from "../db/schemas/index.ts";
import { eq, desc, ilike, sql, and, inArray, ne } from "drizzle-orm";

const app = new Hono();

/**
 * Get all collections with pagination and filtering
 * GET /collections
 */
app.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "12",
      search = "",
      season = "",
      bestFor = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions for public API (only published collections)
    const conditions = [eq(collection.status, "published")];

    if (search) {
      conditions.push(
        sql`(LOWER(${collection.name}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${collection.description}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${collection.intro}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${collection.highlights}) ILIKE ${'%' + search.toLowerCase() + '%'})`
      );
    }

    if (season) {
      conditions.push(ilike(collection.season, `%${season}%`));
    }

    if (bestFor) {
      conditions.push(ilike(collection.bestFor, `%${bestFor}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    // Build order by clause
    const orderByColumn = {
      name: collection.name,
      itemCount: collection.itemCount,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }[sortBy] || collection.createdAt;

    const orderDirection = sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(collection)
      .where(whereClause);

    // Get collections
    const collections = await db
      .select({
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        coverImage: collection.coverImage,
        heroImage: collection.heroImage,
        intro: collection.intro,
        duration: collection.duration,
        season: collection.season,
        bestFor: collection.bestFor,
        highlights: collection.highlights,
        itemCount: collection.itemCount,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      })
      .from(collection)
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    return c.json({
      collections,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitInt),
      },
      filters: {
        search,
        season,
        bestFor,
      },
    });
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return c.json(
      {
        error: "Failed to fetch collections",
        message: "Unable to retrieve collections"
      },
      500
    );
  }
});

/**
 * Get featured collections
 * GET /collections/featured
 */
app.get("/featured", async (c) => {
  try {
    const { limit = "6" } = c.req.query();
    const limitInt = parseInt(limit);

    const featuredCollections = await db
      .select({
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        coverImage: collection.coverImage,
        heroImage: collection.heroImage,
        intro: collection.intro,
        duration: collection.duration,
        season: collection.season,
        bestFor: collection.bestFor,
        highlights: collection.highlights,
        itemCount: collection.itemCount,
        createdAt: collection.createdAt,
      })
      .from(collection)
      .where(eq(collection.status, "published"))
      .orderBy(sql`RANDOM()`) // For featured, we'll randomize
      .limit(limitInt);

    return c.json({
      collections: featuredCollections,
      count: featuredCollections.length,
    });
  } catch (error) {
    console.error("Failed to fetch featured collections:", error);
    return c.json(
      {
        error: "Failed to fetch featured collections",
        message: "Unable to retrieve featured collections"
      },
      500
    );
  }
});

/**
 * Get collection by slug
 * GET /collections/:slug
 */
app.get("/:slug", async (c) => {
  try {
    const { slug } = c.req.param();

    const [collectionData] = await db
      .select({
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        coverImage: collection.coverImage,
        heroImage: collection.heroImage,
        intro: collection.intro,
        duration: collection.duration,
        season: collection.season,
        bestFor: collection.bestFor,
        highlights: collection.highlights,
        itinerary: collection.itinerary,
        tips: collection.tips,
        featuredPlaces: collection.featuredPlaces,
        itemCount: collection.itemCount,
        status: collection.status,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      })
      .from(collection)
      .where(eq(collection.slug, slug))
      .limit(1);

    if (!collectionData || collectionData.status !== "published") {
      return c.json(
        {
          error: "Collection not found",
          message: "The specified collection does not exist or is not available"
        },
        404
      );
    }

    // Get featured places details if any
    let featuredPlacesDetails: any[] = [];
    if (collectionData.featuredPlaces) {
      try {
        const featuredPlaceIds = JSON.parse(collectionData.featuredPlaces || "[]");
        if (featuredPlaceIds.length > 0) {
          const fetchedPlaces = await db
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
            })
            .from(place)
            .where(and(
              inArray(place.id, featuredPlaceIds),
              eq(place.status, "active")
            ));

          // Sort by order in featuredPlaceIds
          featuredPlacesDetails = featuredPlaceIds
            .map((id: string) => fetchedPlaces.find((p) => p.id === id))
            .filter((p: any) => !!p);
        }
      } catch (error) {
        console.error("Failed to parse featured places:", error);
      }
    }

    // Get related collections (same season)
    const relatedCollections = await db
      .select({
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        coverImage: collection.coverImage,
        duration: collection.duration,
        season: collection.season,
        itemCount: collection.itemCount,
      })
      .from(collection)
      .where(and(
        eq(collection.status, "published"),
        ne(collection.id, collectionData.id),
        collectionData.season ? eq(collection.season, collectionData.season) : undefined
      ))
      .orderBy(desc(collection.createdAt))
      .limit(4);

    return c.json({
      collection: collectionData,
      featuredPlaces: featuredPlacesDetails,
      relatedCollections,
    });
  } catch (error) {
    console.error("Failed to fetch collection:", error);
    return c.json(
      {
        error: "Failed to fetch collection",
        message: "Unable to retrieve collection details"
      },
      500
    );
  }
});

/**
 * Get collections by season
 * GET /collections/seasons
 */
app.get("/seasons", async (c) => {
  try {
    const seasons = await db
      .select({
        season: collection.season,
        count: sql`COUNT(*)::int`,
      })
      .from(collection)
      .where(and(eq(collection.status, "published"), sql`${collection.season} IS NOT NULL`))
      .groupBy(collection.season)
      .orderBy(sql`COUNT(*) DESC`);

    return c.json({
      seasons: seasons.map(season => ({
        name: season.season!,
        count: Number(season.count),
        slug: season.season!.toLowerCase().replace(/\s+/g, '-'),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch seasons:", error);
    return c.json(
      {
        error: "Failed to fetch seasons",
        message: "Unable to retrieve collection seasons"
      },
      500
    );
  }
});

/**
 * Get collections by target audience
 * GET /collections/audiences
 */
app.get("/audiences", async (c) => {
  try {
    // This is a simplified approach - in production, you might want to parse the JSON bestFor field
    const collections = await db
      .select({
        bestFor: collection.bestFor,
      })
      .from(collection)
      .where(and(eq(collection.status, "published"), sql`${collection.bestFor} IS NOT NULL`));

    // Extract unique audiences
    const audiences = new Set<string>();
    collections.forEach(col => {
      try {
        const bestForArray = JSON.parse(col.bestFor || "[]");
        bestForArray.forEach((audience: string) => audiences.add(audience));
      } catch (error) {
        // Skip invalid JSON
      }
    });

    const audienceList = Array.from(audiences).map(audience => ({
      name: audience,
      slug: audience.toLowerCase().replace(/\s+/g, '-'),
    }));

    return c.json({
      audiences: audienceList,
    });
  } catch (error) {
    console.error("Failed to fetch audiences:", error);
    return c.json(
      {
        error: "Failed to fetch audiences",
        message: "Unable to retrieve collection audiences"
      },
      500
    );
  }
});

export { app as collectionsRoutes };