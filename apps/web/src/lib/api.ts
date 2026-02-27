import type {
  CollectionSummary,
  PlaceSummary,
  PlaceTypeSummary,
  PlaceDetail,
  PlaceAmenity,
  PlaceReview,
  BlogComment,
  BlogPost,
  BlogPostDetail,
  CollectionDetail,
} from "@/types";
import {
  getPlaceFeatureIcon,
  getPlaceFeatureLabel,
  getUniquePlaceFeatureLabels,
} from "@/lib/place-feature";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.tatildesen.com";
const DEFAULT_LOCALE = "tr";

type RequestOptions = RequestInit & { cache?: RequestCache };
type OwnerUploadUsage =
  | "place_image"
  | "business_document"
  | "blog_hero"
  | "blog_featured"
  | "blog_content"
  | "other";

type ZodIssueLike = {
  path?: Array<string | number>;
  message?: string;
};

type APIErrorLike = {
  name?: string;
  message?: string;
  issues?: ZodIssueLike[] | string;
};

type APIErrorResponse = {
  success?: boolean;
  message?: string;
  error?: string | APIErrorLike;
};

const FIELD_LABELS: Record<string, string> = {
  checkInInfo: "Check-in bilgisi",
  checkOutInfo: "Check-out bilgisi",
};

const STATUS_MESSAGES: Record<number, string> = {
  400: "Gönderilen bilgiler doğrulanamadı. Lütfen alanları kontrol edin.",
  401: "Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.",
  403: "Bu işlem için yetkiniz bulunmuyor.",
  404: "İstenen kayıt bulunamadı.",
  409: "Bu işlem mevcut verilerle çakışıyor.",
  429: "Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin.",
  500: "Sunucu hatası oluştu. Lütfen tekrar deneyin.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseZodIssues(value: unknown): ZodIssueLike[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord).map((issue) => ({
      path: Array.isArray(issue.path)
        ? issue.path.filter(
            (part): part is string | number =>
              typeof part === "string" || typeof part === "number",
          )
        : undefined,
      message: typeof issue.message === "string" ? issue.message : undefined,
    }));
  }

  if (typeof value === "string") {
    try {
      return parseZodIssues(JSON.parse(value));
    } catch {
      return [];
    }
  }

  return [];
}

function formatZodIssues(issues: ZodIssueLike[]): string | null {
  if (issues.length === 0) return null;

  const fields = issues
    .map((issue) => issue.path?.[0])
    .filter((field): field is string => typeof field === "string");

  const uniqueFields = [...new Set(fields)];
  if (uniqueFields.length === 0) {
    return "Gönderilen bilgiler doğrulanamadı. Lütfen alanları kontrol edin.";
  }

  const readableFields = uniqueFields.map(
    (field) => FIELD_LABELS[field] || field,
  );
  return `Geçersiz alanlar: ${readableFields.join(", ")}.`;
}

function getAPIErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (isRecord(payload)) {
    const data = payload as APIErrorResponse;

    if (typeof data.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }

    if (typeof data.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }

    if (isRecord(data.error)) {
      const apiError = data.error as APIErrorLike;
      const issuesFromList = parseZodIssues(apiError.issues);
      const issuesFromMessage =
        issuesFromList.length === 0 ? parseZodIssues(apiError.message) : [];
      const formattedIssues = formatZodIssues([
        ...issuesFromList,
        ...issuesFromMessage,
      ]);

      if (formattedIssues) return formattedIssues;

      if (
        apiError.name === "ZodError" &&
        (!apiError.message || apiError.message.startsWith("["))
      ) {
        return STATUS_MESSAGES[400];
      }

      if (
        typeof apiError.message === "string" &&
        apiError.message.trim().length > 0 &&
        !apiError.message.startsWith("[")
      ) {
        return apiError.message;
      }
    }
  }

  return STATUS_MESSAGES[status] || "İstek sırasında bir hata oluştu.";
}

async function request<T>(
  endpoint: string,
  options?: RequestOptions,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null as any;

    const rawBody = await response.text();
    let payload: unknown = null;

    if (rawBody.trim().length > 0) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = rawBody;
      }
    }

    throw new Error(getAPIErrorMessage(payload, response.status));
  }

  return response.json() as Promise<T>;
}

type APIPlace = {
  id: string;
  slug: string;
  name: string;
  kind?: string | null;
  kindSlug?: string | null;
  kindName?: string | null;
  type: string;
  category: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  description: string | null;
  shortDescription: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  location: string | object | null;
  rating: string | null;
  reviewCount: number;
  priceLevel: string | null;
  nightlyPrice: string | null;
  images: string | object | null;
  features: string | object | null;
  openingHours: string | object | null;
  contactInfo: string | object | null;
  checkInInfo: string | object | null;
  checkOutInfo: string | object | null;
  verified: boolean;
  featured: boolean;
  views: number;
  bookingCount: number;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerAvatar?: string | null;
  ownerCreatedAt?: string | Date | null;
};

type RecordLike = Record<string, unknown>;

type OwnerPlaceKind = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  monetized?: boolean;
  supportsRooms?: boolean;
  supportsMenu?: boolean;
  supportsPackages?: boolean;
};

type OwnerPlaceBusinessDocument = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedById: string;
  usage: string;
  createdAt: string | Date;
};

type OwnerPlace = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  kindSlug: string | null;
  kindName: string | null;
  type: string;
  category: string;
  categoryId: string;
  categorySlug: string | null;
  categoryName: string | null;
  description: string | null;
  shortDescription: string | null;
  address: string | null;
  cityId: string | null;
  districtId: string | null;
  city: string;
  district: string;
  location: string | object | null;
  contactInfo: string | object | null;
  rating: string | null;
  reviewCount: number;
  priceLevel: string | null;
  nightlyPrice: string | null;
  status: string;
  verified: boolean;
  featured: boolean;
  ownerId: string;
  views: number;
  bookingCount: number;
  openingHours: string | object | null;
  checkInInfo: string | object | null;
  checkOutInfo: string | object | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  images: string[];
  features: string[];
  businessDocumentFileId?: string | null;
  businessDocument?: OwnerPlaceBusinessDocument | null;
};

type OwnerPlaceListResponse = {
  places: OwnerPlace[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type BookingNightlyLine = {
  date: string;
  nightlyPrice: number;
  sourceType: "place_base" | "room_base" | "place_price_rule" | "room_price_rule";
  sourceId: string;
};

type BookingQuote = {
  currency: "TRY" | "USD" | "EUR";
  nights: number;
  nightlyLines: BookingNightlyLine[];
  subtotal: number;
  total: number;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  place: {
    id: string;
    kind: string;
    nightlyPrice: string | null;
  };
  room: {
    id: string;
    name?: string;
    status: string;
    baseNightlyPrice: string | null;
  } | null;
};

type BookingReservation = {
  id: string;
  bookingReference: string;
  placeId: string;
  roomId: string | null;
  userId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: string;
  currency: "TRY" | "USD" | "EUR";
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";
  specialRequests?: string | null;
  pricingSnapshot?: {
    currency: string;
    nights: number;
    subtotal: number;
    total: number;
    nightlyLines: BookingNightlyLine[];
  } | null;
  placeName?: string;
  placeSlug?: string;
  roomName?: string | null;
  travelerName?: string;
  travelerEmail?: string;
  travelerPhone?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type OwnerPlacePriceRule = {
  id: string;
  placeId: string;
  startsOn: string;
  endsOn: string;
  nightlyPrice: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type OwnerAvailabilityBlock = {
  id: string;
  startsOn: string;
  endsOn: string;
  reason?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function safelyParseJSON<T>(
  input: string | object | null | undefined,
  fallback: T,
): T {
  if (!input) return fallback;
  if (typeof input === "object") return input as T;
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

function mapFeaturesToAmenities(features: string[]): PlaceAmenity[] {
  return features.map((f) => ({
    icon: getPlaceFeatureIcon(f),
    label: getPlaceFeatureLabel(f),
  }));
}

function parseCoordinates(location: string | object | null | undefined): {
  lat: number;
  lng: number;
} {
  const defaultCoords = { lat: 37.1, lng: 28.3 }; // Default to Muğla area

  if (!location) return defaultCoords;

  let parsed: { lat?: unknown; lng?: unknown };
  if (typeof location === "string") {
    try {
      parsed = JSON.parse(location);
    } catch {
      return defaultCoords;
    }
  } else {
    parsed = location as { lat?: unknown; lng?: unknown };
  }

  const lat = Number(parsed.lat);
  const lng = Number(parsed.lng);

  // Validate coordinates are valid numbers and within reasonable bounds
  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return defaultCoords;
  }

  return { lat, lng };
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatHostJoinedDate(value: APIPlace["ownerCreatedAt"]): string | undefined {
  if (!value) return undefined;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function mapBackendPlaceToSummary(place: APIPlace): PlaceSummary {
  const images = safelyParseJSON<string[]>(place.images, []);
  const location = parseCoordinates(place.location);
  const features = safelyParseJSON<string[]>(place.features, []);
  const normalizedKindSource =
    place.kind || place.kindSlug || place.categorySlug || place.category || place.type || "";
  const normalizedKind = normalizedKindSource.toLowerCase().replace(/-/g, "_");

  const stayKinds = new Set([
    "villa",
    "bungalow_tiny_house",
    "hotel_pension",
    "detached_house_apartment",
    "camp_site",
  ]);

  const type: PlaceSummary["type"] = stayKinds.has(normalizedKind)
    ? "stay"
    : "activity";

  const category: PlaceSummary["category"] = stayKinds.has(normalizedKind)
    ? "family"
    : "wellness";

  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    shortDescription: place.shortDescription || "",
    nightlyPrice: place.nightlyPrice ? Number(place.nightlyPrice) : 0,
    rating: place.rating ? Number(place.rating) : 0,
    reviewCount: place.reviewCount,
    imageUrl: images[0] || "/images/placeholders/place-placeholder.png",
    city: place.city || "",
    district: place.district || "",
    type,
    kind: normalizedKind,
    kindSlug: place.kindSlug || normalizedKind.replace(/_/g, "-"),
    kindName: place.kindName || place.categoryName || place.category || null,
    category,
    coordinates: location,
    features,
  };
}

function mapBackendPlaceToDetail(
  place: APIPlace,
  nearbyPlaces: APIPlace[] = [],
  recentReviews: PlaceReview[] = [],
): PlaceDetail {
  const summary = mapBackendPlaceToSummary(place);
  const images = safelyParseJSON<string[]>(place.images, []);
  const features = safelyParseJSON<string[]>(place.features, []);
  const openingHours = safelyParseJSON<Record<string, unknown> | null>(
    place.openingHours,
    null,
  );
  const typeProfile =
    openingHours && typeof openingHours.typeProfile === "object"
      ? (openingHours.typeProfile as Record<string, unknown>)
      : null;
  const contactInfo = safelyParseJSON<Record<string, unknown> | null>(
    place.contactInfo,
    null,
  );

  const shortHighlights = getUniquePlaceFeatureLabels(features, 4);
  const hostName = place.ownerName?.trim();
  const hostAvatar = place.ownerAvatar?.trim() || "";

  return {
    ...summary,
    heroImage: images[0] || "/images/placeholders/place-placeholder.png",
    gallery: images,
    shortHighlights,
    description: place.description || "",
    amenities: mapFeaturesToAmenities(features),
    contactInfo: contactInfo
      ? {
          phone:
            typeof contactInfo.phone === "string"
              ? contactInfo.phone
              : undefined,
          email:
            typeof contactInfo.email === "string"
              ? contactInfo.email
              : undefined,
          website:
            typeof contactInfo.website === "string"
              ? contactInfo.website
              : undefined,
        }
      : null,
    typeProfile,
    checkInInfo:
      safelyParseJSON<Record<string, string | undefined> | null>(
        place.checkInInfo,
        null,
      )?.checkIn,
    checkOutInfo:
      safelyParseJSON<Record<string, string | undefined> | null>(
        place.checkOutInfo,
        null,
      )?.checkOut,
    host: hostName
      ? {
          id: place.ownerId || place.id,
          name: hostName,
          avatar: hostAvatar,
          joinedDate: formatHostJoinedDate(place.ownerCreatedAt),
          reviewCount: place.reviewCount ?? 0,
          isVerified: place.verified,
          isSuperhost: false,
        }
      : undefined,
    reviews: recentReviews,
    featuredCollections: [],
    nearbyPlaces: nearbyPlaces.map(mapBackendPlaceToSummary),
  };
}

type APICollection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  itemCount: number;
};

function mapBackendCollectionToSummary(
  collection: APICollection,
): CollectionSummary {
  return {
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description || "",
    coverImage:
      collection.coverImage ||
      "/images/placeholders/collection-placeholder.png",
    itemCount: collection.itemCount,
  };
}

export const api = {
  business: {
    async register(data: {
      companyName: string;
      taxId: string;
      businessAddress?: string;
      contactPhone: string;
      contactEmail: string;
      businessType: string;
      documents?: string[];
    }) {
      return await request<{
        success: boolean;
        registrationId: string;
        message: string;
      }>("/api/business/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async getProfile() {
      return await request<{ registration: any; profile: any; user: any }>(
        "/api/business/profile",
      );
    },
    async updateProfile(data: {
      logo?: string;
      description?: string;
      website?: string;
      socialMedia?: Record<string, string>;
      businessHours?: any;
      responseTime?: string;
    }) {
      return await request<{ success: boolean; message: string }>(
        "/api/business/profile",
        { method: "PUT", body: JSON.stringify(data) },
      );
    },
    async getStatus() {
      return await request<{
        hasRegistration: boolean;
        status: string;
        role: string;
      }>("/api/business/status");
    },
  },
  subscriptions: {
    async getPlans() {
      return await request<{ plans: any[] }>("/api/subscriptions/plans");
    },
    async validateCoupon(planId: string, code: string) {
      return await request<{
        valid: boolean;
        coupon?: {
          id: string;
          code: string;
          discountType: "percent" | "fixed";
          discountValue: string | number;
        };
        pricing?: {
          basePrice: number;
          discountAmount: number;
          finalPrice: number;
          currency: string;
        };
        error?: string;
      }>("/api/subscriptions/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ planId, code }),
      });
    },
    async getCurrent() {
      return await request<{ subscription: any; hasSubscription: boolean }>(
        "/api/subscriptions/current",
      );
    },
    async create(planId: string, paymentData?: any, couponCode?: string) {
      return await request<{
        success: boolean;
        subscriptionId: string;
        message: string;
        subscription: any;
      }>("/api/subscriptions/create", {
        method: "POST",
        body: JSON.stringify({
          planId,
          paymentMethod: paymentData,
          couponCode,
        }),
      });
    },
    async cancel() {
      return await request<{
        success: boolean;
        message: string;
        endDate?: string;
      }>("/api/subscriptions/cancel", { method: "POST" });
    },
    async getUsage() {
      return await request<{ usage: any; subscription: any }>(
        "/api/subscriptions/usage",
      );
    },
  },
  bookings: {
    async quote(params: {
      placeId: string;
      roomId?: string;
      checkIn: string;
      checkOut: string;
      guests: number;
    }) {
      const query = new URLSearchParams({
        placeId: params.placeId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: String(params.guests),
      });
      if (params.roomId) query.set("roomId", params.roomId);

      return await request<{ quote: BookingQuote }>(
        `/api/bookings/quote?${query.toString()}`,
      );
    },
    async listRooms(params: {
      placeId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
    }) {
      const query = new URLSearchParams({
        placeId: params.placeId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: String(params.guests),
      });
      return await request<{
        rooms: Array<{
          id: string;
          name: string;
          slug: string;
          maxAdults: number;
          maxChildren: number;
          maxGuests: number;
          baseNightlyPrice: string | null;
          status: string;
          available: boolean;
        }>;
      }>(`/api/bookings/rooms?${query.toString()}`);
    },
    async create(data: {
      placeId: string;
      roomId?: string;
      checkInDate: string;
      checkOutDate: string;
      guests: number;
      specialRequests?: string;
    }) {
      return await request<{
        success: boolean;
        message: string;
        booking: BookingReservation;
      }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async listMine() {
      return await request<{ reservations: BookingReservation[] }>(
        "/api/bookings/me",
      );
    },
    async getMineById(bookingId: string) {
      return await request<{ reservation: BookingReservation }>(
        `/api/bookings/me/${bookingId}`,
      );
    },
  },
  locations: {
    async cities() {
      const data = await request<{
        cities: {
          id: string;
          name: string;
          slug: string;
          latitude: number | string | null;
          longitude: number | string | null;
        }[];
      }>("/api/locations/cities");

      return {
        cities: data.cities.map((city) => ({
          ...city,
          latitude: toNullableNumber(city.latitude),
          longitude: toNullableNumber(city.longitude),
        })),
      };
    },
    async districts(city: string) {
      if (!city) {
        return {
          city: null as {
            id: string;
            name: string;
            latitude: number | null;
            longitude: number | null;
          } | null,
          districts: [] as string[],
          districtItems: [] as {
            id: string;
            name: string;
            slug: string;
            latitude: number | null;
            longitude: number | null;
          }[],
        };
      }

      const data = await request<{
        city?: {
          id: string;
          name: string;
          latitude: number | string | null;
          longitude: number | string | null;
        } | null;
        districts?: string[];
        districtItems?: {
          id: string;
          name: string;
          slug: string;
          latitude: number | string | null;
          longitude: number | string | null;
        }[];
      }>(`/api/locations/districts/${encodeURIComponent(city)}`);

      return {
        city: data.city
          ? {
              ...data.city,
              latitude: toNullableNumber(data.city.latitude),
              longitude: toNullableNumber(data.city.longitude),
            }
          : null,
        districts: data.districts ?? [],
        districtItems: (data.districtItems ?? []).map((item) => ({
          ...item,
          latitude: toNullableNumber(item.latitude),
          longitude: toNullableNumber(item.longitude),
        })),
      };
    },
    async districtCenter(city: string, district: string) {
      const normalizedCity = city.trim();
      const normalizedDistrict = district.trim();
      if (!normalizedCity || !normalizedDistrict) return null;

      const params = new URLSearchParams({
        city: normalizedCity,
        district: normalizedDistrict,
      });

      const data = await request<{
        center?: { lat: number | string; lng: number | string } | null;
      }>(`/api/locations/district-center?${params.toString()}`);

      if (!data.center) return null;

      const lat = Number(data.center.lat);
      const lng = Number(data.center.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      return { lat, lng };
    },
  },
  owner: {
    places: {
      async list(params?: { page?: number; limit?: number; status?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set("page", params.page.toString());
        if (params?.limit) queryParams.set("limit", params.limit.toString());
        if (params?.status) queryParams.set("status", params.status);
        return await request<OwnerPlaceListResponse>(
          `/api/owner/places?${queryParams.toString()}`,
        );
      },
      async getById(id: string) {
        return await request<{ place: OwnerPlace }>(`/api/owner/places/${id}`);
      },
      async create(data: RecordLike) {
        return await request<{
          success: boolean;
          message: string;
          place: OwnerPlace | null;
        }>("/api/owner/places", { method: "POST", body: JSON.stringify(data) });
      },
      async update(id: string, data: RecordLike) {
        return await request<{
          success: boolean;
          message: string;
          place: OwnerPlace | null;
        }>(
          `/api/owner/places/${id}`,
          { method: "PUT", body: JSON.stringify(data) },
        );
      },
      async delete(id: string) {
        return await request<{ success: boolean; message: string }>(
          `/api/owner/places/${id}`,
          { method: "DELETE" },
        );
      },
      async submit(id: string) {
        return await request<{ success: boolean; message: string }>(
          `/api/owner/places/${id}/submit`,
          { method: "POST" },
        );
      },
      async categories() {
        return await request<{
          categories: OwnerPlaceKind[];
          kinds?: OwnerPlaceKind[];
        }>("/api/owner/places/categories");
      },
      async kinds() {
        return await request<{
          kinds: OwnerPlaceKind[];
        }>("/api/owner/places/kinds");
      },
      async cities() {
        return await request<{
          cities: { id: string; name: string; slug: string }[];
        }>("/api/owner/places/cities");
      },
      async districts(cityId: string) {
        return await request<{
          city: { id: string; name: string } | null;
          districts: { id: string; name: string; slug: string }[];
        }>(`/api/owner/places/districts/${cityId}`);
      },
      async listRooms(placeId: string) {
        return await request<{ rooms: RecordLike[] }>(
          `/api/owner/places/${placeId}/rooms`,
        );
      },
      async createRoom(placeId: string, data: RecordLike) {
        return await request<{ success: boolean; room: RecordLike }>(
          `/api/owner/places/${placeId}/rooms`,
          { method: "POST", body: JSON.stringify(data) },
        );
      },
      async updateRoom(placeId: string, roomId: string, data: RecordLike) {
        return await request<{ success: boolean; room: RecordLike }>(
          `/api/owner/places/${placeId}/rooms/${roomId}`,
          { method: "PUT", body: JSON.stringify(data) },
        );
      },
      async deleteRoom(placeId: string, roomId: string) {
        return await request<{ success: boolean }>(
          `/api/owner/places/${placeId}/rooms/${roomId}`,
          { method: "DELETE" },
        );
      },
      async listRoomRates(placeId: string, roomId: string) {
        return await request<{ rates: RecordLike[] }>(
          `/api/owner/places/${placeId}/rooms/${roomId}/rates`,
        );
      },
      async createRoomRate(placeId: string, roomId: string, data: RecordLike) {
        return await request<{ success: boolean; rate: RecordLike }>(
          `/api/owner/places/${placeId}/rooms/${roomId}/rates`,
          { method: "POST", body: JSON.stringify(data) },
        );
      },
      async updateRoomRate(
        placeId: string,
        roomId: string,
        rateId: string,
        data: RecordLike,
      ) {
        return await request<{ success: boolean; rate: RecordLike }>(
          `/api/owner/places/${placeId}/rooms/${roomId}/rates/${rateId}`,
          { method: "PUT", body: JSON.stringify(data) },
        );
      },
      async deleteRoomRate(placeId: string, roomId: string, rateId: string) {
        return await request<{ success: boolean }>(
          `/api/owner/places/${placeId}/rooms/${roomId}/rates/${rateId}`,
          { method: "DELETE" },
        );
      },
      async listReservations(
        placeId: string,
        params?: {
          page?: number;
          limit?: number;
          status?: string;
          paymentStatus?: string;
          roomId?: string;
          checkInFrom?: string;
          checkInTo?: string;
        },
      ) {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.limit) query.set("limit", String(params.limit));
        if (params?.status) query.set("status", params.status);
        if (params?.paymentStatus) query.set("paymentStatus", params.paymentStatus);
        if (params?.roomId) query.set("roomId", params.roomId);
        if (params?.checkInFrom) query.set("checkInFrom", params.checkInFrom);
        if (params?.checkInTo) query.set("checkInTo", params.checkInTo);

        return await request<{
          reservations: BookingReservation[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>(`/api/owner/places/${placeId}/reservations?${query.toString()}`);
      },
      async getReservationById(placeId: string, reservationId: string) {
        return await request<{ reservation: BookingReservation }>(
          `/api/owner/places/${placeId}/reservations/${reservationId}`,
        );
      },
      async updateReservationStatus(
        placeId: string,
        reservationId: string,
        data: { status: "confirmed" | "cancelled"; reason?: string },
      ) {
        return await request<{ success: boolean; reservation: BookingReservation }>(
          `/api/owner/places/${placeId}/reservations/${reservationId}/status`,
          { method: "PATCH", body: JSON.stringify(data) },
        );
      },
      async updateReservationPayment(
        placeId: string,
        reservationId: string,
        data: { paymentStatus: "pending" | "paid" | "refunded"; reason?: string },
      ) {
        return await request<{ success: boolean; reservation: BookingReservation }>(
          `/api/owner/places/${placeId}/reservations/${reservationId}/payment`,
          { method: "PATCH", body: JSON.stringify(data) },
        );
      },
      async listPriceRules(placeId: string) {
        return await request<{ rules: OwnerPlacePriceRule[] }>(
          `/api/owner/places/${placeId}/price-rules`,
        );
      },
      async createPriceRule(
        placeId: string,
        data: {
          startsOn: string;
          endsOn: string;
          nightlyPrice: number;
        },
      ) {
        return await request<{ success: boolean; rule: OwnerPlacePriceRule }>(
          `/api/owner/places/${placeId}/price-rules`,
          { method: "POST", body: JSON.stringify(data) },
        );
      },
      async updatePriceRule(
        placeId: string,
        ruleId: string,
        data: Partial<{
          startsOn: string;
          endsOn: string;
          nightlyPrice: number;
        }>,
      ) {
        return await request<{ success: boolean; rule: OwnerPlacePriceRule }>(
          `/api/owner/places/${placeId}/price-rules/${ruleId}`,
          { method: "PUT", body: JSON.stringify(data) },
        );
      },
      async deletePriceRule(placeId: string, ruleId: string) {
        return await request<{ success: boolean }>(
          `/api/owner/places/${placeId}/price-rules/${ruleId}`,
          { method: "DELETE" },
        );
      },
      async listAvailabilityBlocks(placeId: string) {
        return await request<{ blocks: OwnerAvailabilityBlock[] }>(
          `/api/owner/places/${placeId}/availability-blocks`,
        );
      },
      async createAvailabilityBlock(
        placeId: string,
        data: { startsOn: string; endsOn: string; reason?: string },
      ) {
        return await request<{ success: boolean; block: OwnerAvailabilityBlock }>(
          `/api/owner/places/${placeId}/availability-blocks`,
          { method: "POST", body: JSON.stringify(data) },
        );
      },
      async deleteAvailabilityBlock(placeId: string, blockId: string) {
        return await request<{ success: boolean }>(
          `/api/owner/places/${placeId}/availability-blocks/${blockId}`,
          { method: "DELETE" },
        );
      },
      async listRoomAvailabilityBlocks(placeId: string, roomId: string) {
        return await request<{ blocks: OwnerAvailabilityBlock[] }>(
          `/api/owner/places/${placeId}/rooms/${roomId}/availability-blocks`,
        );
      },
      async createRoomAvailabilityBlock(
        placeId: string,
        roomId: string,
        data: { startsOn: string; endsOn: string; reason?: string },
      ) {
        return await request<{ success: boolean; block: OwnerAvailabilityBlock }>(
          `/api/owner/places/${placeId}/rooms/${roomId}/availability-blocks`,
          { method: "POST", body: JSON.stringify(data) },
        );
      },
      async deleteRoomAvailabilityBlock(
        placeId: string,
        roomId: string,
        blockId: string,
      ) {
        return await request<{ success: boolean }>(
          `/api/owner/places/${placeId}/rooms/${roomId}/availability-blocks/${blockId}`,
          { method: "DELETE" },
        );
      },
      async getMenu(placeId: string) {
        return await request<{ menus: RecordLike[] }>(
          `/api/owner/places/${placeId}/menu`,
        );
      },
      async upsertMenu(placeId: string, data: RecordLike) {
        return await request<{ success: boolean; menus: RecordLike[] }>(
          `/api/owner/places/${placeId}/menu`,
          { method: "PUT", body: JSON.stringify(data) },
        );
      },
      async listPackages(placeId: string) {
        return await request<{ packages: RecordLike[] }>(
          `/api/owner/places/${placeId}/packages`,
        );
      },
      async createPackage(placeId: string, data: RecordLike) {
        return await request<{ success: boolean; package: RecordLike }>(
          `/api/owner/places/${placeId}/packages`,
          { method: "POST", body: JSON.stringify(data) },
        );
      },
      async updatePackage(placeId: string, packageId: string, data: RecordLike) {
        return await request<{ success: boolean; package: RecordLike }>(
          `/api/owner/places/${placeId}/packages/${packageId}`,
          { method: "PUT", body: JSON.stringify(data) },
        );
      },
      async deletePackage(placeId: string, packageId: string) {
        return await request<{ success: boolean }>(
          `/api/owner/places/${placeId}/packages/${packageId}`,
          { method: "DELETE" },
        );
      },
    },
    blogs: {
      async list(params?: { page?: number; limit?: number; status?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set("page", params.page.toString());
        if (params?.limit) queryParams.set("limit", params.limit.toString());
        if (params?.status) queryParams.set("status", params.status);
        return await request<{ blogs: any[]; pagination: any }>(
          `/api/owner/blogs?${queryParams.toString()}`,
        );
      },
      async getById(id: string) {
        return await request<{ blog: any }>(`/api/owner/blogs/${id}`);
      },
      async create(data: any) {
        return await request<{
          success: boolean;
          blogId: string;
          message: string;
          blog: any;
        }>("/api/owner/blogs", { method: "POST", body: JSON.stringify(data) });
      },
      async update(id: string, data: any) {
        return await request<{ success: boolean; message: string; blog: any }>(
          `/api/owner/blogs/${id}`,
          { method: "PUT", body: JSON.stringify(data) },
        );
      },
      async publish(id: string) {
        return await request<{ success: boolean; message: string }>(
          `/api/owner/blogs/${id}/publish`,
          { method: "POST" },
        );
      },
      async delete(id: string) {
        return await request<{ success: boolean; message: string }>(
          `/api/owner/blogs/${id}`,
          { method: "DELETE" },
        );
      },
      async categories() {
        return await request<{
          categories: {
            id: string;
            slug: string;
            name: string;
            description?: string | null;
          }[];
        }>(`/api/owner/blogs/categories`);
      },
    },
    upload: {
      async single(
        file: File,
        usage: OwnerUploadUsage = "other",
      ): Promise<{ url: string; fileId: string }> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("usage", usage);
        const response = await fetch(`${API_BASE_URL}/api/owner/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }
        return response.json();
      },
      async multiple(
        files: File[],
        usage: OwnerUploadUsage = "other",
      ): Promise<{ urls: string[]; fileIds: string[]; errors?: string[] }> {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        formData.append("usage", usage);
        const response = await fetch(
          `${API_BASE_URL}/api/owner/upload/multiple`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          },
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }
        return response.json();
      },
    },
  },
  places: {
    // Public places list API response used by listing page filters + pagination
    // Keep this shape explicit to avoid "any" pagination regressions.
    async listAll(params?: {
      page?: number;
      search?: string;
      city?: string;
      district?: string;
      type?: string;
      category?: string;
      limit?: number;
      guests?: number;
      season?: string;
      checkIn?: string;
      checkOut?: string;
      priceMin?: number;
      priceMax?: number;
      sort?: string;
      amenities?: string[];
      bounds?: {
        minLat: number;
        minLng: number;
        maxLat: number;
        maxLng: number;
      };
      featured?: boolean;
      verified?: boolean;
    }): Promise<{
      places: PlaceSummary[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }> {
      try {
        const page = params?.page && params.page > 0 ? params.page : 1;
        const limit = params?.limit && params.limit > 0 ? params.limit : 20;
        const queryParams = new URLSearchParams();
        queryParams.set("page", page.toString());
        queryParams.set("limit", limit.toString());

        if (params?.search) queryParams.set("search", params.search);
        if (params?.city) queryParams.set("city", params.city);
        if (params?.district) queryParams.set("district", params.district);
        if (params?.type && params.type !== "all")
          queryParams.set("type", params.type);
        if (params?.category) queryParams.set("category", params.category);
        if (params?.guests) queryParams.set("guests", params.guests.toString());
        if (params?.season) queryParams.set("season", params.season);
        if (params?.checkIn) queryParams.set("checkIn", params.checkIn);
        if (params?.checkOut) queryParams.set("checkOut", params.checkOut);
        if (params?.priceMin !== undefined)
          queryParams.set("priceMin", params.priceMin.toString());
        if (params?.priceMax !== undefined)
          queryParams.set("priceMax", params.priceMax.toString());
        const normalizedSort = params?.sort?.trim().toLowerCase();
        if (normalizedSort) {
          if (["newest", "created_desc", "recent"].includes(normalizedSort)) {
            queryParams.set("sortBy", "createdAt");
            queryParams.set("sortOrder", "desc");
          } else if (["oldest", "created_asc"].includes(normalizedSort)) {
            queryParams.set("sortBy", "createdAt");
            queryParams.set("sortOrder", "asc");
          } else if (
            ["price_asc", "priceasc", "price-low-to-high"].includes(normalizedSort)
          ) {
            queryParams.set("sortBy", "price");
            queryParams.set("sortOrder", "asc");
          } else if (
            ["price_desc", "pricedesc", "price-high-to-low"].includes(normalizedSort)
          ) {
            queryParams.set("sortBy", "price");
            queryParams.set("sortOrder", "desc");
          } else if (["rating", "rating_desc", "top-rated"].includes(normalizedSort)) {
            queryParams.set("sortBy", "rating");
            queryParams.set("sortOrder", "desc");
          } else if (
            ["popular", "reviews", "review_count"].includes(normalizedSort)
          ) {
            queryParams.set("sortBy", "reviewCount");
            queryParams.set("sortOrder", "desc");
          }
        }
        if (params?.amenities && params.amenities.length > 0) {
          queryParams.set("amenities", params.amenities.join(","));
        }
        if (params?.bounds) {
          queryParams.set(
            "bounds",
            `${params.bounds.minLat},${params.bounds.minLng},${params.bounds.maxLat},${params.bounds.maxLng}`,
          );
        }
        if (params?.featured) queryParams.set("featured", "true");
        if (params?.verified) queryParams.set("verified", "true");

        const response = await request<{
          places: APIPlace[];
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            totalPages?: number;
          };
        }>(`/api/places?${queryParams.toString()}`);
        const mappedPlaces = response.places.map(mapBackendPlaceToSummary);
        const total = Number(response.pagination?.total ?? mappedPlaces.length);

        return {
          places: mappedPlaces,
          pagination: {
            page: Number(response.pagination?.page ?? page),
            limit: Number(response.pagination?.limit ?? limit),
            total,
            totalPages: Number(
              response.pagination?.totalPages ??
                (total > 0 ? Math.ceil(total / limit) : 0),
            ),
          },
        };
      } catch (error) {
        console.error("Failed to fetch places from API:", error);
        return {
          places: [],
          pagination: {
            page: params?.page && params.page > 0 ? params.page : 1,
            limit: params?.limit && params.limit > 0 ? params.limit : 20,
            total: 0,
            totalPages: 0,
          },
        };
      }
    },
    async listFeatured(): Promise<PlaceSummary[]> {
      try {
        const response = await request<{ places: APIPlace[] }>(
          `/api/places/featured?limit=9`,
        );
        return response.places.map(mapBackendPlaceToSummary);
      } catch (error) {
        console.error("Failed to fetch featured places from API:", error);
        return [];
      }
    },
    async listAmenities(): Promise<
      { key: string; label: string; count: number }[]
    > {
      try {
        const response = await request<{
          amenities: { key: string; label: string; count: number }[];
        }>(`/api/places/amenities`);
        return response.amenities;
      } catch (error) {
        console.error("Failed to fetch amenities:", error);
        return [];
      }
    },
    async listTypes(): Promise<PlaceTypeSummary[]> {
      try {
        const response = await request<{
          categories: {
            id: string;
            title: string;
            description: string;
            count: number;
          }[];
        }>(`/api/places/categories`);
        return response.categories.map((cat) => ({
          id: cat.id,
          title: cat.title,
          description: cat.description,
          count: cat.count,
        }));
      } catch (error) {
        console.error("Failed to fetch place categories:", error);
        return [];
      }
    },
    async listCities(): Promise<
      { name: string; slug: string; count: number }[]
    > {
      try {
        const response = await request<{
          cities: { name: string; slug: string; count: number }[];
        }>(`/api/places/cities`);
        return response.cities;
      } catch (error) {
        console.error("Failed to fetch cities:", error);
        return [];
      }
    },
    async listPlaceTypes(): Promise<
      { type: string; name: string; count: number }[]
    > {
      try {
        const response = await request<{
          types: { type: string; name: string; count: number }[];
        }>(`/api/places/types`);
        return response.types;
      } catch (error) {
        console.error("Failed to fetch place types:", error);
        return [];
      }
    },
    async getBySlug(slug: string): Promise<PlaceDetail | null> {
      try {
        const response = await request<{
          place: APIPlace;
          nearbyPlaces: APIPlace[];
          recentReviews?: {
            id: string;
            rating: number;
            title: string | null;
            content: string | null;
            createdAt: string;
            userName: string;
            userAvatar: string | null;
          }[];
        } | null>(`/api/places/${slug}`);
        if (!response || !response.place) return null;
        const mappedReviews: PlaceReview[] = (response.recentReviews ?? [])
          .filter((review) => review.content || review.title)
          .map((review) => ({
            id: review.id,
            rating: Number(review.rating || 0),
            comment: review.content || review.title || "",
            date: new Intl.DateTimeFormat("tr-TR", {
              month: "long",
              year: "numeric",
            }).format(new Date(review.createdAt)),
            author: {
              name: review.userName,
              avatar: review.userAvatar || "",
            },
          }));
        return mapBackendPlaceToDetail(
          response.place,
          response.nearbyPlaces || [],
          mappedReviews,
        );
      } catch (error) {
        console.error(`Failed to fetch place by slug ${slug}:`, error);
        return null;
      }
    },
  },
  collections: {
    async listFeatured(): Promise<CollectionSummary[]> {
      try {
        const response = await request<{ collections: APICollection[] }>(
          `/api/collections/featured?limit=6`,
        );
        return response.collections.map(mapBackendCollectionToSummary);
      } catch (error) {
        console.error("Failed to fetch featured collections from API:", error);
        return [];
      }
    },
    async list(params?: {
      page?: number;
      limit?: number;
      search?: string;
      season?: string;
      bestFor?: string;
    }): Promise<{ collections: CollectionSummary[]; pagination: any }> {
      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set("page", params.page.toString());
        if (params?.limit) queryParams.set("limit", params.limit.toString());
        if (params?.search) queryParams.set("search", params.search);
        if (params?.season) queryParams.set("season", params.season);
        if (params?.bestFor) queryParams.set("bestFor", params.bestFor);

        const response = await request<{
          collections: APICollection[];
          pagination: any;
        }>(`/api/collections?${queryParams.toString()}`);
        return {
          collections: response.collections.map(mapBackendCollectionToSummary),
          pagination: response.pagination,
        };
      } catch (error) {
        console.error("Failed to fetch collections:", error);
        return { collections: [], pagination: {} };
      }
    },
    async getBySlug(slug: string): Promise<{
      collection: CollectionDetail;
      relatedCollections: CollectionSummary[];
    } | null> {
      try {
        const response = await request<{
          collection: any;
          featuredPlaces: APIPlace[];
          relatedCollections: APICollection[];
        } | null>(`/api/collections/${slug}`);
        if (!response || !response.collection) return null;

        const col = response.collection;
        const details: CollectionDetail = {
          id: col.id,
          slug: col.slug,
          name: col.name,
          description: col.description || "",
          coverImage:
            col.coverImage || "/images/placeholders/collection-placeholder.png",
          itemCount: col.itemCount,
          heroImage:
            col.heroImage ||
            col.coverImage ||
            "/images/placeholders/collection-placeholder.png",
          intro: col.intro || "",
          duration: col.duration || "",
          season: col.season || "",
          bestFor: safelyParseJSON(col.bestFor, []),
          highlights: safelyParseJSON(col.highlights, []),
          itinerary: safelyParseJSON(col.itinerary, []),
          tips: safelyParseJSON(col.tips, []),
          featuredPlaces: response.featuredPlaces
            ? response.featuredPlaces.map(mapBackendPlaceToSummary)
            : [],
        };

        return {
          collection: details,
          relatedCollections: response.relatedCollections
            ? response.relatedCollections.map(mapBackendCollectionToSummary)
            : [],
        };
      } catch (error) {
        console.error(`Failed to fetch collection ${slug}:`, error);
        return null;
      }
    },
  },
  blog: {
    async list(params?: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      featured?: boolean;
    }): Promise<{
      blogPosts: BlogPost[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }> {
      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set("page", params.page.toString());
        if (params?.limit) queryParams.set("limit", params.limit.toString());
        if (params?.search) queryParams.set("search", params.search);
        if (params?.category && params.category !== "tum")
          queryParams.set("category", params.category);
        if (params?.featured) queryParams.set("featured", "true");
        queryParams.set("language", DEFAULT_LOCALE);

        const response = await request<{
          blogPosts: any[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>(`/api/blog?${queryParams.toString()}`);

        const mappedPosts: BlogPost[] = response.blogPosts.map((post: any) => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          heroImage: post.heroImage,
          featuredImage: post.featuredImage,
          publishedAt: post.publishedAt,
          readTime: post.readTime,
          categoryId: post.categoryId ?? null,
          categorySlug: post.categorySlug ?? null,
          categoryName: post.categoryName ?? null,
          authorName: post.authorName,
          authorAvatar: post.authorAvatar,
          views: post.views,
          commentCount: post.commentCount ?? 0,
        }));

        return { blogPosts: mappedPosts, pagination: response.pagination };
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        return {
          blogPosts: [],
          pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
        };
      }
    },
    async getBySlug(slug: string): Promise<{
      blogPost: BlogPostDetail;
      relatedPosts: BlogPost[];
    } | null> {
      try {
        const response = await request<{
          blogPost: any;
          relatedPosts: any[];
        } | null>(`/api/blog/${slug}`);
        if (!response || !response.blogPost) return null;

        const post = response.blogPost;
        const details: BlogPostDetail = {
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          heroImage: post.heroImage,
          featuredImage: post.featuredImage,
          publishedAt: post.publishedAt,
          readTime: post.readTime,
          categoryId: post.categoryId ?? null,
          categorySlug: post.categorySlug ?? null,
          categoryName: post.categoryName ?? null,
          authorName: post.authorName,
          authorAvatar: post.authorAvatar,
          views: post.views,
          content: post.content,
          tags: safelyParseJSON<string[]>(post.tags, []),
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          seoKeywords: safelyParseJSON<string[]>(post.seoKeywords, []),
          commentCount: post.commentCount ?? 0,
          likeCount: post.likeCount ?? 0,
          shareCount: post.shareCount ?? 0,
          images: safelyParseJSON<string[]>(post.images, []),
        };

        const related = response.relatedPosts.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          heroImage: p.heroImage,
          featuredImage: p.featuredImage,
          publishedAt: p.publishedAt,
          readTime: p.readTime,
          categoryId: p.categoryId ?? null,
          categorySlug: p.categorySlug ?? null,
          categoryName: p.categoryName ?? null,
          authorName: p.authorName,
          authorAvatar: p.authorAvatar,
          views: p.views,
          commentCount: p.commentCount ?? 0,
        }));

        return { blogPost: details, relatedPosts: related };
      } catch (error) {
        console.error(`Failed to fetch blog post ${slug}:`, error);
        return null;
      }
    },
    async listCategories(): Promise<
      { name: string; displayName: string; count: number; slug: string }[]
    > {
      try {
        const response = await request<{ categories: any[] }>(
          `/api/blog/categories`,
        );
        return response.categories;
      } catch (error) {
        console.error("Failed to fetch blog categories:", error);
        return [];
      }
    },
    async listComments(
      slug: string,
      params?: { page?: number; limit?: number },
    ): Promise<{
      comments: BlogComment[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }> {
      try {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.limit) query.set("limit", String(params.limit));
        const endpoint = `/api/blog/${slug}/comments${query.toString() ? `?${query.toString()}` : ""}`;
        return await request<{
          comments: BlogComment[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>(endpoint);
      } catch (error) {
        console.error("Failed to fetch blog comments:", error);
        return {
          comments: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        };
      }
    },
    async submitComment(
      slug: string,
      payload: { content: string; guestName?: string; guestEmail?: string },
    ): Promise<{ success: boolean; message: string }> {
      return await request<{ success: boolean; message: string }>(
        `/api/blog/${slug}/comments`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    },
  },
  profile: {
    async update(data: {
      name: string;
      phone?: string;
      bio?: string;
    }): Promise<{ success: boolean; message: string }> {
      try {
        return await request<{ success: boolean; message: string }>(
          "/api/profile/update",
          {
            method: "PUT",
            body: JSON.stringify(data),
          },
        );
      } catch (error) {
        console.error("Failed to update profile:", error);
        throw error;
      }
    },
  },
};
