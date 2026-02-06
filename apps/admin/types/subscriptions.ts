export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  currency: string;
  billingCycle: "yearly";
  maxPlaces: number;
  maxBlogs: number;
  features?: string[];
  limits?: { maxPlaces: number; maxBlogs: number };
  active: boolean;
  sortOrder?: number;
}

export interface Subscription {
  id: string;
  // Core relation IDs
  userId: string;
  planId: string;
  placeId?: string;

  // Flattened Display Data
  planName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  placeName?: string;

  // Status & Dates
  status: "active" | "expired" | "cancelled" | "pending" | "trial" | "past_due";
  startDate: Date;
  endDate: Date;
  nextBillingDate?: Date;
  cancelledAt?: Date;
  trialEndsAt?: Date;

  // Financials
  price: number;
  currency: "TRY" | "USD" | "EUR";
  billingCycle: "yearly";

  // Features & Usage
  features: string[];
  limits: { maxPlaces: number; maxBlogs: number };
  usage: {
    currentPlaces: number;
    currentBlogs: number;
    currentPhotos: number;
    featuredListingsUsed: number;
  };

  // Payment Info
  paymentMethod: {
    type: "credit_card" | "bank_transfer" | "paypal" | "unknown";
    lastFour?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  paymentHistory: {
    id: string;
    date: Date;
    amount: number;
    status: "success" | "failed" | "pending";
    invoiceId?: string;
  }[];

  createdAt?: Date;
  updatedAt?: Date;
}
