import { Hono } from "hono";
import { db } from "../../db";
import { collection } from "../../db/schemas";
import { eq, desc, ilike, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const app = new Hono();

/**
 * Get all collections with pagination and filtering
 * GET /admin/collections
 */
app.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(LOWER(${collection.name}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${collection.description}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${collection.intro}) ILIKE ${'%' + search.toLowerCase() + '%'})`
      );
    }

    if (status) {
      conditions.push(eq(collection.status, status as any));
    }

    const whereClause = conditions.length > 0 ? sql`${conditions.join(" AND ")}` : sql`1=1`;

    // Build order by clause
    const orderByColumn = {
      name: collection.name,
      status: collection.status,
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
      .select()
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
 * Get collection by ID
 * GET /admin/collections/:collectionId
 */
app.get("/:collectionId", async (c) => {
  try {
    const { collectionId } = c.req.param();

    const [collectionData] = await db
      .select()
      .from(collection)
      .where(eq(collection.id, collectionId))
      .limit(1);

    if (!collectionData) {
      return c.json(
        {
          error: "Collection not found",
          message: "The specified collection does not exist"
        },
        404
      );
    }

    return c.json({ collection: collectionData });
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
 * Create new collection
 * POST /admin/collections
 */
app.post("/", async (c) => {
  try {
    const collectionData = await c.req.json();

    const newCollection = {
      id: nanoid(),
      slug: collectionData.slug || `${collectionData.name.toLowerCase().replace(/\s+/g, '-')}-${nanoid(6)}`,
      name: collectionData.name,
      description: collectionData.description,
      coverImage: collectionData.coverImage,
      heroImage: collectionData.heroImage,
      intro: collectionData.intro,
      duration: collectionData.duration,
      season: collectionData.season,
      bestFor: collectionData.bestFor,
      highlights: collectionData.highlights,
      itinerary: collectionData.itinerary,
      tips: collectionData.tips,
      featuredPlaces: collectionData.featuredPlaces,
      itemCount: collectionData.itemCount || 0,
      status: collectionData.status || "draft",
    };

    const [createdCollection] = await db.insert(collection).values(newCollection).returning();

    return c.json({
      success: true,
      message: "Collection created successfully",
      collection: createdCollection,
    });
  } catch (error) {
    console.error("Failed to create collection:", error);
    return c.json(
      {
        error: "Failed to create collection",
        message: "Unable to create new collection"
      },
      500
    );
  }
});

/**
 * Update collection
 * PUT /admin/collections/:collectionId
 */
app.put("/:collectionId", async (c) => {
  try {
    const { collectionId } = c.req.param();
    const updates = await c.req.json();

    // Remove fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, ...allowedUpdates } = updates;

    // Update item count if featured places changed
    if (allowedUpdates.featuredPlaces) {
      const featuredPlaces = JSON.parse(allowedUpdates.featuredPlaces || "[]");
      allowedUpdates.itemCount = featuredPlaces.length;
    }

    const [updatedCollection] = await db
      .update(collection)
      .set({
        ...allowedUpdates,
        updatedAt: new Date(),
      })
      .where(eq(collection.id, collectionId))
      .returning();

    if (!updatedCollection) {
      return c.json(
        {
          error: "Collection not found",
          message: "The specified collection does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Collection updated successfully",
      collection: updatedCollection,
    });
  } catch (error) {
    console.error("Failed to update collection:", error);
    return c.json(
      {
        error: "Failed to update collection",
        message: "Unable to update collection details"
      },
      500
    );
  }
});

/**
 * Update collection status
 * PATCH /admin/collections/:collectionId/status
 */
app.patch("/:collectionId/status", async (c) => {
  try {
    const { collectionId } = c.req.param();
    const { status } = await c.req.json();

    if (!["published", "draft", "archived"].includes(status)) {
      return c.json(
        {
          error: "Invalid status",
          message: "Status must be one of: published, draft, archived"
        },
        400
      );
    }

    const [updatedCollection] = await db
      .update(collection)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(collection.id, collectionId))
      .returning();

    if (!updatedCollection) {
      return c.json(
        {
          error: "Collection not found",
          message: "The specified collection does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: `Collection ${status} successfully`,
      collection: updatedCollection,
    });
  } catch (error) {
    console.error("Failed to update collection status:", error);
    return c.json(
      {
        error: "Failed to update collection status",
        message: "Unable to update collection status"
      },
      500
    );
  }
});

/**
 * Delete collection
 * DELETE /admin/collections/:collectionId
 */
app.delete("/:collectionId", async (c) => {
  try {
    const { collectionId } = c.req.param();

    const [deletedCollection] = await db
      .delete(collection)
      .where(eq(collection.id, collectionId))
      .returning();

    if (!deletedCollection) {
      return c.json(
        {
          error: "Collection not found",
          message: "The specified collection does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Collection deleted successfully",
      collection: deletedCollection,
    });
  } catch (error) {
    console.error("Failed to delete collection:", error);
    return c.json(
      {
        error: "Failed to delete collection",
        message: "Unable to delete collection"
      },
      500
    );
  }
});

/**
 * Get collection statistics
 * GET /admin/collections/stats
 */
app.get("/stats", async (c) => {
  try {
    // Get collection counts by status
    const statusStats = await db
      .select({
        status: collection.status,
        count: sql`COUNT(*)::int`,
      })
      .from(collection)
      .groupBy(collection.status);

    // Get total items across all collections
    const totalItems = await db
      .select({
        totalItems: sql`SUM(${collection.itemCount})::int`,
        avgItems: sql`AVG(${collection.itemCount})::decimal(10,2)`,
      })
      .from(collection);

    // Get recent collections (last 30 days)
    const recentCollections = await db
      .select({
        count: sql`COUNT(*)::int`,
      })
      .from(collection)
      .where(sql`${collection.createdAt} >= NOW() - INTERVAL '30 days'`);

    const stats = {
      totalCollections: statusStats.reduce((sum, stat) => sum + Number(stat.count), 0),
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = Number(stat.count);
        return acc;
      }, {} as Record<string, number>),
      totalItems: Number(totalItems[0]?.totalItems || 0),
      averageItemsPerCollection: Number(totalItems[0]?.avgItems) || 0,
      recentCollections: Number(recentCollections[0]?.count || 0),
    };

    return c.json({ stats });
  } catch (error) {
    console.error("Failed to fetch collection stats:", error);
    return c.json(
      {
        error: "Failed to fetch collection statistics",
        message: "Unable to retrieve collection statistics"
      },
      500
    );
  }
});

export { app as collectionsRoutes };