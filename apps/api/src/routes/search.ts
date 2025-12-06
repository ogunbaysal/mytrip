import { Hono } from "hono";
import { db } from "../db";
import { place, collection, blogPost, user, review } from "../db/schemas";
import { eq, desc, ilike, sql, and, or } from "drizzle-orm";

const app = new Hono();

/**
 * Global search across places, collections, and blog posts
 * GET /search
 */
app.get("/", async (c) => {
  try {
    const {
      q = "",
      type = "all", // all, places, collections, blog
      page = "1",
      limit = "20",
      language = "tr",
    } = c.req.query();

    if (!q.trim()) {
      return c.json({
        error: "Search query is required",
        message: "Please provide a search term"
      }, 400);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);
    const searchTerm = `%${q.toLowerCase()}%`;

    const results: any = {
      places: [],
      collections: [],
      blog: [],
      total: 0,
      query: q,
      type,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: 0,
        totalPages: 0,
      },
    };

    let totalItems = 0;

    // Search places
    if (type === "all" || type === "places") {
      const placeConditions = [
        eq(place.status, "active"),
        or(
          ilike(place.name, searchTerm),
          ilike(place.description, searchTerm),
          ilike(place.shortDescription, searchTerm),
          ilike(place.category, searchTerm),
          ilike(place.address, searchTerm),
          ilike(place.city, searchTerm),
          ilike(place.district, searchTerm),
        ),
      ];

      const [placeCount] = await db
        .select({ count: sql`COUNT(*)::int` })
        .from(place)
        .where(and(...placeConditions));

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
          rating: place.rating,
          reviewCount: place.reviewCount,
          priceLevel: place.priceLevel,
          nightlyPrice: place.nightlyPrice,
          images: place.images,
          verified: place.verified,
          featured: place.featured,
        })
        .from(place)
        .where(and(...placeConditions))
        .orderBy(sql`CASE WHEN ${place.featured} = true THEN 1 ELSE 2 END`, desc(place.rating), desc(place.reviewCount))
        .limit(limitInt)
        .offset(offset);

      results.places = places;
      totalItems += placeCount.count;
    }

    // Search collections
    if (type === "all" || type === "collections") {
      const collectionConditions = [
        eq(collection.status, "published"),
        or(
          ilike(collection.name, searchTerm),
          ilike(collection.description, searchTerm),
          ilike(collection.intro, searchTerm),
          ilike(collection.highlights, searchTerm),
          ilike(collection.tips, searchTerm),
          ilike(collection.season, searchTerm),
          ilike(collection.bestFor, searchTerm),
        ),
      ];

      const [collectionCount] = await db
        .select({ count: sql`COUNT(*)::int` })
        .from(collection)
        .where(and(...collectionConditions));

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
        })
        .from(collection)
        .where(and(...collectionConditions))
        .orderBy(desc(collection.updatedAt))
        .limit(limitInt)
        .offset(offset);

      results.collections = collections;
      totalItems += collectionCount.count;
    }

    // Search blog posts
    if (type === "all" || type === "blog") {
      const blogConditions = [
        eq(blogPost.status, "published"),
        eq(blogPost.language, language as any),
        or(
          ilike(blogPost.title, searchTerm),
          ilike(blogPost.excerpt, searchTerm),
          ilike(blogPost.content, searchTerm),
          ilike(blogPost.seoTitle, searchTerm),
          ilike(blogPost.seoDescription, searchTerm),
          ilike(blogPost.tags, searchTerm),
        ),
      ];

      const [blogCount] = await db
        .select({ count: sql`COUNT(*)::int` })
        .from(blogPost)
        .where(and(...blogConditions));

      const blogPosts = await db
        .select({
          id: blogPost.id,
          slug: blogPost.slug,
          title: blogPost.title,
          excerpt: blogPost.excerpt,
          heroImage: blogPost.heroImage,
          featuredImage: blogPost.featuredImage,
          category: blogPost.category,
          tags: blogPost.tags,
          featured: blogPost.featured,
          publishedAt: blogPost.publishedAt,
          readTime: blogPost.readTime,
          language: blogPost.language,
        })
        .from(blogPost)
        .where(and(...blogConditions))
        .orderBy(sql`CASE WHEN ${blogPost.featured} = true THEN 1 ELSE 2 END`, desc(blogPost.publishedAt))
        .limit(limitInt)
        .offset(offset);

      results.blog = blogPosts;
      totalItems += blogCount.count;
    }

    results.total = totalItems;
    results.pagination.total = totalItems;
    results.pagination.totalPages = Math.ceil(totalItems / limitInt);

    return c.json(results);
  } catch (error) {
    console.error("Failed to perform search:", error);
    return c.json(
      {
        error: "Failed to perform search",
        message: "Unable to perform search"
      },
      500
    );
  }
});

/**
 * Quick suggestions for search autocomplete
 * GET /search/suggestions
 */
app.get("/suggestions", async (c) => {
  try {
    const { q = "", limit = "10" } = c.req.query();
    const limitInt = parseInt(limit);

    if (!q.trim()) {
      return c.json({
        suggestions: [],
      });
    }

    const searchTerm = `%${q.toLowerCase()}%`;
    const suggestions = new Set<string>();

    // Get place name suggestions
    const placeSuggestions = await db
      .select({
        name: place.name,
        type: sql`'place'::text`,
      })
      .from(place)
      .where(and(
        eq(place.status, "active"),
        ilike(place.name, searchTerm)
      ))
      .orderBy(desc(place.rating))
      .limit(Math.floor(limitInt / 3));

    // Get collection name suggestions
    const collectionSuggestions = await db
      .select({
        name: collection.name,
        type: sql`'collection'::text`,
      })
      .from(collection)
      .where(and(
        eq(collection.status, "published"),
        ilike(collection.name, searchTerm)
      ))
      .orderBy(desc(collection.updatedAt))
      .limit(Math.floor(limitInt / 3));

    // Get blog post title suggestions
    const blogSuggestions = await db
      .select({
        name: blogPost.title,
        type: sql`'blog'::text`,
      })
      .from(blogPost)
      .where(and(
        eq(blogPost.status, "published"),
        ilike(blogPost.title, searchTerm)
      ))
      .orderBy(desc(blogPost.publishedAt))
      .limit(Math.floor(limitInt / 3));

    // Combine and format suggestions
    const allSuggestions = [
      ...placeSuggestions,
      ...collectionSuggestions,
      ...blogSuggestions,
    ].slice(0, limitInt);

    return c.json({
      suggestions: allSuggestions,
    });
  } catch (error) {
    console.error("Failed to get search suggestions:", error);
    return c.json(
      {
        error: "Failed to get search suggestions",
        message: "Unable to retrieve search suggestions"
      },
      500
    );
  }
});

/**
 * Advanced search with filters
 * GET /search/advanced
 */
app.get("/advanced", async (c) => {
  try {
    const {
      q = "",
      type = "all",
      placeType = "",
      category = "",
      city = "",
      priceLevel = "",
      rating = "",
      verified = "",
      featured = "",
      language = "tr",
      page = "1",
      limit = "20",
    } = c.req.query();

    if (!q.trim()) {
      return c.json({
        error: "Search query is required",
        message: "Please provide a search term"
      }, 400);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);
    const searchTerm = `%${q.toLowerCase()}%`;

    const results: any = {
      places: [],
      total: 0,
      query: q,
      filters: {
        placeType,
        category,
        city,
        priceLevel,
        rating,
        verified,
        featured,
      },
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: 0,
        totalPages: 0,
      },
    };

    // Build advanced place search conditions
    const placeConditions = [
      eq(place.status, "active"),
      or(
        ilike(place.name, searchTerm),
        ilike(place.description, searchTerm),
        ilike(place.shortDescription, searchTerm),
        ilike(place.category, searchTerm),
        ilike(place.address, searchTerm),
        ilike(place.city, searchTerm),
      ),
    ];

    if (placeType) {
      placeConditions.push(eq(place.type, placeType as any));
    }

    if (category) {
      placeConditions.push(ilike(place.category, `%${category}%`));
    }

    if (city) {
      placeConditions.push(ilike(place.city, `%${city}%`));
    }

    if (priceLevel) {
      placeConditions.push(eq(place.priceLevel, priceLevel as any));
    }

    if (rating) {
      placeConditions.push(sql`${place.rating} >= ${parseFloat(rating)}`);
    }

    if (verified !== "") {
      placeConditions.push(eq(place.verified, verified === "true"));
    }

    if (featured !== "") {
      placeConditions.push(eq(place.featured, featured === "true"));
    }

    const [placeCount] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(place)
      .where(and(...placeConditions));

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
        rating: place.rating,
        reviewCount: place.reviewCount,
        priceLevel: place.priceLevel,
        nightlyPrice: place.nightlyPrice,
        images: place.images,
        verified: place.verified,
        featured: place.featured,
      })
      .from(place)
      .where(and(...placeConditions))
      .orderBy(sql`CASE WHEN ${place.featured} = true THEN 1 ELSE 2 END`, desc(place.rating), desc(place.reviewCount))
      .limit(limitInt)
      .offset(offset);

    results.places = places;
    results.total = placeCount.count;
    results.pagination.total = placeCount.count;
    results.pagination.totalPages = Math.ceil(placeCount.count / limitInt);

    return c.json(results);
  } catch (error) {
    console.error("Failed to perform advanced search:", error);
    return c.json(
      {
        error: "Failed to perform advanced search",
        message: "Unable to perform advanced search"
      },
      500
    );
  }
});

/**
 * Get popular searches
 * GET /search/popular
 */
app.get("/popular", async (c) => {
  try {
    const { limit = "10" } = c.req.query();
    const limitInt = parseInt(limit);

    // This is a simplified implementation
    // In production, you might want to track actual search queries
    const popularSearches = [
      "hotels in Muğla",
      "beach clubs",
      "restaurants in Bodrum",
      "yacht tours",
      "historic sites",
      "water sports",
      "local markets",
      "sunset points",
      "traditional food",
      "luxury resorts",
    ];

    return c.json({
      popularSearches: popularSearches.slice(0, limitInt),
    });
  } catch (error) {
    console.error("Failed to get popular searches:", error);
    return c.json(
      {
        error: "Failed to get popular searches",
        message: "Unable to retrieve popular searches"
      },
      500
    );
  }
});

export { app as searchRoutes };