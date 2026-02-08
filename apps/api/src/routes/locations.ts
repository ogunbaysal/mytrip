
import { Hono } from "hono";
import { and, asc, eq, ilike } from "drizzle-orm";
import { db } from "../db/index.ts";
import { district, province } from "../db/schemas/index.ts";

export const locationsRoutes = new Hono();

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function geocodeDistrictCenter(params: {
  district: string;
  city: string;
}): Promise<{ lat: number; lng: number } | null> {
  try {
    const searchParams = new URLSearchParams({
      format: "jsonv2",
      limit: "1",
      countrycodes: "tr",
      "accept-language": "tr",
      q: `${params.district}, ${params.city}, Türkiye`,
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`,
      {
        headers: {
          "User-Agent": "mytrip-api/1.0 (district-center-geocoding)",
        },
      },
    );

    if (!response.ok) return null;

    const result = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;
    const first = result[0];
    if (!first) return null;

    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  }
}

// Get all cities
locationsRoutes.get("/cities", async (c) => {
  const cities = await db
    .select({
      id: province.id,
      name: province.name,
      slug: province.slug,
      latitude: province.latitude,
      longitude: province.longitude,
    })
    .from(province)
    .orderBy(asc(province.name));

  return c.json({
    cities: cities.map((city) => ({
      ...city,
      latitude: toNullableNumber(city.latitude),
      longitude: toNullableNumber(city.longitude),
    })),
  });
});

// Get districts by city name (since frontend might send name or id)
// Supports both province ID and province name for backward compatibility.
locationsRoutes.get("/districts/:city", async (c) => {
  const cityParam = c.req.param("city");
  const cityText = cityParam.trim();

  const [matchedProvince] = await db
    .select({
      id: province.id,
      name: province.name,
      latitude: province.latitude,
      longitude: province.longitude,
    })
    .from(province)
    .where(eq(province.id, cityText))
    .limit(1);

  const [matchedByName] =
    matchedProvince
      ? [matchedProvince]
      : await db
          .select({
            id: province.id,
            name: province.name,
            latitude: province.latitude,
            longitude: province.longitude,
          })
          .from(province)
          .where(ilike(province.name, cityText))
          .limit(1);

  const targetProvince = matchedByName;
  if (!targetProvince) {
    return c.json({ districts: [] });
  }

  const districtRows = await db
    .select({
      id: district.id,
      name: district.name,
      slug: district.slug,
      latitude: district.latitude,
      longitude: district.longitude,
    })
    .from(district)
    .where(eq(district.provinceId, targetProvince.id))
    .orderBy(asc(district.name));

  return c.json({
    city: {
      id: targetProvince.id,
      name: targetProvince.name,
      latitude: toNullableNumber(targetProvince.latitude),
      longitude: toNullableNumber(targetProvince.longitude),
    },
    districts: districtRows.map((item) => item.name),
    districtItems: districtRows.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      latitude: toNullableNumber(item.latitude),
      longitude: toNullableNumber(item.longitude),
    })),
  });
});

locationsRoutes.get("/district-center", async (c) => {
  const cityParam = c.req.query("city")?.trim() ?? "";
  const districtParam = c.req.query("district")?.trim() ?? "";

  if (!cityParam || !districtParam) {
    return c.json({ center: null });
  }

  const [matchedProvince] = await db
    .select({
      id: province.id,
      name: province.name,
    })
    .from(province)
    .where(eq(province.id, cityParam))
    .limit(1);

  const [matchedByName] =
    matchedProvince
      ? [matchedProvince]
      : await db
          .select({
            id: province.id,
            name: province.name,
          })
          .from(province)
          .where(ilike(province.name, cityParam))
          .limit(1);

  const resolvedProvince = matchedByName;
  if (!resolvedProvince) {
    return c.json({ center: null });
  }

  const [districtRow] = await db
    .select({
      latitude: district.latitude,
      longitude: district.longitude,
    })
    .from(district)
    .where(
      and(
        eq(district.provinceId, resolvedProvince.id),
        ilike(district.name, districtParam),
      ),
    )
    .limit(1);

  const dbLat = toNullableNumber(districtRow?.latitude);
  const dbLng = toNullableNumber(districtRow?.longitude);
  if (dbLat !== null && dbLng !== null) {
    return c.json({
      center: { lat: dbLat, lng: dbLng },
      source: "db",
    });
  }

  const geocoded = await geocodeDistrictCenter({
    city: resolvedProvince.name,
    district: districtParam,
  });

  if (!geocoded) {
    return c.json({ center: null, source: "none" });
  }

  return c.json({
    center: geocoded,
    source: "nominatim",
  });
});
