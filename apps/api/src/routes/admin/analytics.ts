import { Hono } from "hono";
import { db } from "../../db";
import { analyticsEvent, place, user, booking, review } from "../../db/schemas";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

const app = new Hono();

/**
 * Get analytics overview
 * GET /admin/analytics/overview
 */
app.get("/overview", async (c) => {
  try {
    const { period = "30" } = c.req.query();
    const daysAgo = parseInt(period);

    // Get user analytics
    const userStats = await db
      .select({
        totalUsers: sql`COUNT(*)::int`,
        newUsers: sql`COUNT(CASE WHEN ${user.createdAt} >= NOW() - INTERVAL '${daysAgo} days' THEN 1 END)::int`,
        activeUsers: sql`COUNT(CASE WHEN ${user.lastLoginAt} >= NOW() - INTERVAL '7 days' THEN 1 END)::int`,
      })
      .from(user);

    // Get place analytics
    const placeStats = await db
      .select({
        totalPlaces: sql`COUNT(*)::int`,
        activePlaces: sql`COUNT(CASE WHEN ${place.status} = 'active' THEN 1 END)::int`,
        newPlaces: sql`COUNT(CASE WHEN ${place.createdAt} >= NOW() - INTERVAL '${daysAgo} days' THEN 1 END)::int`,
        totalViews: sql`SUM(${place.views})::int`,
        verifiedPlaces: sql`COUNT(CASE WHEN ${place.verified} = true THEN 1 END)::int`,
      })
      .from(place);

    // Get booking analytics
    const bookingStats = await db
      .select({
        totalBookings: sql`COUNT(*)::int`,
        newBookings: sql`COUNT(CASE WHEN ${booking.createdAt} >= NOW() - INTERVAL '${daysAgo} days' THEN 1 END)::int`,
        confirmedBookings: sql`COUNT(CASE WHEN ${booking.status} = 'confirmed' THEN 1 END)::int`,
        totalRevenue: sql`SUM(CASE WHEN ${booking.paymentStatus} = 'paid' THEN ${booking.totalPrice} ELSE 0 END)::decimal(10,2)`,
        recentRevenue: sql`SUM(CASE WHEN ${booking.paymentStatus} = 'paid' AND ${booking.createdAt} >= NOW() - INTERVAL '${daysAgo} days' THEN ${booking.totalPrice} ELSE 0 END)::decimal(10,2)`,
      })
      .from(booking);

    // Get review analytics
    const reviewStats = await db
      .select({
        totalReviews: sql`COUNT(*)::int`,
        newReviews: sql`COUNT(CASE WHEN ${review.createdAt} >= NOW() - INTERVAL '${daysAgo} days' THEN 1 END)::int`,
        averageRating: sql`AVG(${review.rating})::decimal(3,2)`,
        publishedReviews: sql`COUNT(CASE WHEN ${review.status} = 'published' THEN 1 END)::int`,
      })
      .from(review);

    // Get event analytics
    const eventStats = await db
      .select({
        totalEvents: sql`COUNT(*)::int`,
        recentEvents: sql`COUNT(CASE WHEN ${analyticsEvent.createdAt} >= NOW() - INTERVAL '${daysAgo} days' THEN 1 END)::int`,
        pageViews: sql`COUNT(CASE WHEN ${analyticsEvent.eventType} = 'view' THEN 1 END)::int`,
        searches: sql`COUNT(CASE WHEN ${analyticsEvent.eventType} = 'search' THEN 1 END)::int`,
        bookings: sql`COUNT(CASE WHEN ${analyticsEvent.eventType} = 'booking' THEN 1 END)::int`,
      })
      .from(analyticsEvent);

    const overview = {
      users: {
        total: userStats[0]?.totalUsers || 0,
        new: userStats[0]?.newUsers || 0,
        active: userStats[0]?.activeUsers || 0,
      },
      places: {
        total: placeStats[0]?.totalPlaces || 0,
        active: placeStats[0]?.activePlaces || 0,
        new: placeStats[0]?.newPlaces || 0,
        totalViews: placeStats[0]?.totalViews || 0,
        verified: placeStats[0]?.verifiedPlaces || 0,
      },
      bookings: {
        total: bookingStats[0]?.totalBookings || 0,
        new: bookingStats[0]?.newBookings || 0,
        confirmed: bookingStats[0]?.confirmedBookings || 0,
        totalRevenue: Number(bookingStats[0]?.totalRevenue) || 0,
        recentRevenue: Number(bookingStats[0]?.recentRevenue) || 0,
      },
      reviews: {
        total: reviewStats[0]?.totalReviews || 0,
        new: reviewStats[0]?.newReviews || 0,
        averageRating: Number(reviewStats[0]?.averageRating) || 0,
        published: reviewStats[0]?.publishedReviews || 0,
      },
      events: {
        total: eventStats[0]?.totalEvents || 0,
        recent: eventStats[0]?.recentEvents || 0,
        pageViews: eventStats[0]?.pageViews || 0,
        searches: eventStats[0]?.searches || 0,
        bookings: eventStats[0]?.bookings || 0,
      },
    };

    return c.json({ overview });
  } catch (error) {
    console.error("Failed to fetch analytics overview:", error);
    return c.json(
      {
        error: "Failed to fetch analytics overview",
        message: "Unable to retrieve analytics overview"
      },
      500
    );
  }
});

/**
 * Get events with pagination and filtering
 * GET /admin/analytics/events
 */
app.get("/events", async (c) => {
  try {
    const {
      page = "1",
      limit = "50",
      eventType = "",
      userId = "",
      placeId = "",
      dateFrom = "",
      dateTo = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions
    const conditions = [];

    if (eventType) {
      conditions.push(eq(analyticsEvent.eventType, eventType));
    }

    if (userId) {
      conditions.push(eq(analyticsEvent.userId, userId));
    }

    if (placeId) {
      conditions.push(eq(analyticsEvent.placeId, placeId));
    }

    if (dateFrom) {
      conditions.push(gte(analyticsEvent.createdAt, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(analyticsEvent.createdAt, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    // Build order by clause
    const orderByColumn = {
      eventType: analyticsEvent.eventType,
      createdAt: analyticsEvent.createdAt,
    }[sortBy] || analyticsEvent.createdAt;

    const orderDirection = sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(analyticsEvent)
      .where(whereClause);

    // Get events
    const events = await db
      .select()
      .from(analyticsEvent)
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    return c.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count,
        totalPages: Math.ceil(count / limitInt),
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics events:", error);
    return c.json(
      {
        error: "Failed to fetch analytics events",
        message: "Unable to retrieve analytics events"
      },
      500
    );
  }
});

/**
 * Get daily stats for the last period
 * GET /admin/analytics/daily-stats
 */
app.get("/daily-stats", async (c) => {
  try {
    const { period = "30" } = c.req.query();
    const daysAgo = parseInt(period);

    // Get daily user registrations
    const dailyUsers = await db
      .select({
        date: sql`DATE(${user.createdAt})::date`,
        count: sql`COUNT(*)::int`,
      })
      .from(user)
      .where(sql`${user.createdAt} >= NOW() - INTERVAL '${daysAgo} days'`)
      .groupBy(sql`DATE(${user.createdAt})`)
      .orderBy(sql`DATE(${user.createdAt})`);

    // Get daily bookings
    const dailyBookings = await db
      .select({
        date: sql`DATE(${booking.createdAt})::date`,
        count: sql`COUNT(*)::int`,
        revenue: sql`SUM(CASE WHEN ${booking.paymentStatus} = 'paid' THEN ${booking.totalPrice} ELSE 0 END)::decimal(10,2)`,
      })
      .from(booking)
      .where(sql`${booking.createdAt} >= NOW() - INTERVAL '${daysAgo} days'`)
      .groupBy(sql`DATE(${booking.createdAt})`)
      .orderBy(sql`DATE(${booking.createdAt})`);

    // Get daily events
    const dailyEvents = await db
      .select({
        date: sql`DATE(${analyticsEvent.createdAt})::date`,
        views: sql`COUNT(CASE WHEN ${analyticsEvent.eventType} = 'view' THEN 1 END)::int`,
        searches: sql`COUNT(CASE WHEN ${analyticsEvent.eventType} = 'search' THEN 1 END)::int`,
        bookings: sql`COUNT(CASE WHEN ${analyticsEvent.eventType} = 'booking' THEN 1 END)::int`,
      })
      .from(analyticsEvent)
      .where(sql`${analyticsEvent.createdAt} >= NOW() - INTERVAL '${daysAgo} days'`)
      .groupBy(sql`DATE(${analyticsEvent.createdAt})`)
      .orderBy(sql`DATE(${analyticsEvent.createdAt})`);

    const dailyStats = {
      users: dailyUsers.map(item => ({
        date: item.date,
        count: item.count,
      })),
      bookings: dailyBookings.map(item => ({
        date: item.date,
        count: item.count,
        revenue: Number(item.revenue),
      })),
      events: dailyEvents.map(item => ({
        date: item.date,
        views: item.views,
        searches: item.searches,
        bookings: item.bookings,
      })),
    };

    return c.json({ dailyStats });
  } catch (error) {
    console.error("Failed to fetch daily stats:", error);
    return c.json(
      {
        error: "Failed to fetch daily stats",
        message: "Unable to retrieve daily statistics"
      },
      500
    );
  }
});

/**
 * Track analytics event
 * POST /admin/analytics/events
 */
app.post("/events", async (c) => {
  try {
    const eventData = await c.req.json();

    const newEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: eventData.eventType,
      userId: eventData.userId,
      placeId: eventData.placeId,
      sessionId: eventData.sessionId || `session_${Date.now()}`,
      metadata: eventData.metadata,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    };

    const [createdEvent] = await db.insert(analyticsEvent).values(newEvent).returning();

    return c.json({
      success: true,
      message: "Analytics event tracked successfully",
      event: createdEvent,
    });
  } catch (error) {
    console.error("Failed to track analytics event:", error);
    return c.json(
      {
        error: "Failed to track analytics event",
        message: "Unable to save analytics event"
      },
      500
    );
  }
});

/**
 * Get popular places
 * GET /admin/analytics/popular-places
 */
app.get("/popular-places", async (c) => {
  try {
    const { period = "30", limit = "10" } = c.req.query();
    const daysAgo = parseInt(period);
    const limitInt = parseInt(limit);

    // Get popular places by views
    const popularByViews = await db
      .select({
        placeId: place.id,
        placeName: place.name,
        placeType: place.type,
        views: sql`SUM(${analyticsEvent.id})::int`, // Using id as a count proxy
      })
      .from(analyticsEvent)
      .innerJoin(place, eq(analyticsEvent.placeId, place.id))
      .where(
        and(
          eq(analyticsEvent.eventType, "view"),
          sql`${analyticsEvent.createdAt} >= NOW() - INTERVAL '${daysAgo} days'`
        )
      )
      .groupBy(place.id, place.name, place.type)
      .orderBy(sql`views DESC`)
      .limit(limitInt);

    // Get popular places by bookings
    const popularByBookings = await db
      .select({
        placeId: place.id,
        placeName: place.name,
        placeType: place.type,
        bookings: sql`COUNT(${booking.id})::int`,
        revenue: sql`SUM(CASE WHEN ${booking.paymentStatus} = 'paid' THEN ${booking.totalPrice} ELSE 0 END)::decimal(10,2)`,
      })
      .from(booking)
      .innerJoin(place, eq(booking.placeId, place.id))
      .where(sql`${booking.createdAt} >= NOW() - INTERVAL '${daysAgo} days'`)
      .groupBy(place.id, place.name, place.type)
      .orderBy(sql`bookings DESC`)
      .limit(limitInt);

    return c.json({
      popularByViews,
      popularByBookings,
    });
  } catch (error) {
    console.error("Failed to fetch popular places:", error);
    return c.json(
      {
        error: "Failed to fetch popular places",
        message: "Unable to retrieve popular places data"
      },
      500
    );
  }
});

export { app as analyticsRoutes };