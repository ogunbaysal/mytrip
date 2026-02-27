import { and, eq, gte, inArray, isNull, lte, lt, gt } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  booking,
  hotelRoom,
  hotelRoomAvailabilityBlock,
  hotelRoomRate,
  place,
  placeAvailabilityBlock,
  placePriceRule,
} from "../db/schemas/index.ts";

export type BookingWindowValidation =
  | { ok: true }
  | { ok: false; message: string };

type StayPlace = {
  id: string;
  kind: string;
  status: string;
  nightlyPrice: string | null;
  currency: "TRY" | "USD" | "EUR";
};

type RoomContext = {
  id: string;
  placeId: string;
  status: string;
  baseNightlyPrice: string | null;
};

type NightlyLine = {
  date: string;
  nightlyPrice: number;
  sourceType:
    | "place_base"
    | "room_base"
    | "place_price_rule"
    | "room_price_rule";
  sourceId: string;
};

type QuoteInput = {
  placeId: string;
  roomId?: string | null;
  checkInDate: string;
  checkOutDate: string;
};

type QuoteResult = {
  currency: "TRY" | "USD" | "EUR";
  nights: number;
  nightlyLines: NightlyLine[];
  subtotal: number;
  total: number;
  place: StayPlace;
  room: RoomContext | null;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISTANBUL_TZ = "Europe/Istanbul";

const toDateUtc = (dateOnly: string): Date => new Date(`${dateOnly}T00:00:00.000Z`);

const formatDateOnlyUtc = (value: Date): string => value.toISOString().slice(0, 10);

const getDatePartsInTimezone = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Date formatting failed");
  }

  return `${year}-${month}-${day}`;
};

export const getTodayInIstanbul = (): string =>
  getDatePartsInTimezone(new Date(), ISTANBUL_TZ);

const parseMoney = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric;
};

const isDateOnly = (value: string): boolean => DATE_ONLY_PATTERN.test(value);

export const validateBookingWindow = (
  checkInDate: string,
  checkOutDate: string,
): BookingWindowValidation => {
  if (!isDateOnly(checkInDate) || !isDateOnly(checkOutDate)) {
    return {
      ok: false,
      message: "Tarihler YYYY-MM-DD formatında olmalıdır",
    };
  }

  if (checkInDate >= checkOutDate) {
    return {
      ok: false,
      message: "Check-in tarihi check-out tarihinden önce olmalıdır",
    };
  }

  return { ok: true };
};

export const listNights = (checkInDate: string, checkOutDate: string): string[] => {
  const nights: string[] = [];
  let cursor = toDateUtc(checkInDate);
  const end = toDateUtc(checkOutDate);

  while (cursor < end) {
    nights.push(formatDateOnlyUtc(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return nights;
};

export const maybeAutoCompleteBookings = async (): Promise<number> => {
  const today = getTodayInIstanbul();
  const completed = await db
    .update(booking)
    .set({
      status: "completed",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(booking.status, "confirmed"),
        lte(booking.checkOutDate, today),
      ),
    )
    .returning({ id: booking.id });

  return completed.length;
};

const loadStayPlace = async (placeId: string): Promise<StayPlace | null> => {
  const [row] = await db
    .select({
      id: place.id,
      kind: place.kind,
      status: place.status,
      nightlyPrice: place.nightlyPrice,
    })
    .from(place)
    .where(eq(place.id, placeId))
    .limit(1);

  if (!row) return null;
  return {
    ...row,
    currency: "TRY",
  };
};

const loadRoomContext = async (
  placeId: string,
  roomId: string,
): Promise<RoomContext | null> => {
  const [row] = await db
    .select({
      id: hotelRoom.id,
      placeId: hotelRoom.placeId,
      status: hotelRoom.status,
      baseNightlyPrice: hotelRoom.baseNightlyPrice,
    })
    .from(hotelRoom)
    .where(and(eq(hotelRoom.id, roomId), eq(hotelRoom.placeId, placeId)))
    .limit(1);

  return row ?? null;
};

export const resolveBookingContext = async ({
  placeId,
  roomId,
}: {
  placeId: string;
  roomId?: string | null;
}): Promise<
  | {
      ok: true;
      place: StayPlace;
      room: RoomContext | null;
    }
  | { ok: false; status: 400 | 404; message: string }
> => {
  const placeCtx = await loadStayPlace(placeId);
  if (!placeCtx) {
    return { ok: false, status: 404, message: "Mekan bulunamadı" };
  }

  if (!["hotel", "villa"].includes(placeCtx.kind)) {
    return { ok: false, status: 400, message: "Sadece otel ve villa rezervasyon alabilir" };
  }

  if (placeCtx.status !== "active") {
    return { ok: false, status: 400, message: "Mekan rezervasyona uygun değil" };
  }

  if (placeCtx.kind === "hotel") {
    if (!roomId) {
      return { ok: false, status: 400, message: "Otel rezervasyonu için oda seçimi zorunludur" };
    }

    const roomCtx = await loadRoomContext(placeId, roomId);
    if (!roomCtx || roomCtx.status !== "active") {
      return { ok: false, status: 400, message: "Seçilen oda rezervasyona uygun değil" };
    }

    return { ok: true, place: placeCtx, room: roomCtx };
  }

  return { ok: true, place: placeCtx, room: null };
};

type PriceCandidate = {
  sourceType: NightlyLine["sourceType"];
  sourceId: string;
  nightlyPrice: number;
};

export const resolveNightlyPrice = async ({
  placeCtx,
  roomCtx,
  nights,
}: {
  placeCtx: StayPlace;
  roomCtx: RoomContext | null;
  nights: string[];
}): Promise<
  | { ok: true; nightlyLines: NightlyLine[] }
  | { ok: false; message: string }
> => {
  const rangeStart = nights[0];
  const rangeEnd = nights[nights.length - 1];
  const candidatesByNight = new Map<string, PriceCandidate[]>();

  for (const night of nights) {
    candidatesByNight.set(night, []);
  }

  const placeBase = parseMoney(placeCtx.nightlyPrice);
  if (placeBase !== null) {
    for (const night of nights) {
      candidatesByNight.get(night)?.push({
        sourceType: "place_base",
        sourceId: placeCtx.id,
        nightlyPrice: placeBase,
      });
    }
  }

  if (roomCtx) {
    const roomBase = parseMoney(roomCtx.baseNightlyPrice);
    if (roomBase !== null) {
      for (const night of nights) {
        candidatesByNight.get(night)?.push({
          sourceType: "room_base",
          sourceId: roomCtx.id,
          nightlyPrice: roomBase,
        });
      }
    }
  }

  const placeRules = await db
    .select({
      id: placePriceRule.id,
      startsOn: placePriceRule.startsOn,
      endsOn: placePriceRule.endsOn,
      nightlyPrice: placePriceRule.nightlyPrice,
    })
    .from(placePriceRule)
    .where(
      and(
        eq(placePriceRule.placeId, placeCtx.id),
        lte(placePriceRule.startsOn, rangeEnd),
        gte(placePriceRule.endsOn, rangeStart),
      ),
    );

  for (const rule of placeRules) {
    const price = parseMoney(rule.nightlyPrice);
    if (price === null) continue;
    for (const night of nights) {
      if (night >= rule.startsOn && night <= rule.endsOn) {
        candidatesByNight.get(night)?.push({
          sourceType: "place_price_rule",
          sourceId: rule.id,
          nightlyPrice: price,
        });
      }
    }
  }

  if (roomCtx) {
    const roomRules = await db
      .select({
        id: hotelRoomRate.id,
        startsOn: hotelRoomRate.startsOn,
        endsOn: hotelRoomRate.endsOn,
        nightlyPrice: hotelRoomRate.nightlyPrice,
      })
      .from(hotelRoomRate)
      .where(
        and(
          eq(hotelRoomRate.roomId, roomCtx.id),
          lte(hotelRoomRate.startsOn, rangeEnd),
          gte(hotelRoomRate.endsOn, rangeStart),
        ),
      );

    for (const rule of roomRules) {
      const price = parseMoney(rule.nightlyPrice);
      if (price === null) continue;
      for (const night of nights) {
        if (night >= rule.startsOn && night <= rule.endsOn) {
          candidatesByNight.get(night)?.push({
            sourceType: "room_price_rule",
            sourceId: rule.id,
            nightlyPrice: price,
          });
        }
      }
    }
  }

  const nightlyLines: NightlyLine[] = [];
  for (const night of nights) {
    const options = candidatesByNight.get(night) ?? [];
    if (options.length === 0) {
      return {
        ok: false,
        message: `${night} tarihi için geçerli fiyat bulunamadı`,
      };
    }

    const winner = options.reduce((max, current) =>
      current.nightlyPrice > max.nightlyPrice ? current : max,
    );
    nightlyLines.push({
      date: night,
      nightlyPrice: winner.nightlyPrice,
      sourceType: winner.sourceType,
      sourceId: winner.sourceId,
    });
  }

  return { ok: true, nightlyLines };
};

const hasDateRangeOverlap = (
  startsOn: string,
  endsOn: string,
  checkInDate: string,
  checkOutDate: string,
) => startsOn < checkOutDate && endsOn >= checkInDate;

export const checkAvailability = async ({
  placeCtx,
  roomCtx,
  checkInDate,
  checkOutDate,
}: {
  placeCtx: StayPlace;
  roomCtx: RoomContext | null;
  checkInDate: string;
  checkOutDate: string;
}): Promise<{
  available: boolean;
  reason?: string;
}> => {
  if (placeCtx.kind === "hotel") {
    if (!roomCtx) {
      return { available: false, reason: "Oda bilgisi eksik" };
    }

    const [roomBlocks, roomBookings] = await Promise.all([
      db
        .select({
          startsOn: hotelRoomAvailabilityBlock.startsOn,
          endsOn: hotelRoomAvailabilityBlock.endsOn,
        })
        .from(hotelRoomAvailabilityBlock)
        .where(eq(hotelRoomAvailabilityBlock.roomId, roomCtx.id)),
      db
        .select({
          id: booking.id,
        })
        .from(booking)
        .where(
          and(
            eq(booking.placeId, placeCtx.id),
            eq(booking.roomId, roomCtx.id),
            eq(booking.status, "confirmed"),
            lt(booking.checkInDate, checkOutDate),
            gt(booking.checkOutDate, checkInDate),
          ),
        )
        .limit(1),
    ]);

    const blocked = roomBlocks.some((block) =>
      hasDateRangeOverlap(block.startsOn, block.endsOn, checkInDate, checkOutDate),
    );
    if (blocked) {
      return { available: false, reason: "Seçilen oda bu tarih aralığında müsait değil" };
    }

    if (roomBookings.length > 0) {
      return { available: false, reason: "Seçilen oda bu tarih aralığında rezerve edilmiş" };
    }
    return { available: true };
  }

  const [placeBlocks, placeBookings] = await Promise.all([
    db
      .select({
        startsOn: placeAvailabilityBlock.startsOn,
        endsOn: placeAvailabilityBlock.endsOn,
      })
      .from(placeAvailabilityBlock)
      .where(eq(placeAvailabilityBlock.placeId, placeCtx.id)),
    db
      .select({
        id: booking.id,
      })
      .from(booking)
      .where(
        and(
          eq(booking.placeId, placeCtx.id),
          isNull(booking.roomId),
          eq(booking.status, "confirmed"),
          lt(booking.checkInDate, checkOutDate),
          gt(booking.checkOutDate, checkInDate),
        ),
      )
      .limit(1),
  ]);

  const blocked = placeBlocks.some((block) =>
    hasDateRangeOverlap(block.startsOn, block.endsOn, checkInDate, checkOutDate),
  );
  if (blocked) {
    return { available: false, reason: "Seçilen tarih aralığı mekan tarafından kapatılmış" };
  }

  if (placeBookings.length > 0) {
    return { available: false, reason: "Seçilen tarih aralığı rezerve edilmiş" };
  }

  return { available: true };
};

export const buildQuote = async (input: QuoteInput): Promise<
  | { ok: true; quote: QuoteResult }
  | { ok: false; status: 400 | 404 | 409; message: string }
> => {
  const windowValidation = validateBookingWindow(
    input.checkInDate,
    input.checkOutDate,
  );
  if (!windowValidation.ok) {
    return { ok: false, status: 400, message: windowValidation.message };
  }

  const nights = listNights(input.checkInDate, input.checkOutDate);
  if (nights.length === 0) {
    return { ok: false, status: 400, message: "En az bir gece seçilmelidir" };
  }

  const ctx = await resolveBookingContext({
    placeId: input.placeId,
    roomId: input.roomId,
  });
  if (!ctx.ok) return ctx;

  const availability = await checkAvailability({
    placeCtx: ctx.place,
    roomCtx: ctx.room,
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
  });
  if (!availability.available) {
    return {
      ok: false,
      status: 409,
      message: availability.reason ?? "Seçilen tarih aralığı müsait değil",
    };
  }

  const pricing = await resolveNightlyPrice({
    placeCtx: ctx.place,
    roomCtx: ctx.room,
    nights,
  });
  if (!pricing.ok) {
    return { ok: false, status: 400, message: pricing.message };
  }

  const subtotal = Number(
    pricing.nightlyLines
      .reduce((sum, line) => sum + line.nightlyPrice, 0)
      .toFixed(2),
  );

  return {
    ok: true,
    quote: {
      currency: ctx.place.currency,
      nights: nights.length,
      nightlyLines: pricing.nightlyLines,
      subtotal,
      total: subtotal,
      place: ctx.place,
      room: ctx.room,
    },
  };
};

export const buildPricingSnapshot = (quote: QuoteResult) => ({
  currency: quote.currency,
  nights: quote.nights,
  subtotal: quote.subtotal,
  total: quote.total,
  nightlyLines: quote.nightlyLines,
  generatedAt: new Date().toISOString(),
});

export const listAvailableRoomsForHotel = async ({
  placeId,
  checkInDate,
  checkOutDate,
  guests,
}: {
  placeId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
}) => {
  const rooms = await db
    .select({
      id: hotelRoom.id,
      name: hotelRoom.name,
      slug: hotelRoom.slug,
      maxAdults: hotelRoom.maxAdults,
      maxChildren: hotelRoom.maxChildren,
      baseNightlyPrice: hotelRoom.baseNightlyPrice,
      status: hotelRoom.status,
    })
    .from(hotelRoom)
    .where(and(eq(hotelRoom.placeId, placeId), eq(hotelRoom.status, "active")));

  if (rooms.length === 0) return [];

  const roomIds = rooms.map((room) => room.id);
  const [roomBlocks, roomBookings] = await Promise.all([
    db
      .select({
        roomId: hotelRoomAvailabilityBlock.roomId,
        startsOn: hotelRoomAvailabilityBlock.startsOn,
        endsOn: hotelRoomAvailabilityBlock.endsOn,
      })
      .from(hotelRoomAvailabilityBlock)
      .where(inArray(hotelRoomAvailabilityBlock.roomId, roomIds)),
    db
      .select({
        roomId: booking.roomId,
      })
      .from(booking)
      .where(
        and(
          eq(booking.placeId, placeId),
          inArray(booking.roomId, roomIds),
          eq(booking.status, "confirmed"),
          lt(booking.checkInDate, checkOutDate),
          gt(booking.checkOutDate, checkInDate),
        ),
      ),
  ]);

  const blockedRoomIds = new Set<string>();
  for (const block of roomBlocks) {
    if (
      block.roomId &&
      hasDateRangeOverlap(block.startsOn, block.endsOn, checkInDate, checkOutDate)
    ) {
      blockedRoomIds.add(block.roomId);
    }
  }

  for (const row of roomBookings) {
    if (row.roomId) {
      blockedRoomIds.add(row.roomId);
    }
  }

  return rooms
    .filter((room) => room.maxAdults + room.maxChildren >= guests)
    .map((room) => ({
      ...room,
      available: !blockedRoomIds.has(room.id),
      maxGuests: room.maxAdults + room.maxChildren,
    }));
};
