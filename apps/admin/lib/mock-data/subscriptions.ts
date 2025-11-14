export interface Subscription {
  id: string
  planId: string
  planName: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  placeId?: string
  placeName?: string
  status: "active" | "expired" | "cancelled" | "pending" | "trial"
  price: number
  currency: "TRY" | "USD" | "EUR"
  billingCycle: "monthly" | "quarterly" | "yearly"
  startDate: Date
  endDate: Date
  nextBillingDate?: Date
  cancelledAt?: Date
  trialEndsAt?: Date
  features: string[]
  limits: {
    maxPlaces: number
    maxBlogs: number
    maxPhotos: number
    featuredListing: boolean
    analyticsAccess: boolean
    prioritySupport: boolean
  }
  usage: {
    currentPlaces: number
    currentBlogs: number
    currentPhotos: number
    featuredListingsUsed: number
  }
  paymentMethod: {
    type: "credit_card" | "bank_transfer" | "paypal"
    lastFour?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
  }
  paymentHistory: {
    id: string
    date: Date
    amount: number
    status: "success" | "failed" | "pending"
    invoiceId?: string
  }[]
  createdAt: Date
  updatedAt: Date
}

export const subscriptionPlans = [
  {
    id: "basic",
    name: "Temel Paket",
    price: 199,
    currency: "TRY",
    billingCycle: "monthly" as const,
    features: [
      "1 Mekan Listeleme",
      "5 Blog Yazısı",
      "10 Fotoğraf",
      "Standart Destek"
    ],
    limits: {
      maxPlaces: 1,
      maxBlogs: 5,
      maxPhotos: 10,
      featuredListing: false,
      analyticsAccess: false,
      prioritySupport: false,
    }
  },
  {
    id: "professional",
    name: "Profesyonel Paket",
    price: 499,
    currency: "TRY",
    billingCycle: "monthly" as const,
    features: [
      "3 Mekan Listeleme",
      "20 Blog Yazısı",
      "50 Fotoğraf",
      "Öne Çıkan Listeleme",
      "Temel Analitik",
      "E-posta Desteği"
    ],
    limits: {
      maxPlaces: 3,
      maxBlogs: 20,
      maxPhotos: 50,
      featuredListing: true,
      analyticsAccess: true,
      prioritySupport: false,
    }
  },
  {
    id: "premium",
    name: "Premium Paket",
    price: 999,
    currency: "TRY",
    billingCycle: "monthly" as const,
    features: [
      "Sınırsız Mekan Listeleme",
      "Sınırsız Blog Yazısı",
      "Sınırsız Fotoğraf",
      "Sınırsız Öne Çıkan Listeleme",
      "Gelişmiş Analitik",
      "Öncelikli Destek",
      "API Erişimi",
      "Özel Marka Sayfası"
    ],
    limits: {
      maxPlaces: -1, // unlimited
      maxBlogs: -1,
      maxPhotos: -1,
      featuredListing: true,
      analyticsAccess: true,
      prioritySupport: true,
    }
  },
  {
    id: "enterprise",
    name: "Kurumsal Paket",
    price: 2999,
    currency: "TRY",
    billingCycle: "monthly" as const,
    features: [
      "Premium Paketin Tüm Özellikleri",
      "Özel Entegrasyonlar",
      "Hesap Yöneticisi",
      "Özel Fiyatlandırma",
      "SLA Garantisi"
    ],
    limits: {
      maxPlaces: -1,
      maxBlogs: -1,
      maxPhotos: -1,
      featuredListing: true,
      analyticsAccess: true,
      prioritySupport: true,
    }
  }
]

export const subscriptionStatuses = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "active", label: "Aktif" },
  { value: "expired", label: "Süresi Doldu" },
  { value: "cancelled", label: "İptal Edildi" },
  { value: "pending", label: "Beklemede" },
  { value: "trial", label: "Deneme Sürümü" },
]

export const billingCycles = [
  { value: "all", label: "Tüm Dönemler" },
  { value: "monthly", label: "Aylık" },
  { value: "quarterly", label: "3 Aylık" },
  { value: "yearly", label: "Yıllık" },
]

export const mockSubscriptions: Subscription[] = [
  {
    id: "1",
    planId: "premium",
    planName: "Premium Paket",
    ownerId: "1",
    ownerName: "Ahmet Yılmaz",
    ownerEmail: "ahmet@example.com",
    placeId: "1",
    placeName: "Bodrum Marina Hotel",
    status: "active",
    price: 999,
    currency: "TRY",
    billingCycle: "monthly",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-12-15"),
    nextBillingDate: new Date("2024-12-15"),
    features: subscriptionPlans[2].features,
    limits: subscriptionPlans[2].limits,
    usage: {
      currentPlaces: 3,
      currentBlogs: 15,
      currentPhotos: 120,
      featuredListingsUsed: 2,
    },
    paymentMethod: {
      type: "credit_card",
      lastFour: "4242",
      brand: "visa",
      expiryMonth: 8,
      expiryYear: 2025,
    },
    paymentHistory: [
      {
        id: "pay_001",
        date: new Date("2024-11-15"),
        amount: 999,
        status: "success",
        invoiceId: "inv_001",
      },
      {
        id: "pay_002",
        date: new Date("2024-10-15"),
        amount: 999,
        status: "success",
        invoiceId: "inv_002",
      },
      {
        id: "pay_003",
        date: new Date("2024-09-15"),
        amount: 999,
        status: "success",
        invoiceId: "inv_003",
      },
    ],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-11-15"),
  },
  {
    id: "2",
    planId: "professional",
    planName: "Profesyonel Paket",
    ownerId: "2",
    ownerName: "Ayşe Demir",
    ownerEmail: "ayse@example.com",
    placeId: "2",
    placeName: "Marmaris Yelken Cafe",
    status: "active",
    price: 499,
    currency: "TRY",
    billingCycle: "monthly",
    startDate: new Date("2024-02-20"),
    endDate: new Date("2024-12-20"),
    nextBillingDate: new Date("2024-12-20"),
    features: subscriptionPlans[1].features,
    limits: subscriptionPlans[1].limits,
    usage: {
      currentPlaces: 2,
      currentBlogs: 8,
      currentPhotos: 25,
      featuredListingsUsed: 1,
    },
    paymentMethod: {
      type: "credit_card",
      lastFour: "8888",
      brand: "mastercard",
      expiryMonth: 12,
      expiryYear: 2024,
    },
    paymentHistory: [
      {
        id: "pay_004",
        date: new Date("2024-11-20"),
        amount: 499,
        status: "success",
        invoiceId: "inv_004",
      },
      {
        id: "pay_005",
        date: new Date("2024-10-20"),
        amount: 499,
        status: "success",
        invoiceId: "inv_005",
      },
    ],
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-11-20"),
  },
  {
    id: "3",
    planId: "professional",
    planName: "Profesyonel Paket",
    ownerId: "4",
    ownerName: "Zeynep Çelik",
    ownerEmail: "zeynep@example.com",
    placeId: "3",
    placeName: "Fethiye Balık Restaurant",
    status: "active",
    price: 499,
    currency: "TRY",
    billingCycle: "monthly",
    startDate: new Date("2024-03-10"),
    endDate: new Date("2024-12-10"),
    nextBillingDate: new Date("2024-12-10"),
    features: subscriptionPlans[1].features,
    limits: subscriptionPlans[1].limits,
    usage: {
      currentPlaces: 1,
      currentBlogs: 12,
      currentPhotos: 40,
      featuredListingsUsed: 1,
    },
    paymentMethod: {
      type: "bank_transfer",
    },
    paymentHistory: [
      {
        id: "pay_006",
        date: new Date("2024-11-10"),
        amount: 499,
        status: "success",
        invoiceId: "inv_006",
      },
      {
        id: "pay_007",
        date: new Date("2024-10-10"),
        amount: 499,
        status: "success",
        invoiceId: "inv_007",
      },
    ],
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-11-10"),
  },
  {
    id: "4",
    planId: "basic",
    planName: "Temel Paket",
    ownerId: "7",
    ownerName: "Fatma Yıldız",
    ownerEmail: "fatma@example.com",
    status: "expired",
    price: 199,
    currency: "TRY",
    billingCycle: "monthly",
    startDate: new Date("2024-06-22"),
    endDate: new Date("2024-10-28"),
    features: subscriptionPlans[0].features,
    limits: subscriptionPlans[0].limits,
    usage: {
      currentPlaces: 1,
      currentBlogs: 3,
      currentPhotos: 8,
      featuredListingsUsed: 0,
    },
    paymentMethod: {
      type: "credit_card",
      lastFour: "1234",
      brand: "visa",
      expiryMonth: 5,
      expiryYear: 2024,
    },
    paymentHistory: [
      {
        id: "pay_008",
        date: new Date("2024-09-22"),
        amount: 199,
        status: "failed",
      },
      {
        id: "pay_009",
        date: new Date("2024-08-22"),
        amount: 199,
        status: "success",
        invoiceId: "inv_009",
      },
      {
        id: "pay_010",
        date: new Date("2024-07-22"),
        amount: 199,
        status: "success",
        invoiceId: "inv_010",
      },
    ],
    createdAt: new Date("2024-06-22"),
    updatedAt: new Date("2024-10-28"),
  },
  {
    id: "5",
    planId: "enterprise",
    planName: "Kurumsal Paket",
    ownerId: "10",
    ownerName: "Murat Demir",
    ownerEmail: "murat@example.com",
    placeId: "4",
    placeName: "Dalyan Turtle Beach Tour",
    status: "active",
    price: 2999,
    currency: "TRY",
    billingCycle: "yearly",
    startDate: new Date("2024-04-05"),
    endDate: new Date("2025-04-05"),
    nextBillingDate: new Date("2025-04-05"),
    features: subscriptionPlans[3].features,
    limits: subscriptionPlans[3].limits,
    usage: {
      currentPlaces: 5,
      currentBlogs: 25,
      currentPhotos: 200,
      featuredListingsUsed: 3,
    },
    paymentMethod: {
      type: "credit_card",
      lastFour: "5678",
      brand: "amex",
      expiryMonth: 3,
      expiryYear: 2026,
    },
    paymentHistory: [
      {
        id: "pay_011",
        date: new Date("2024-04-05"),
        amount: 2999 * 12, // yearly payment
        status: "success",
        invoiceId: "inv_011",
      },
    ],
    createdAt: new Date("2024-04-05"),
    updatedAt: new Date("2024-11-05"),
  },
  {
    id: "6",
    planId: "basic",
    planName: "Temel Paket",
    ownerId: "8",
    ownerName: "Ali Vural",
    ownerEmail: "ali@example.com",
    status: "pending",
    price: 199,
    currency: "TRY",
    billingCycle: "monthly",
    startDate: new Date("2024-07-30"),
    endDate: new Date("2024-11-30"),
    features: subscriptionPlans[0].features,
    limits: subscriptionPlans[0].limits,
    usage: {
      currentPlaces: 0,
      currentBlogs: 0,
      currentPhotos: 0,
      featuredListingsUsed: 0,
    },
    paymentMethod: {
      type: "paypal",
    },
    paymentHistory: [
      {
        id: "pay_012",
        date: new Date("2024-07-30"),
        amount: 199,
        status: "pending",
      },
    ],
    createdAt: new Date("2024-07-30"),
    updatedAt: new Date("2024-11-30"),
  },
  {
    id: "7",
    planId: "premium",
    planName: "Premium Paket",
    ownerId: "1",
    ownerName: "Ahmet Yılmaz",
    ownerEmail: "ahmet@example.com",
    placeId: "6",
    placeName: "Bodrum Airport Transfer",
    status: "cancelled",
    price: 999,
    currency: "TRY",
    billingCycle: "monthly",
    startDate: new Date("2024-06-22"),
    endDate: new Date("2024-11-14"),
    cancelledAt: new Date("2024-11-01"),
    features: subscriptionPlans[2].features,
    limits: subscriptionPlans[2].limits,
    usage: {
      currentPlaces: 1,
      currentBlogs: 5,
      currentPhotos: 15,
      featuredListingsUsed: 0,
    },
    paymentMethod: {
      type: "credit_card",
      lastFour: "4242",
      brand: "visa",
      expiryMonth: 8,
      expiryYear: 2025,
    },
    paymentHistory: [
      {
        id: "pay_013",
        date: new Date("2024-10-22"),
        amount: 999,
        status: "success",
        invoiceId: "inv_013",
      },
      {
        id: "pay_014",
        date: new Date("2024-09-22"),
        amount: 999,
        status: "success",
        invoiceId: "inv_014",
      },
    ],
    createdAt: new Date("2024-06-22"),
    updatedAt: new Date("2024-11-14"),
  },
  {
    id: "8",
    planId: "basic",
    planName: "Temel Paket",
    ownerId: "12",
    ownerName: "Hüseyin Gül",
    ownerEmail: "huseyin@example.com",
    status: "trial",
    price: 0,
    currency: "TRY",
    billingCycle: "monthly",
    startDate: new Date("2024-11-10"),
    endDate: new Date("2024-11-24"),
    trialEndsAt: new Date("2024-11-24"),
    features: subscriptionPlans[0].features,
    limits: subscriptionPlans[0].limits,
    usage: {
      currentPlaces: 0,
      currentBlogs: 0,
      currentPhotos: 0,
      featuredListingsUsed: 0,
    },
    paymentMethod: {
      type: "credit_card",
      lastFour: "9999",
      brand: "visa",
      expiryMonth: 7,
      expiryYear: 2025,
    },
    paymentHistory: [],
    createdAt: new Date("2024-11-10"),
    updatedAt: new Date("2024-11-10"),
  }
]