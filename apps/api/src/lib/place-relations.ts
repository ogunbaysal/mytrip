import { nanoid } from "nanoid";
import { and, asc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  amenity,
  district,
  file,
  placeAmenity,
  placeImage,
  province,
} from "../db/schemas/index.ts";

const PLACE_TYPE_TO_CATEGORY_SLUGS: Record<string, readonly string[]> = {
  hotel: ["hotels", "villas", "guesthouses", "apart-hotels"],
  restaurant: ["restaurants"],
  cafe: ["cafes", "bars", "beach-clubs"],
  activity: ["activities", "attractions", "nature-beaches", "spa-wellness"],
  attraction: ["attractions", "nature-beaches"],
  transport: [],
};

const CATEGORY_SLUG_TO_PLACE_TYPE: Record<string, string> = Object.entries(
  PLACE_TYPE_TO_CATEGORY_SLUGS,
).reduce<Record<string, string>>((acc, [type, slugs]) => {
  for (const slug of slugs) acc[slug] = type;
  return acc;
}, {});

const normalizeAmenitySlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeAmenityLabel = (value: string, fallbackSlug: string): string => {
  const cleaned = value.trim();
  if (cleaned.length > 0) return cleaned;
  return fallbackSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export async function upsertAmenities(values: string[]): Promise<
  { id: string; slug: string; label: string }[]
> {
  const normalized = values
    .map((raw) => {
      const slug = normalizeAmenitySlug(raw);
      if (!slug) return null;
      return { slug, label: normalizeAmenityLabel(raw, slug) };
    })
    .filter((item): item is { slug: string; label: string } => Boolean(item));

  const deduped = Array.from(
    new Map(normalized.map((item) => [item.slug, item])).values(),
  );

  if (deduped.length === 0) return [];

  const slugs = deduped.map((item) => item.slug);
  const existing = await db
    .select({
      id: amenity.id,
      slug: amenity.slug,
      label: amenity.label,
    })
    .from(amenity)
    .where(inArray(amenity.slug, slugs));

  const existingBySlug = new Map(existing.map((row) => [row.slug, row]));
  const missing = deduped.filter((item) => !existingBySlug.has(item.slug));

  if (missing.length > 0) {
    const insertRows = missing.map((item) => ({
      id: nanoid(),
      slug: item.slug,
      label: item.label,
    }));
    await db.insert(amenity).values(insertRows);

    for (const row of insertRows) {
      existingBySlug.set(row.slug, row);
    }
  }

  return deduped
    .map((item) => existingBySlug.get(item.slug))
    .filter((item): item is { id: string; slug: string; label: string } =>
      Boolean(item),
    );
}

export async function replacePlaceAmenities(
  placeId: string,
  values: string[],
): Promise<string[]> {
  await db.delete(placeAmenity).where(eq(placeAmenity.placeId, placeId));

  const amenities = await upsertAmenities(values);
  if (amenities.length === 0) return [];

  await db.insert(placeAmenity).values(
    amenities.map((item, index) => ({
      placeId,
      amenityId: item.id,
      sortOrder: index,
    })),
  );

  return amenities.map((item) => item.slug);
}

export async function getPlaceAmenitiesMap(
  placeIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (placeIds.length === 0) return map;

  const rows = await db
    .select({
      placeId: placeAmenity.placeId,
      slug: amenity.slug,
    })
    .from(placeAmenity)
    .innerJoin(amenity, eq(placeAmenity.amenityId, amenity.id))
    .where(inArray(placeAmenity.placeId, placeIds))
    .orderBy(asc(placeAmenity.placeId), asc(placeAmenity.sortOrder));

  for (const row of rows) {
    const current = map.get(row.placeId) ?? [];
    current.push(row.slug);
    map.set(row.placeId, current);
  }

  return map;
}

export async function getPlaceImagesMap(
  placeIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (placeIds.length === 0) return map;

  const rows = await db
    .select({
      placeId: placeImage.placeId,
      url: file.url,
    })
    .from(placeImage)
    .innerJoin(file, eq(placeImage.fileId, file.id))
    .where(inArray(placeImage.placeId, placeIds))
    .orderBy(asc(placeImage.placeId), asc(placeImage.sortOrder));

  for (const row of rows) {
    const current = map.get(row.placeId) ?? [];
    current.push(row.url);
    map.set(row.placeId, current);
  }

  return map;
}

export async function resolveProvinceDistrictIds(input: {
  cityId?: string | null;
  districtId?: string | null;
  city?: string | null;
  district?: string | null;
}): Promise<{
  cityId: string | null;
  districtId: string | null;
  cityName: string | null;
  districtName: string | null;
}> {
  let cityId = input.cityId ?? null;
  let districtId = input.districtId ?? null;
  let cityName: string | null = null;
  let districtName: string | null = null;

  const cityText = input.city?.trim();
  const districtText = input.district?.trim();

  if (!cityId && cityText) {
    const [cityRow] = await db
      .select({ id: province.id, name: province.name })
      .from(province)
      .where(ilike(province.name, cityText))
      .limit(1);
    if (cityRow) {
      cityId = cityRow.id;
      cityName = cityRow.name;
    }
  }

  if (!districtId && districtText) {
    const rows = await db
      .select({
        id: district.id,
        name: district.name,
        provinceId: district.provinceId,
      })
      .from(district)
      .where(
        cityId
          ? and(eq(district.provinceId, cityId), ilike(district.name, districtText))
          : ilike(district.name, districtText),
      )
      .limit(1);

    const districtRow = rows[0];
    if (districtRow) {
      districtId = districtRow.id;
      districtName = districtRow.name;
      if (!cityId) {
        cityId = districtRow.provinceId;
      }
    }
  }

  if (cityId && !cityName) {
    const [cityRow] = await db
      .select({ name: province.name })
      .from(province)
      .where(eq(province.id, cityId))
      .limit(1);
    cityName = cityRow?.name ?? null;
  }

  if (districtId && !districtName) {
    const [districtRow] = await db
      .select({ name: district.name })
      .from(district)
      .where(eq(district.id, districtId))
      .limit(1);
    districtName = districtRow?.name ?? null;
  }

  return { cityId, districtId, cityName, districtName };
}

export async function hydratePlaceMediaAndAmenities<T extends { id: string }>(
  places: T[],
): Promise<Array<T & { images: string[]; features: string[] }>> {
  const ids = places.map((place) => place.id);
  const [imagesMap, amenitiesMap] = await Promise.all([
    getPlaceImagesMap(ids),
    getPlaceAmenitiesMap(ids),
  ]);

  return places.map((place) => ({
    ...place,
    images: imagesMap.get(place.id) ?? [],
    features: amenitiesMap.get(place.id) ?? [],
  }));
}

export function derivePlaceTypeFromCategorySlug(
  categorySlug?: string | null,
): string {
  if (!categorySlug) return "activity";
  return CATEGORY_SLUG_TO_PLACE_TYPE[categorySlug] ?? "activity";
}

export function resolveCategorySlugsForType(type?: string | null): string[] {
  if (!type) return [];
  const normalized = type.trim().toLowerCase();
  return [...(PLACE_TYPE_TO_CATEGORY_SLUGS[normalized] ?? [])];
}
