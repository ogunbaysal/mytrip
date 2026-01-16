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
  features?: string[];
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

export type PlaceHost = {
  id: string;
  name: string;
  avatar: string;
  isSuperhost?: boolean;
  joinedDate: string;
  reviewCount: number;
  isVerified?: boolean;
  responseRate?: number;
  responseTime?: string;
  description?: string;
};

export type PlaceReview = {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  comment: string;
  rating: number;
};

export type PlaceRatings = {
  overall: number;
  cleanliness: number;
  accuracy: number;
  communication: number;
  location: number;
  checkIn: number;
  value: number;
};

export type PlaceRules = {
  checkInTime?: string;
  checkOutTime?: string;
  selfCheckIn?: boolean;
  maxGuests?: number;
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  partiesAllowed?: boolean;
  additionalRules?: string[];
};

export type PlaceSafety = {
  hasSmokAlarm?: boolean;
  hasCarbonMonoxideAlarm?: boolean;
  hasSecurityCamera?: boolean;
  hasFirstAidKit?: boolean;
  additionalInfo?: string[];
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
  // New fields for Airbnb-style detail page
  host?: PlaceHost;
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  reviews?: PlaceReview[];
  ratings?: PlaceRatings;
  rules?: PlaceRules;
  safety?: PlaceSafety;
  cancellationPolicy?: string;
  locationDescription?: string;
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
export type PlaceTypeSummary = {
  id: string;
  title: string;
  description: string;
  count: number;
};
