
import { Hono } from "hono";
import { asc, eq, ilike } from "drizzle-orm";
import { db } from "../db/index.ts";
import { district, province } from "../db/schemas/index.ts";

export const locationsRoutes = new Hono();

// Get all cities
locationsRoutes.get("/cities", async (c) => {
  const cities = await db
    .select({
      id: province.id,
      name: province.name,
      slug: province.slug,
    })
    .from(province)
    .orderBy(asc(province.name));

  return c.json({ cities });
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
    })
    .from(district)
    .where(eq(district.provinceId, targetProvince.id))
    .orderBy(asc(district.name));

  return c.json({
    city: targetProvince,
    districts: districtRows.map((item) => item.name),
    districtItems: districtRows,
  });
});
