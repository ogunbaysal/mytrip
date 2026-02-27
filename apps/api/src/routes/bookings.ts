import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.ts";
import { booking, hotelRoom, place } from "../db/schemas/index.ts";
import {
  buildPricingSnapshot,
  buildQuote,
  listAvailableRoomsForHotel,
  maybeAutoCompleteBookings,
} from "../lib/booking-domain.ts";
import { getSessionFromRequest } from "../lib/session.ts";

const app = new Hono();

const quoteQuerySchema = z.object({
  placeId: z.string().min(1),
  roomId: z.string().min(1).optional(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.coerce.number().int().min(1).max(30).default(1),
});

const createBookingSchema = z.object({
  placeId: z.string().min(1),
  roomId: z.string().min(1).optional(),
  checkInDate: z.string().min(1),
  checkOutDate: z.string().min(1),
  guests: z.number().int().min(1).max(30),
  specialRequests: z.string().max(2000).optional(),
});

const roomsQuerySchema = z.object({
  placeId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.coerce.number().int().min(1).max(30).default(1),
});

const isTravelerSession = (role: unknown): boolean => role === "traveler";

app.get("/quote", async (c) => {
  try {
    const parsed = quoteQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Validation failed", issues: parsed.error.issues }, 400);
    }

    const quote = await buildQuote({
      placeId: parsed.data.placeId,
      roomId: parsed.data.roomId,
      checkInDate: parsed.data.checkIn,
      checkOutDate: parsed.data.checkOut,
    });

    if (!quote.ok) {
      return c.json({ error: "Quote failed", message: quote.message }, quote.status);
    }

    return c.json({
      quote: {
        ...quote.quote,
        checkInDate: parsed.data.checkIn,
        checkOutDate: parsed.data.checkOut,
        guests: parsed.data.guests,
      },
    });
  } catch (error) {
    console.error("Get booking quote error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/rooms", async (c) => {
  try {
    const parsed = roomsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Validation failed", issues: parsed.error.issues }, 400);
    }

    const [placeData] = await db
      .select({
        id: place.id,
        kind: place.kind,
        status: place.status,
      })
      .from(place)
      .where(eq(place.id, parsed.data.placeId))
      .limit(1);

    if (!placeData) {
      return c.json({ error: "Validation failed", message: "Mekan bulunamadı" }, 404);
    }

    if (placeData.kind !== "hotel") {
      return c.json({ rooms: [] });
    }

    if (placeData.status !== "active") {
      return c.json({ error: "Validation failed", message: "Mekan rezervasyona uygun değil" }, 400);
    }

    const rooms = await listAvailableRoomsForHotel({
      placeId: parsed.data.placeId,
      checkInDate: parsed.data.checkIn,
      checkOutDate: parsed.data.checkOut,
      guests: parsed.data.guests,
    });

    return c.json({ rooms });
  } catch (error) {
    console.error("List booking rooms error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/", zValidator("json", createBookingSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!isTravelerSession(session.user.role)) {
      return c.json({ error: "Forbidden", message: "Sadece gezgin hesapları rezervasyon oluşturabilir" }, 403);
    }

    const data = c.req.valid("json");
    const quote = await buildQuote({
      placeId: data.placeId,
      roomId: data.roomId,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
    });

    if (!quote.ok) {
      return c.json({ error: "Reservation failed", message: quote.message }, quote.status);
    }

    const bookingId = nanoid();
    const bookingReference = `BK${Date.now()}${nanoid(4).toUpperCase()}`;
    const snapshot = buildPricingSnapshot(quote.quote);

    const [created] = await db
      .insert(booking)
      .values({
        id: bookingId,
        placeId: data.placeId,
        roomId: quote.quote.room?.id ?? null,
        userId: session.user.id,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        guests: data.guests,
        totalPrice: quote.quote.total.toFixed(2),
        currency: quote.quote.currency,
        status: "pending",
        specialRequests: data.specialRequests,
        pricingSnapshot: JSON.stringify(snapshot),
        paymentStatus: "pending",
        bookingReference,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return c.json(
      {
        success: true,
        message: "Rezervasyon oluşturuldu",
        booking: {
          ...created,
          pricingSnapshot: snapshot,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Create booking error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/me", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    await maybeAutoCompleteBookings();

    const reservations = await db
      .select({
        id: booking.id,
        bookingReference: booking.bookingReference,
        placeId: booking.placeId,
        roomId: booking.roomId,
        userId: booking.userId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        specialRequests: booking.specialRequests,
        pricingSnapshot: booking.pricingSnapshot,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        placeName: place.name,
        placeSlug: place.slug,
        roomName: hotelRoom.name,
      })
      .from(booking)
      .innerJoin(place, eq(booking.placeId, place.id))
      .leftJoin(hotelRoom, eq(booking.roomId, hotelRoom.id))
      .where(eq(booking.userId, session.user.id))
      .orderBy(desc(booking.createdAt));

    return c.json({
      reservations: reservations.map((item) => ({
        ...item,
        pricingSnapshot: item.pricingSnapshot
          ? JSON.parse(item.pricingSnapshot)
          : null,
      })),
    });
  } catch (error) {
    console.error("Get my bookings error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/me/:bookingId", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    await maybeAutoCompleteBookings();

    const bookingId = c.req.param("bookingId");
    const [reservation] = await db
      .select({
        id: booking.id,
        bookingReference: booking.bookingReference,
        placeId: booking.placeId,
        roomId: booking.roomId,
        userId: booking.userId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        specialRequests: booking.specialRequests,
        pricingSnapshot: booking.pricingSnapshot,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        placeName: place.name,
        placeSlug: place.slug,
        roomName: hotelRoom.name,
      })
      .from(booking)
      .innerJoin(place, eq(booking.placeId, place.id))
      .leftJoin(hotelRoom, eq(booking.roomId, hotelRoom.id))
      .where(and(eq(booking.id, bookingId), eq(booking.userId, session.user.id)))
      .limit(1);

    if (!reservation) {
      return c.json({ error: "Reservation not found" }, 404);
    }

    return c.json({
      reservation: {
        ...reservation,
        pricingSnapshot: reservation.pricingSnapshot
          ? JSON.parse(reservation.pricingSnapshot)
          : null,
      },
    });
  } catch (error) {
    console.error("Get my booking detail error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { app as bookingsRoutes };
