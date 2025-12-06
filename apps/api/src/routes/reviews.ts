import { Hono } from "hono";
import { db } from "../db";
import { review, place, user } from "../db/schemas";
import { eq, desc, ilike, sql, and, gt } from "drizzle-orm";
import { nanoid } from "nanoid";

const app = new Hono();

/**
 * Get reviews with pagination and filtering
 * GET /reviews
 */
app.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "20",
      placeId = "",
      userId = "",
      rating = "",
      verifiedStay = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions for public API (only published reviews)
    const conditions = [eq(review.status, "published")];

    if (placeId) {
      conditions.push(eq(review.placeId, placeId));
    }

    if (userId) {
      conditions.push(eq(review.userId, userId));
    }

    if (rating) {
      conditions.push(eq(review.rating, parseInt(rating)));
    }

    if (verifiedStay !== "") {
      conditions.push(eq(review.verifiedStay, verifiedStay === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    // Build order by clause
    const orderByColumn = {
      rating: review.rating,
      helpfulCount: review.helpfulCount,
      verifiedStay: review.verifiedStay,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }[sortBy] || review.createdAt;

    const orderDirection = sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(review)
      .where(whereClause);

    // Get reviews with place and user info
    const reviews = await db
      .select({
        id: review.id,
        placeId: review.placeId,
        userId: review.userId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        images: review.images,
        helpfulCount: review.helpfulCount,
        verifiedStay: review.verifiedStay,
        response: review.response,
        responseDate: review.responseDate,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        placeName: place.name,
        placeType: place.type,
        placeCategory: place.category,
        placeCity: place.city,
        placeImages: place.images,
        userName: user.name,
        userAvatar: user.avatar,
      })
      .from(review)
      .innerJoin(place, eq(review.placeId, place.id))
      .innerJoin(user, eq(review.userId, user.id))
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    return c.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count,
        totalPages: Math.ceil(count / limitInt),
      },
      filters: {
        placeId,
        userId,
        rating,
        verifiedStay,
      },
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return c.json(
      {
        error: "Failed to fetch reviews",
        message: "Unable to retrieve reviews"
      },
      500
    );
  }
});

/**
 * Get reviews for a specific place
 * GET /reviews/place/:placeId
 */
app.get("/place/:placeId", async (c) => {
  try {
    const { placeId } = c.req.param();
    const {
      page = "1",
      limit = "10",
      rating = "",
      verifiedStay = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions
    const conditions = [
      eq(review.placeId, placeId),
      eq(review.status, "published"),
    ];

    if (rating) {
      conditions.push(eq(review.rating, parseInt(rating)));
    }

    if (verifiedStay !== "") {
      conditions.push(eq(review.verifiedStay, verifiedStay === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    // Build order by clause
    const orderByColumn = {
      rating: review.rating,
      helpfulCount: review.helpfulCount,
      verifiedStay: review.verifiedStay,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }[sortBy] || review.createdAt;

    const orderDirection = sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(review)
      .where(whereClause);

    // Get reviews with user info
    const reviews = await db
      .select({
        id: review.id,
        userId: review.userId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        images: review.images,
        helpfulCount: review.helpfulCount,
        verifiedStay: review.verifiedStay,
        response: review.response,
        responseDate: review.responseDate,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        userName: user.name,
        userAvatar: user.avatar,
      })
      .from(review)
      .innerJoin(user, eq(review.userId, user.id))
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    // Get rating distribution for this place
    const ratingDistribution = await db
      .select({
        rating: review.rating,
        count: sql`COUNT(*)::int`,
      })
      .from(review)
      .where(and(eq(review.placeId, placeId), eq(review.status, "published")))
      .groupBy(review.rating)
      .orderBy(sql`${review.rating} DESC`);

    // Get average rating and total reviews for this place
    const [placeStats] = await db
      .select({
        averageRating: sql`AVG(${review.rating})::decimal(3,2)`,
        totalReviews: sql`COUNT(*)::int`,
        verifiedReviews: sql`COUNT(CASE WHEN ${review.verifiedStay} = true THEN 1 END)::int`,
      })
      .from(review)
      .where(and(eq(review.placeId, placeId), eq(review.status, "published")));

    return c.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count,
        totalPages: Math.ceil(count / limitInt),
      },
      stats: {
        averageRating: Number(placeStats?.averageRating) || 0,
        totalReviews: placeStats?.totalReviews || 0,
        verifiedReviews: placeStats?.verifiedReviews || 0,
        ratingDistribution: ratingDistribution.reduce((acc, stat) => {
          acc[stat.rating] = stat.count;
          return acc;
        }, {} as Record<number, number>),
      },
    });
  } catch (error) {
    console.error("Failed to fetch place reviews:", error);
    return c.json(
      {
        error: "Failed to fetch place reviews",
        message: "Unable to retrieve place reviews"
      },
      500
    );
  }
});

/**
 * Get review by ID
 * GET /reviews/:reviewId
 */
app.get("/:reviewId", async (c) => {
  try {
    const { reviewId } = c.req.param();

    const [reviewData] = await db
      .select({
        id: review.id,
        placeId: review.placeId,
        userId: review.userId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        images: review.images,
        helpfulCount: review.helpfulCount,
        verifiedStay: review.verifiedStay,
        response: review.response,
        responseDate: review.responseDate,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        placeName: place.name,
        placeType: place.type,
        placeCategory: place.category,
        placeAddress: place.address,
        placeImages: place.images,
        userName: user.name,
        userAvatar: user.avatar,
      })
      .from(review)
      .innerJoin(place, eq(review.placeId, place.id))
      .innerJoin(user, eq(review.userId, user.id))
      .where(and(eq(review.id, reviewId), eq(review.status, "published")))
      .limit(1);

    if (!reviewData) {
      return c.json(
        {
          error: "Review not found",
          message: "The specified review does not exist or is not available"
        },
        404
      );
    }

    return c.json({ review: reviewData });
  } catch (error) {
    console.error("Failed to fetch review:", error);
    return c.json(
      {
        error: "Failed to fetch review",
        message: "Unable to retrieve review details"
      },
      500
    );
  }
});

/**
 * Mark review as helpful
 * POST /reviews/:reviewId/helpful
 */
app.post("/:reviewId/helpful", async (c) => {
  try {
    const { reviewId } = c.req.param();

    const [updatedReview] = await db
      .update(review)
      .set({
        helpfulCount: sql`${review.helpfulCount} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(review.id, reviewId), eq(review.status, "published")))
      .returning();

    if (!updatedReview) {
      return c.json(
        {
          error: "Review not found",
          message: "The specified review does not exist or is not available"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Review marked as helpful",
      helpfulCount: updatedReview.helpfulCount,
    });
  } catch (error) {
    console.error("Failed to mark review as helpful:", error);
    return c.json(
      {
        error: "Failed to mark review as helpful",
        message: "Unable to update helpful count"
      },
      500
    );
  }
});

/**
 * Get recent reviews
 * GET /reviews/recent
 */
app.get("/recent", async (c) => {
  try {
    const { limit = "6" } = c.req.query();
    const limitInt = parseInt(limit);

    const recentReviews = await db
      .select({
        id: review.id,
        placeId: review.placeId,
        userId: review.userId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        helpfulCount: review.helpfulCount,
        verifiedStay: review.verifiedStay,
        createdAt: review.createdAt,
        placeName: place.name,
        placeType: place.type,
        placeCategory: place.category,
        placeImages: place.images,
        userName: user.name,
        userAvatar: user.avatar,
      })
      .from(review)
      .innerJoin(place, eq(review.placeId, place.id))
      .innerJoin(user, eq(review.userId, user.id))
      .where(eq(review.status, "published"))
      .orderBy(desc(review.createdAt))
      .limit(limitInt);

    return c.json({
      reviews: recentReviews,
      count: recentReviews.length,
    });
  } catch (error) {
    console.error("Failed to fetch recent reviews:", error);
    return c.json(
      {
        error: "Failed to fetch recent reviews",
        message: "Unable to retrieve recent reviews"
      },
      500
    );
  }
});

/**
 * Get top rated reviews
 * GET /reviews/top-rated
 */
app.get("/top-rated", async (c) => {
  try {
    const { limit = "6", minRating = "4" } = c.req.query();
    const limitInt = parseInt(limit);
    const minRatingInt = parseInt(minRating);

    const topRatedReviews = await db
      .select({
        id: review.id,
        placeId: review.placeId,
        userId: review.userId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        helpfulCount: review.helpfulCount,
        verifiedStay: review.verifiedStay,
        createdAt: review.createdAt,
        placeName: place.name,
        placeType: place.type,
        placeCategory: place.category,
        placeImages: place.images,
        userName: user.name,
        userAvatar: user.avatar,
      })
      .from(review)
      .innerJoin(place, eq(review.placeId, place.id))
      .innerJoin(user, eq(review.userId, user.id))
      .where(and(
        eq(review.status, "published"),
        sql`${review.rating} >= ${minRatingInt}`,
        eq(review.verifiedStay, true)
      ))
      .orderBy(desc(review.rating), desc(review.helpfulCount), desc(review.createdAt))
      .limit(limitInt);

    return c.json({
      reviews: topRatedReviews,
      count: topRatedReviews.length,
    });
  } catch (error) {
    console.error("Failed to fetch top rated reviews:", error);
    return c.json(
      {
        error: "Failed to fetch top rated reviews",
        message: "Unable to retrieve top rated reviews"
      },
      500
    );
  }
});

export { app as reviewsRoutes };