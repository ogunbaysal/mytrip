import { Hono } from "hono";
import { db } from "../../db";
import { booking, place, user } from "../../db/schemas";
import { eq, desc, ilike, sql, and, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";

const app = new Hono();

/**
 * Get all bookings with pagination and filtering
 * GET /admin/bookings
 */
app.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = "",
      status = "",
      paymentStatus = "",
      placeId = "",
      userId = "",
      dateFrom = "",
      dateTo = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(LOWER(${booking.bookingReference}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${place.name}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${user.name}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${user.email}) ILIKE ${'%' + search.toLowerCase() + '%'})`
      );
    }

    if (status) {
      conditions.push(eq(booking.status, status as any));
    }

    if (paymentStatus) {
      conditions.push(eq(booking.paymentStatus, paymentStatus as any));
    }

    if (placeId) {
      conditions.push(eq(booking.placeId, placeId));
    }

    if (userId) {
      conditions.push(eq(booking.userId, userId));
    }

    if (dateFrom) {
      conditions.push(gte(booking.checkInDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(booking.checkOutDate, dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    // Build order by clause
    const orderByColumn = {
      bookingReference: booking.bookingReference,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }[sortBy] || booking.createdAt;

    const orderDirection = sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(booking)
      .innerJoin(place, eq(booking.placeId, place.id))
      .innerJoin(user, eq(booking.userId, user.id))
      .where(whereClause);

    // Get bookings with place and user info
    const bookings = await db
      .select({
        id: booking.id,
        bookingReference: booking.bookingReference,
        placeId: booking.placeId,
        userId: booking.userId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        specialRequests: booking.specialRequests,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        placeName: place.name,
        placeType: place.type,
        placeCategory: place.category,
        placeAddress: place.address,
        placeCity: place.city,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
      })
      .from(booking)
      .innerJoin(place, eq(booking.placeId, place.id))
      .innerJoin(user, eq(booking.userId, user.id))
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    return c.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count,
        totalPages: Math.ceil(count / limitInt),
      },
    });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return c.json(
      {
        error: "Failed to fetch bookings",
        message: "Unable to retrieve bookings"
      },
      500
    );
  }
});

/**
 * Get booking by ID
 * GET /admin/bookings/:bookingId
 */
app.get("/:bookingId", async (c) => {
  try {
    const { bookingId } = c.req.param();

    const [bookingData] = await db
      .select({
        id: booking.id,
        bookingReference: booking.bookingReference,
        placeId: booking.placeId,
        userId: booking.userId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        specialRequests: booking.specialRequests,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        placeName: place.name,
        placeType: place.type,
        placeCategory: place.category,
        placeAddress: place.address,
        placeCity: place.city,
        placeContactInfo: place.contactInfo,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
      })
      .from(booking)
      .innerJoin(place, eq(booking.placeId, place.id))
      .innerJoin(user, eq(booking.userId, user.id))
      .where(eq(booking.id, bookingId))
      .limit(1);

    if (!bookingData) {
      return c.json(
        {
          error: "Booking not found",
          message: "The specified booking does not exist"
        },
        404
      );
    }

    return c.json({ booking: bookingData });
  } catch (error) {
    console.error("Failed to fetch booking:", error);
    return c.json(
      {
        error: "Failed to fetch booking",
        message: "Unable to retrieve booking details"
      },
      500
    );
  }
});

/**
 * Create new booking (admin can create on behalf of users)
 * POST /admin/bookings
 */
app.post("/", async (c) => {
  try {
    const bookingData = await c.req.json();

    const newBooking = {
      id: nanoid(),
      placeId: bookingData.placeId,
      userId: bookingData.userId,
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      guests: bookingData.guests,
      totalPrice: bookingData.totalPrice,
      currency: bookingData.currency || "TRY",
      status: bookingData.status || "pending",
      paymentStatus: bookingData.paymentStatus || "pending",
      specialRequests: bookingData.specialRequests,
      bookingReference: bookingData.bookingReference || `BK${Date.now()}${nanoid(4).toUpperCase()}`,
    };

    const [createdBooking] = await db.insert(booking).values(newBooking).returning();

    return c.json({
      success: true,
      message: "Booking created successfully",
      booking: createdBooking,
    });
  } catch (error) {
    console.error("Failed to create booking:", error);
    return c.json(
      {
        error: "Failed to create booking",
        message: "Unable to create new booking"
      },
      500
    );
  }
});

/**
 * Update booking
 * PUT /admin/bookings/:bookingId
 */
app.put("/:bookingId", async (c) => {
  try {
    const { bookingId } = c.req.param();
    const updates = await c.req.json();

    // Remove fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, placeName, placeType, placeCategory, placeAddress, placeCity, userName, userEmail, userPhone, ...allowedUpdates } = updates;

    const [updatedBooking] = await db
      .update(booking)
      .set({
        ...allowedUpdates,
        updatedAt: new Date(),
      })
      .where(eq(booking.id, bookingId))
      .returning();

    if (!updatedBooking) {
      return c.json(
        {
          error: "Booking not found",
          message: "The specified booking does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Failed to update booking:", error);
    return c.json(
      {
        error: "Failed to update booking",
        message: "Unable to update booking details"
      },
      500
    );
  }
});

/**
 * Update booking status
 * PATCH /admin/bookings/:bookingId/status
 */
app.patch("/:bookingId/status", async (c) => {
  try {
    const { bookingId } = c.req.param();
    const { status, reason } = await c.req.json();

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return c.json(
        {
          error: "Invalid status",
          message: "Status must be one of: pending, confirmed, cancelled, completed"
        },
        400
      );
    }

    const [updatedBooking] = await db
      .update(booking)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(booking.id, bookingId))
      .returning();

    if (!updatedBooking) {
      return c.json(
        {
          error: "Booking not found",
          message: "The specified booking does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: `Booking ${status} successfully`,
      booking: updatedBooking,
      reason: reason || null,
    });
  } catch (error) {
    console.error("Failed to update booking status:", error);
    return c.json(
      {
        error: "Failed to update booking status",
        message: "Unable to update booking status"
      },
      500
    );
  }
});

/**
 * Update payment status
 * PATCH /admin/bookings/:bookingId/payment
 */
app.patch("/:bookingId/payment", async (c) => {
  try {
    const { bookingId } = c.req.param();
    const { paymentStatus, reason } = await c.req.json();

    if (!["pending", "paid", "refunded"].includes(paymentStatus)) {
      return c.json(
        {
          error: "Invalid payment status",
          message: "Payment status must be one of: pending, paid, refunded"
        },
        400
      );
    }

    const [updatedBooking] = await db
      .update(booking)
      .set({
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(booking.id, bookingId))
      .returning();

    if (!updatedBooking) {
      return c.json(
        {
          error: "Booking not found",
          message: "The specified booking does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: `Payment status updated to ${paymentStatus} successfully`,
      booking: updatedBooking,
      reason: reason || null,
    });
  } catch (error) {
    console.error("Failed to update payment status:", error);
    return c.json(
      {
        error: "Failed to update payment status",
        message: "Unable to update payment status"
      },
      500
    );
  }
});

/**
 * Delete booking
 * DELETE /admin/bookings/:bookingId
 */
app.delete("/:bookingId", async (c) => {
  try {
    const { bookingId } = c.req.param();

    const [deletedBooking] = await db
      .delete(booking)
      .where(eq(booking.id, bookingId))
      .returning();

    if (!deletedBooking) {
      return c.json(
        {
          error: "Booking not found",
          message: "The specified booking does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Booking deleted successfully",
      booking: deletedBooking,
    });
  } catch (error) {
    console.error("Failed to delete booking:", error);
    return c.json(
      {
        error: "Failed to delete booking",
        message: "Unable to delete booking"
      },
      500
    );
  }
});

/**
 * Get booking statistics
 * GET /admin/bookings/stats
 */
app.get("/stats", async (c) => {
  try {
    // Get booking counts by status
    const statusStats = await db
      .select({
        status: booking.status,
        count: sql`COUNT(*)::int`,
        totalRevenue: sql`SUM(${booking.totalPrice})::decimal(10,2)`,
      })
      .from(booking)
      .groupBy(booking.status);

    // Get payment status counts
    const paymentStats = await db
      .select({
        paymentStatus: booking.paymentStatus,
        count: sql`COUNT(*)::int`,
        totalRevenue: sql`SUM(${booking.totalPrice})::decimal(10,2)`,
      })
      .from(booking)
      .groupBy(booking.paymentStatus);

    // Get recent bookings (last 30 days)
    const recentBookings = await db
      .select({
        count: sql`COUNT(*)::int`,
        totalRevenue: sql`SUM(${booking.totalPrice})::decimal(10,2)`,
      })
      .from(booking)
      .where(sql`${booking.createdAt} >= NOW() - INTERVAL '30 days'`);

    // Get upcoming bookings
    const upcomingBookings = await db
      .select({
        count: sql`COUNT(*)::int`,
        totalRevenue: sql`SUM(${booking.totalPrice})::decimal(10,2)`,
      })
      .from(booking)
      .where(sql`${booking.checkInDate} >= CURRENT_DATE AND ${booking.status} = 'confirmed'`);

    // Get monthly revenue trend (last 6 months)
    const monthlyRevenue = await db
      .select({
        month: sql`DATE_TRUNC('month', ${booking.createdAt})::date`,
        count: sql`COUNT(*)::int`,
        revenue: sql`SUM(${booking.totalPrice})::decimal(10,2)`,
      })
      .from(booking)
      .where(sql`${booking.createdAt} >= NOW() - INTERVAL '6 months'`)
      .groupBy(sql`DATE_TRUNC('month', ${booking.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${booking.createdAt}) DESC`);

    const stats = {
      totalBookings: statusStats.reduce((sum, stat) => sum + stat.count, 0),
      totalRevenue: statusStats.reduce((sum, stat) => sum + Number(stat.totalRevenue), 0),
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: stat.count,
          revenue: Number(stat.totalRevenue),
        };
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>),
      byPaymentStatus: paymentStats.reduce((acc, stat) => {
        acc[stat.paymentStatus] = {
          count: stat.count,
          revenue: Number(stat.totalRevenue),
        };
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>),
      recentBookings: recentBookings[0]?.count || 0,
      recentRevenue: Number(recentBookings[0]?.totalRevenue) || 0,
      upcomingBookings: upcomingBookings[0]?.count || 0,
      upcomingRevenue: Number(upcomingBookings[0]?.totalRevenue) || 0,
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: item.month,
        count: item.count,
        revenue: Number(item.revenue),
      })),
    };

    return c.json({ stats });
  } catch (error) {
    console.error("Failed to fetch booking stats:", error);
    return c.json(
      {
        error: "Failed to fetch booking statistics",
        message: "Unable to retrieve booking statistics"
      },
      500
    );
  }
});

export { app as bookingsRoutes };