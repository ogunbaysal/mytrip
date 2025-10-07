export type PlaceCategory =
  | "beachfront"
  | "design"
  | "family"
  | "gastronomy"
  | "sailing"
  | "wellness";

export type PlaceSummary = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  nightlyPrice: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  city: string;
  district: string;
  type: "stay" | "experience" | "restaurant";
  category: PlaceCategory;
  coordinates: {
    lat: number;
    lng: number;
  };
};

export type CollectionSummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImage: string;
  itemCount: number;
};

export type PlaceAmenity = {
  icon: string;
  label: string;
};

export type PlaceDetail = PlaceSummary & {
  heroImage: string;
  gallery: string[];
  shortHighlights: string[];
  description: string;
  amenities: PlaceAmenity[];
  checkInInfo?: string;
  checkOutInfo?: string;
  featuredCollections?: CollectionSummary[];
  nearbyPlaces?: PlaceSummary[];
};

export type CollectionHighlight = {
  title: string;
  description: string;
};

export type CollectionItineraryItem = {
  day: string;
  title: string;
  description: string;
};

export type CollectionDetail = CollectionSummary & {
  heroImage: string;
  intro: string;
  duration: string;
  season: string;
  bestFor: string[];
  highlights: CollectionHighlight[];
  itinerary: CollectionItineraryItem[];
  tips: string[];
  featuredPlaces: PlaceSummary[];
};
