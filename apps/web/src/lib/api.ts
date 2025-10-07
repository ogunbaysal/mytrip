import type { CollectionSummary, PlaceSummary } from "@/types";

import { FEATURED_COLLECTIONS } from "./data/collections";
import { FEATURED_PLACES } from "./data/featured-places";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_LOCALE = "tr";

type RequestOptions = RequestInit & { cache?: RequestCache };

async function request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

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
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  places: {
    async listFeatured(): Promise<PlaceSummary[]> {
      if (!API_BASE_URL) {
        return FEATURED_PLACES;
      }

      return request<PlaceSummary[]>(`/places/featured?locale=${DEFAULT_LOCALE}`);
    },
    async listAll(): Promise<PlaceSummary[]> {
      if (!API_BASE_URL) {
        return FEATURED_PLACES;
      }

      return request<PlaceSummary[]>(`/places?locale=${DEFAULT_LOCALE}`);
    },
  },
  collections: {
    async listFeatured(): Promise<CollectionSummary[]> {
      if (!API_BASE_URL) {
        return FEATURED_COLLECTIONS;
      }

      return request<CollectionSummary[]>(`/collections/featured?locale=${DEFAULT_LOCALE}`);
    },
  },
};
