import type { CollectionSummary, PlaceSummary, PlaceTypeSummary, PlaceDetail, PlaceAmenity, BlogPost, BlogPostDetail, CollectionDetail } from "@/types";

import { FEATURED_COLLECTIONS } from "./data/collections";
import { FEATURED_PLACES } from "./data/featured-places";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const DEFAULT_LOCALE = "tr";

type RequestOptions = RequestInit & { cache?: RequestCache };

async function request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
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
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Backend types
type APIPlace = {
  id: string;
  slug: string;
  name: string;
  type: string;
  category: string | null;
  description: string | null;
  shortDescription: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  location: string | object | null; // JSON string or object
  rating: string | null;
  reviewCount: number;
  priceLevel: string | null;
  nightlyPrice: string | null;
  images: string | object | null; // JSON string or object
  features: string | object | null; // JSON string or object
  openingHours: string | object | null; // JSON string or object
  contactInfo: string | object | null; // JSON string or object
  checkInInfo: string | object | null; // JSON string or object
  checkOutInfo: string | object | null;
  verified: boolean;
  featured: boolean;
  views: number;
  bookingCount: number;
};

function safelyParseJSON<T>(input: string | object | null | undefined, fallback: T): T {
  if (!input) return fallback;
  if (typeof input === "object") return input as T;
  try {
    return JSON.parse(input) as T;
  } catch (e) {
    return fallback;
  }
}

function mapFeaturesToAmenities(features: string[]): PlaceAmenity[] {
  const commonAmenities: Record<string, string> = {
    wifi: "📶",
    parking: "🅿️",
    pool: "🏊",
    spa: "🧖",
    gym: "🏋️",
    restaurant: "🍽️",
    bar: "🍸",
    room_service: "🛎️",
    air_conditioning: "❄️",
    heating: "🔥",
    sea_view: "🌊",
    beach_access: "🏖️",
    pet_friendly: "🐾",
    wheelchair_accessible: "♿",
    family_friendly: "👨‍👩‍👧‍👦",
  };

  return features.map(f => ({
    icon: commonAmenities[f] || "✨",
    label: f.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), // Simple label formatter
  }));
}

function mapBackendPlaceToSummary(place: APIPlace): PlaceSummary {
  const images = safelyParseJSON<string[]>(place.images, []);
  const location = safelyParseJSON<{ lat: number; lng: number }>(place.location, { lat: 37.1, lng: 28.3 });

  // Map type
  let type: PlaceSummary["type"] = "stay";
  const pType = place.type.toLowerCase();
  if (["hotel", "stay"].includes(pType)) type = "stay";
  else if (["restaurant", "cafe"].includes(pType)) type = "restaurant";
  else type = "experience";

  // Map category (simplified fallback)
  const category: any = place.category?.toLowerCase() || "wellness";

  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    shortDescription: place.shortDescription || "",
    nightlyPrice: place.nightlyPrice ? Number(place.nightlyPrice) : 0,
    rating: place.rating ? Number(place.rating) : 0,
    reviewCount: place.reviewCount,
    imageUrl: images[0] || "/images/placeholders/place-placeholder.jpg",
    city: place.city || "",
    district: place.district || "",
    type,
    category,
    coordinates: location,
  };
}

function mapBackendPlaceToDetail(place: APIPlace, nearbyPlaces: APIPlace[] = []): PlaceDetail {
  const summary = mapBackendPlaceToSummary(place);
  const images = safelyParseJSON<string[]>(place.images, []);
  const features = safelyParseJSON<string[]>(place.features, []);
  
  // We can treat features as short highlights too if they are few, or specific ones
  const shortHighlights = features.slice(0, 3).map(f => f.replace(/_/g, " ")); 
  
  return {
    ...summary,
    heroImage: images[0] || "/images/placeholders/place-placeholder.jpg",
    gallery: images,
    shortHighlights,
    description: place.description || "",
    amenities: mapFeaturesToAmenities(features),
    checkInInfo: safelyParseJSON<any>(place.checkInInfo, null)?.checkIn || undefined, // Adjust based on actual JSON structure of checkInInfo
    checkOutInfo: safelyParseJSON<any>(place.checkOutInfo, null)?.checkOut || undefined,
    featuredCollections: [], // Need backend support or separate call
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

function mapBackendCollectionToSummary(collection: APICollection): CollectionSummary {
  return {
    id: collection.id,
    slug: collection.slug,
    name: collection.name,
    description: collection.description || "",
    coverImage: collection.coverImage || "/images/placeholders/collection-placeholder.jpg",
    itemCount: collection.itemCount,
  };
}

export const api = {
  places: {
    async listFeatured(): Promise<PlaceSummary[]> {
      try {
        const response = await request<{ places: APIPlace[] }>(`/api/places/featured?limit=9`);
        return response.places.map(mapBackendPlaceToSummary);
      } catch (error) {
        console.error("Failed to fetch featured places from API:", error);
        return FEATURED_PLACES;
      }
    },
    async listAll(params?: {
      search?: string;
      city?: string;
      district?: string;
      type?: string;
      category?: string;
      limit?: number;
    }): Promise<PlaceSummary[]> {
      try {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.set("limit", params.limit.toString());
        else queryParams.set("limit", "20");
        
        if (params?.search) queryParams.set("search", params.search);
        if (params?.city) queryParams.set("city", params.city);
        if (params?.district) queryParams.set("district", params.district);
        if (params?.type && params.type !== "all") queryParams.set("type", params.type);
        if (params?.category) queryParams.set("category", params.category);

        const response = await request<{ places: APIPlace[] }>(`/api/places?${queryParams.toString()}`);
        return response.places.map(mapBackendPlaceToSummary);
      } catch (error) {
        console.error("Failed to fetch places from API:", error);
        return FEATURED_PLACES;
      }
    },
    async listTypes(): Promise<PlaceTypeSummary[]> {
      try {
        const response = await request<{ categories: { id: string, title: string, description: string, count: number }[] }>(`/api/places/categories`);
        return response.categories.map(cat => ({
          id: cat.id,
          title: cat.title,
          description: cat.description,
          count: cat.count
        }));
      } catch (error) {
        console.error("Failed to fetch place categories:", error);
        return [];
      }
    },
    async listCities(): Promise<{ name: string; slug: string; count: number }[]> {
      try {
        const response = await request<{ cities: { name: string; slug: string; count: number }[] }>(`/api/places/cities`);
        return response.cities;
      } catch (error) {
        console.error("Failed to fetch cities:", error);
        return [];
      }
    },
    async listPlaceTypes(): Promise<{ type: string; name: string; count: number }[]> {
      try {
        const response = await request<{ types: { type: string; name: string; count: number }[] }>(`/api/places/types`);
        return response.types;
      } catch (error) {
        console.error("Failed to fetch place types:", error);
        return [];
      }
    },
    async getBySlug(slug: string): Promise<PlaceDetail | null> {
      try {
        const response = await request<{ place: APIPlace, nearbyPlaces: APIPlace[] } | null>(`/api/places/${slug}`);
        if (!response || !response.place) return null;
        return mapBackendPlaceToDetail(response.place, response.nearbyPlaces);
      } catch (error) {
        console.error(`Failed to fetch place by slug ${slug}:`, error);
        return null;
      }
    },
  },
  collections: {
    async listFeatured(): Promise<CollectionSummary[]> {
      try {
        const response = await request<{ collections: APICollection[] }>(`/api/collections/featured?limit=6`);
        return response.collections.map(mapBackendCollectionToSummary);
      } catch (error) {
        console.error("Failed to fetch featured collections from API:", error);
        return FEATURED_COLLECTIONS;
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

        const response = await request<{ collections: APICollection[]; pagination: any }>(`/api/collections?${queryParams.toString()}`);
        return {
          collections: response.collections.map(mapBackendCollectionToSummary),
          pagination: response.pagination,
        };
      } catch (error) {
        console.error("Failed to fetch collections:", error);
        return { collections: [], pagination: {} };
      }
    },
    async getBySlug(slug: string): Promise<{ collection: CollectionDetail; relatedCollections: CollectionSummary[] } | null> {
      try {
        const response = await request<{ collection: any; featuredPlaces: APIPlace[]; relatedCollections: APICollection[] } | null>(`/api/collections/${slug}`);
        if (!response || !response.collection) return null;

        const col = response.collection;
        const details: CollectionDetail = {
          id: col.id,
          slug: col.slug,
          name: col.name,
          description: col.description || "",
          coverImage: col.coverImage || "/images/placeholders/collection-placeholder.jpg",
          itemCount: col.itemCount,
          heroImage: col.heroImage || col.coverImage || "/images/placeholders/collection-placeholder.jpg",
          intro: col.intro || "",
          duration: col.duration || "",
          season: col.season || "",
          bestFor: safelyParseJSON(col.bestFor, []),
          highlights: safelyParseJSON(col.highlights, []),
          itinerary: safelyParseJSON(col.itinerary, []),
          tips: safelyParseJSON(col.tips, []),
          featuredPlaces: response.featuredPlaces ? response.featuredPlaces.map(mapBackendPlaceToSummary) : [],
        };

        return {
          collection: details,
          relatedCollections: response.relatedCollections ? response.relatedCollections.map(mapBackendCollectionToSummary) : [],
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
    }): Promise<{ blogPosts: BlogPost[]; pagination: any }> {
      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set("page", params.page.toString());
        if (params?.limit) queryParams.set("limit", params.limit.toString());
        if (params?.search) queryParams.set("search", params.search);
        if (params?.category && params.category !== "tum") queryParams.set("category", params.category);
        if (params?.featured) queryParams.set("featured", "true");

        const response = await request<{ blogPosts: any[]; pagination: any; filters: any }>(`/api/blog?${queryParams.toString()}`);
        
        // Map backend response to Frontend Type if needed, or assume match
        // Backend returns roughly consistent data.
        const mappedPosts: BlogPost[] = response.blogPosts.map((post: any) => ({
             id: post.id,
             slug: post.slug,
             title: post.title,
             excerpt: post.excerpt,
             heroImage: post.heroImage,
             featuredImage: post.featuredImage,
             publishedAt: post.publishedAt,
             readTime: post.readTime,
             category: post.category,
             authorName: post.authorName,
             authorAvatar: post.authorAvatar,
             views: post.views,
        }));

        return { blogPosts: mappedPosts, pagination: response.pagination };
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
        return { blogPosts: [], pagination: {} };
      }
    },
    async getBySlug(slug: string): Promise<{ blogPost: BlogPostDetail; relatedPosts: BlogPost[] } | null> {
      try {
        const response = await request<{ blogPost: any; relatedPosts: any[] } | null>(`/api/blog/${slug}`);
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
             category: post.category,
             authorName: post.authorName,
             authorAvatar: post.authorAvatar,
             views: post.views,
             content: post.content,
             tags: post.tags,
             seoTitle: post.seoTitle,
             seoDescription: post.seoDescription,
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
             category: p.category,
             authorName: p.authorName,
             authorAvatar: p.authorAvatar,
             views: p.views,
        }));

        return { blogPost: details, relatedPosts: related };

      } catch (error) {
         console.error(`Failed to fetch blog post ${slug}:`, error);
         return null;
      }
    },
    async listCategories(): Promise<{ name: string; displayName: string; count: number; slug: string }[]> {
        try {
            const response = await request<{ categories: any[] }>(`/api/blog/categories`);
            return response.categories;
        } catch (error) {
            console.error("Failed to fetch blog categories:", error);
            return [];
        }
    }
  },
};
