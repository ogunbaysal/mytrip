import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

type RawCoordinateValue = number | string | null

type RawCity = {
  id: string
  name: string
  latitude: RawCoordinateValue
  longitude: RawCoordinateValue
}

type RawDistrictItem = {
  id: string
  name: string
  slug: string
  latitude: RawCoordinateValue
  longitude: RawCoordinateValue
}

type DistrictDataResponse = {
  city: City | null
  districts: string[]
  districtItems: DistrictItem[]
}

export type DistrictCenter = {
  lat: number
  lng: number
}

export type City = {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
}

export type DistrictItem = {
  id: string
  name: string
  slug: string
  latitude: number | null
  longitude: number | null
}

function toNullableNumber(value: RawCoordinateValue): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "string" && value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeCity(city: RawCity): City {
  return {
    id: city.id,
    name: city.name,
    latitude: toNullableNumber(city.latitude),
    longitude: toNullableNumber(city.longitude),
  }
}

function normalizeDistrictItem(item: RawDistrictItem): DistrictItem {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    latitude: toNullableNumber(item.latitude),
    longitude: toNullableNumber(item.longitude),
  }
}

async function fetchDistrictData(city: string): Promise<DistrictDataResponse> {
  if (!city) {
    return { city: null, districts: [], districtItems: [] }
  }

  const data = await apiFetch<{
    city?: RawCity | null
    districts?: string[]
    districtItems?: RawDistrictItem[]
  }>(`/api/locations/districts/${encodeURIComponent(city)}`)

  return {
    city: data.city ? normalizeCity(data.city) : null,
    districts: data.districts ?? [],
    districtItems: (data.districtItems ?? []).map(normalizeDistrictItem),
  }
}

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const data = await apiFetch<{ cities: RawCity[] }>("/api/locations/cities")
      return data.cities.map(normalizeCity)
    },
  })
}

export function useDistricts(city: string) {
  return useQuery({
    queryKey: ["districts", city],
    queryFn: () => fetchDistrictData(city),
    select: (data) => data.districts,
    enabled: !!city,
  })
}

export function useDistrictData(city: string) {
  return useQuery({
    queryKey: ["districts", city],
    queryFn: () => fetchDistrictData(city),
    select: (data) => ({
      city: data.city,
      districtItems: data.districtItems,
    }),
    enabled: !!city,
  })
}

export function getDistrictCenterQueryKey(city: string, district: string) {
  return ["district-center", city, district] as const
}

export async function fetchDistrictCenter(
  city: string,
  district: string,
): Promise<DistrictCenter | null> {
  const normalizedCity = city.trim()
  const normalizedDistrict = district.trim()
  if (!normalizedCity || !normalizedDistrict) return null

  const params = new URLSearchParams({
    city: normalizedCity,
    district: normalizedDistrict,
  })

  const data = await apiFetch<{
    center?: { lat: number; lng: number } | null
  }>(`/api/locations/district-center?${params.toString()}`)

  if (!data.center) return null

  const lat = Number(data.center.lat)
  const lng = Number(data.center.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return { lat, lng }
}
