import { Hono } from "hono";
import { db } from "../../db";
import { review, place, user } from "../../db/schemas";
import { eq, desc, ilike, sql, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const app = new Hono();

/**
 * Get all reviews with pagination and filtering
 * GET /admin/reviews
 */
app.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = "",
      status = "",
      placeId = "",
      userId = "",
      rating = "",
      verifiedStay = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(LOWER(${review.title}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${review.content}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${place.name}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${user.name}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${user.email}) ILIKE ${'%' + search.toLowerCase() + '%'})`
      );
    }

    if (status) {
      conditions.push(eq(review.status, status as any));
    }

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
      status: review.status,
      helpfulCount: review.helpfulCount,
      verifiedStay: review.verifiedStay,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      responseDate: review.responseDate,
    }[sortBy] || review.createdAt;

    const orderDirection = sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(review)
      .innerJoin(place, eq(review.placeId, place.id))
      .innerJoin(user, eq(review.userId, user.id))
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
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        placeName: place.name,
        placeType: place.type,
        placeCategory: place.category,
        placeAddress: place.address,
        userName: user.name,
        userEmail: user.email,
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
 * Get review by ID
 * GET /admin/reviews/:reviewId
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
        status: review.status,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        placeName: place.name,
        placeType: place.type,
        placeCategory: place.category,
        placeAddress: place.address,
        userName: user.name,
        userEmail: user.email,
        userAvatar: user.avatar,
      })
      .from(review)
      .innerJoin(place, eq(review.placeId, place.id))
      .innerJoin(user, eq(review.userId, user.id))
      .where(eq(review.id, reviewId))
      .limit(1);

    if (!reviewData) {
      return c.json(
        {
          error: "Review not found",
          message: "The specified review does not exist"
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
 * Update review
 * PUT /admin/reviews/:reviewId
 */
app.put("/:reviewId", async (c) => {
  try {
    const { reviewId } = c.req.param();
    const updates = await c.req.json();

    // Remove fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, placeName, placeType, placeCategory, placeAddress, userName, userEmail, userAvatar, ...allowedUpdates } = updates;

    const [updatedReview] = await db
      .update(review)
      .set({
        ...allowedUpdates,
        updatedAt: new Date(),
      })
      .where(eq(review.id, reviewId))
      .returning();

    if (!updatedReview) {
      return c.json(
        {
          error: "Review not found",
          message: "The specified review does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Failed to update review:", error);
    return c.json(
      {
        error: "Failed to update review",
        message: "Unable to update review details"
      },
      500
    );
  }
});

/**
 * Update review status
 * PATCH /admin/reviews/:reviewId/status
 */
app.patch("/:reviewId/status", async (c) => {
  try {
    const { reviewId } = c.req.param();
    const { status, reason } = await c.req.json();

    if (!["published", "hidden", "flagged"].includes(status)) {
      return c.json(
        {
          error: "Invalid status",
          message: "Status must be one of: published, hidden, flagged"
        },
        400
      );
    }

    const [updatedReview] = await db
      .update(review)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(review.id, reviewId))
      .returning();

    if (!updatedReview) {
      return c.json(
        {
          error: "Review not found",
          message: "The specified review does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: `Review ${status} successfully`,
      review: updatedReview,
      reason: reason || null,
    });
  } catch (error) {
    console.error("Failed to update review status:", error);
    return c.json(
      {
        error: "Failed to update review status",
        message: "Unable to update review status"
      },
      500
    );
  }
});

/**
 * Add owner response to review
 * PATCH /admin/reviews/:reviewId/respond
 */
app.patch("/:reviewId/respond", async (c) => {
  try {
    const { reviewId } = c.req.param();
    const { response } = await c.req.json();

    if (!response || response.trim().length === 0) {
      return c.json(
        {
          error: "Response required",
          message: "Response text cannot be empty"
        },
        400
      );
    }

    const [updatedReview] = await db
      .update(review)
      .set({
        response: response.trim(),
        responseDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(review.id, reviewId))
      .returning();

    if (!updatedReview) {
      return c.json(
        {
          error: "Review not found",
          message: "The specified review does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Response added successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Failed to add response:", error);
    return c.json(
      {
        error: "Failed to add response",
        message: "Unable to add response to review"
      },
      500
    );
  }
});

/**
 * Toggle verified stay status
 * PATCH /admin/reviews/:reviewId/verify
 */
app.patch("/:reviewId/verify", async (c) => {
  try {
    const { reviewId } = c.req.param();

    const [currentReview] = await db
      .select({ verifiedStay: review.verifiedStay })
      .from(review)
      .where(eq(review.id, reviewId))
      .limit(1);

    if (!currentReview) {
      return c.json(
        {
          error: "Review not found",
          message: "The specified review does not exist"
        },
        404
      );
    }

    const [updatedReview] = await db
      .update(review)
      .set({
        verifiedStay: !currentReview.verifiedStay,
        updatedAt: new Date(),
      })
      .where(eq(review.id, reviewId))
      .returning();

    return c.json({
      success: true,
      message: `Stay verification ${updatedReview.verifiedStay ? "confirmed" : "removed"} successfully`,
      review: updatedReview,
    });
  } catch (error) {
    console.error("Failed to toggle verified stay:", error);
    return c.json(
      {
        error: "Failed to toggle verified stay",
        message: "Unable to update verified stay status"
      },
      500
    );
  }
});

/**
 * Delete review
 * DELETE /admin/reviews/:reviewId
 */
app.delete("/:reviewId", async (c) => {
  try {
    const { reviewId } = c.req.param();

    const [deletedReview] = await db
      .delete(review)
      .where(eq(review.id, reviewId))
      .returning();

    if (!deletedReview) {
      return c.json(
        {
          error: "Review not found",
          message: "The specified review does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Review deleted successfully",
      review: deletedReview,
    });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return c.json(
      {
        error: "Failed to delete review",
        message: "Unable to delete review"
      },
      500
    );
  }
});

/**
 * Get review statistics
 * GET /admin/reviews/stats
 */
app.get("/stats", async (c) => {
  try {
    // Get review counts by status
    const statusStats = await db
      .select({
        status: review.status,
        count: sql`COUNT(*)::int`,
      })
      .from(review)
      .groupBy(review.status);

    // Get rating distribution
    const ratingStats = await db
      .select({
        rating: review.rating,
        count: sql`COUNT(*)::int`,
      })
      .from(review)
      .groupBy(review.rating)
      .orderBy(sql`${review.rating} DESC`);

    // Get verification stats
    const verificationStats = await db
      .select({
        verifiedStay: review.verifiedStay,
        count: sql`COUNT(*)::int`,
      })
      .from(review)
      .groupBy(review.verifiedStay);

    // Get engagement stats
    const engagementStats = await db
      .select({
        totalReviews: sql`COUNT(*)::int`,
        totalHelpfulVotes: sql`SUM(${review.helpfulCount})::int`,
        avgRating: sql`AVG(${review.rating})::decimal(3,2)`,
        totalWithResponses: sql`COUNT(${review.response})::int`,
      })
      .from(review);

    // Get recent reviews (last 30 days)
    const recentReviews = await db
      .select({
        count: sql`COUNT(*)::int`,
        avgRating: sql`AVG(${review.rating})::decimal(3,2)`,
      })
      .from(review)
      .where(sql`${review.createdAt} >= NOW() - INTERVAL '30 days'`);

    const stats = {
      totalReviews: engagementStats[0]?.totalReviews || 0,
      averageRating: Number(engagementStats[0]?.avgRating) || 0,
      totalHelpfulVotes: engagementStats[0]?.totalHelpfulVotes || 0,
      totalWithResponses: engagementStats[0]?.totalWithResponses || 0,
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      ratingDistribution: ratingStats.reduce((acc, stat) => {
        acc[stat.rating] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      verifiedStays: verificationStats.find(s => s.verifiedStay)?.count || 0,
      unverifiedStays: verificationStats.find(s => !s.verifiedStay)?.count || 0,
      recentReviews: recentReviews[0]?.count || 0,
      recentAverageRating: Number(recentReviews[0]?.avgRating) || 0,
    };

    return c.json({ stats });
  } catch (error) {
    console.error("Failed to fetch review stats:", error);
    return c.json(
      {
        error: "Failed to fetch review statistics",
        message: "Unable to retrieve review statistics"
      },
      500
    );
  }
});

export { app as reviewsRoutes };