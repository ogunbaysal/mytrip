export interface Place {
  id: string
  name: string
  type: "hotel" | "restaurant" | "cafe" | "activity" | "attraction" | "transport"
  category: string
  description: string
  address: string
  city: string
  district: string
  location: {
    lat: number
    lng: number
  }
  contact: {
    phone?: string
    email?: string
    website?: string
  }
  rating: number
  reviewCount: number
  priceLevel: "budget" | "moderate" | "expensive" | "luxury"
  features: string[]
  images: string[]
  status: "active" | "inactive" | "pending" | "suspended"
  verified: boolean
  featured: boolean
  ownerId: string
  ownerName: string
  ownerEmail: string
  createdAt: Date
  updatedAt: Date
  views: number
  bookingCount?: number
  openingHours: {
    [key: string]: string
  }
}

export const placeTypes = [
  { value: "all", label: "Tüm Türler" },
  { value: "hotel", label: "Otel" },
  { value: "restaurant", label: "Restoran" },
  { value: "cafe", label: "Kafe" },
  { value: "activity", label: "Aktivite" },
  { value: "attraction", label: "Gezilecek Yer" },
  { value: "transport", label: "Ulaşım" },
]

export const placeStatuses = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Pasif" },
  { value: "pending", label: "Beklemede" },
  { value: "suspended", label: "Askıya Alınmış" },
]

export const priceLevels = [
  { value: "all", label: "Tüm Fiyat Seviyeleri" },
  { value: "budget", label: "Ekonomik" },
  { value: "moderate", label: "Orta" },
  { value: "expensive", label: "Pahalı" },
  { value: "luxury", label: "Lüks" },
]

export const mockPlaces: Place[] = [
  {
    id: "1",
    name: "Bodrum Marina Hotel",
    type: "hotel",
    category: "Lüks Oteller",
    description: "Ege Denizi'nin incisi Bodrum'da, lüks ve konforlu konaklama deneyimi sunan 5 yıldızlı otel.",
    address: "Neyzen Tevfik Cd. No:123",
    city: "Muğla",
    district: "Bodrum",
    location: { lat: 37.0434, lng: 27.4287 },
    contact: {
      phone: "+90 252 123 4567",
      email: "info@bodrummarinahotel.com",
      website: "https://bodrummarinahotel.com"
    },
    rating: 4.8,
    reviewCount: 342,
    priceLevel: "luxury",
    features: ["WiFi", "Spa", "Havuz", "Restoran", "Bar", "Otopark", "Deniz Manzarası", "Plaj Erişimi"],
    images: ["/places/hotel1-1.jpg", "/places/hotel1-2.jpg", "/places/hotel1-3.jpg"],
    status: "active",
    verified: true,
    featured: true,
    ownerId: "1",
    ownerName: "Ahmet Yılmaz",
    ownerEmail: "ahmet@example.com",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-11-10"),
    views: 15420,
    bookingCount: 89,
    openingHours: {
      "Pazartesi": "24 saat",
      "Salı": "24 saat",
      "Çarşamba": "24 saat",
      "Perşembe": "24 saat",
      "Cuma": "24 saat",
      "Cumartesi": "24 saat",
      "Pazar": "24 saat"
    }
  },
  {
    id: "2",
    name: "Marmaris Yelken Cafe",
    type: "cafe",
    category: "Deniz Kafeleri",
    description: "Marmaris marinasında harika deniz manzarası ve kahve keyfi sunan modern kafe.",
    address: "Atatürk Cad. No:456",
    city: "Muğla",
    district: "Marmaris",
    location: { lat: 36.8503, lng: 28.2765 },
    contact: {
      phone: "+90 252 234 5678",
      email: "info@yelkencafe.com",
    },
    rating: 4.6,
    reviewCount: 189,
    priceLevel: "moderate",
    features: ["WiFi", "Deniz Manzarası", "Kahve", "Tatlılar", "Çalışma Alanı"],
    images: ["/places/cafe1-1.jpg", "/places/cafe1-2.jpg"],
    status: "active",
    verified: true,
    featured: false,
    ownerId: "2",
    ownerName: "Ayşe Demir",
    ownerEmail: "ayse@example.com",
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-11-12"),
    views: 8765,
    openingHours: {
      "Pazartesi": "08:00 - 22:00",
      "Salı": "08:00 - 22:00",
      "Çarşamba": "08:00 - 22:00",
      "Perşembe": "08:00 - 22:00",
      "Cuma": "08:00 - 23:00",
      "Cumartesi": "08:00 - 23:00",
      "Pazar": "08:00 - 22:00"
    }
  },
  {
    id: "3",
    name: "Fethiye Balık Restaurant",
    type: "restaurant",
    category: "Deniz Ürünleri",
    description: "Taze Ege deniz ürünleri ve özgün lezzetler sunan geleneksel balık restaurantı.",
    address: "Fevzi Çakmak Cd. No:789",
    city: "Muğla",
    district: "Fethiye",
    location: { lat: 36.6180, lng: 29.0993 },
    contact: {
      phone: "+90 252 345 6789",
      email: "reservation@fethiyebalik.com",
    },
    rating: 4.7,
    reviewCount: 267,
    priceLevel: "expensive",
    features: ["Taze Balık", "Deniz Manzarası", "Meyhane", "Müzik", "Otopark"],
    images: ["/places/restaurant1-1.jpg", "/places/restaurant1-2.jpg", "/places/restaurant1-3.jpg"],
    status: "active",
    verified: true,
    featured: true,
    ownerId: "4",
    ownerName: "Zeynep Çelik",
    ownerEmail: "zeynep@example.com",
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-11-08"),
    views: 12340,
    openingHours: {
      "Pazartesi": "11:00 - 23:00",
      "Salı": "11:00 - 23:00",
      "Çarşamba": "11:00 - 23:00",
      "Perşembe": "11:00 - 23:00",
      "Cuma": "11:00 - 00:00",
      "Cumartesi": "11:00 - 00:00",
      "Pazar": "11:00 - 23:00"
    }
  },
  {
    id: "4",
    name: "Dalyan Turtle Beach Tour",
    type: "activity",
    category: "Doğa Turları",
    description: "İztuzu Plajı'nda caretta caretta kaplumbağalarını görme ve doğa turu deneyimi.",
    address: "Dalyan Mahallesi, Ortaca",
    city: "Muğla",
    district: "Ortaca",
    location: { lat: 36.8346, lng: 28.6426 },
    contact: {
      phone: "+90 252 456 7890",
      email: "info@dalyantour.com",
    },
    rating: 4.9,
    reviewCount: 423,
    priceLevel: "moderate",
    features: ["Tekne Turu", "Kaplumbağa Gözlemi", "Plaj", "Rehber", "Fotoğraf"],
    images: ["/places/activity1-1.jpg", "/places/activity1-2.jpg", "/places/activity1-3.jpg"],
    status: "active",
    verified: true,
    featured: true,
    ownerId: "10",
    ownerName: "Murat Demir",
    ownerEmail: "murat@example.com",
    createdAt: new Date("2024-04-05"),
    updatedAt: new Date("2024-11-14"),
    views: 28900,
    bookingCount: 156,
    openingHours: {
      "Pazartesi": "09:00 - 18:00",
      "Salı": "09:00 - 18:00",
      "Çarşamba": "09:00 - 18:00",
      "Perşembe": "09:00 - 18:00",
      "Cuma": "09:00 - 18:00",
      "Cumartesi": "09:00 - 18:00",
      "Pazar": "09:00 - 18:00"
    }
  },
  {
    id: "5",
    name: "Kaunos Antik Kenti",
    type: "attraction",
    category: "Tarihi Yerler",
    description: "M.Ö. 9. yüzyılda kurulan antik Kaunos kentinin kalıntıları ve rock mezarları.",
    address: "Dalyan Mahallesi, Ortaca",
    city: "Muğla",
    district: "Ortaca",
    location: { lat: 36.8276, lng: 28.6408 },
    contact: {
      phone: "+90 252 567 8901",
    },
    rating: 4.5,
    reviewCount: 534,
    priceLevel: "budget",
    features: ["Tarihi Kalıntılar", "Kaya Mezarları", "Tiyatro", "Manzara", "Müze"],
    images: ["/places/attraction1-1.jpg", "/places/attraction1-2.jpg"],
    status: "active",
    verified: true,
    featured: false,
    ownerId: "2",
    ownerName: "Ayşe Demir",
    ownerEmail: "ayse@example.com",
    createdAt: new Date("2024-05-18"),
    updatedAt: new Date("2024-11-05"),
    views: 45670,
    openingHours: {
      "Pazartesi": "08:00 - 19:00",
      "Salı": "08:00 - 19:00",
      "Çarşamba": "08:00 - 19:00",
      "Perşembe": "08:00 - 19:00",
      "Cuma": "08:00 - 19:00",
      "Cumartesi": "08:00 - 19:00",
      "Pazar": "08:00 - 19:00"
    }
  },
  {
    id: "6",
    name: "Bodrum Airport Transfer",
    type: "transport",
    category: "Havaalanı Transferi",
    description: "Bodrum-Milas havaalanından tüm Muğla bölgelerine VIP transfer hizmeti.",
    address: "Bodrum-Milas Havalimanı, Muğla",
    city: "Muğla",
    district: "Milas",
    location: { lat: 37.2508, lng: 27.6672 },
    contact: {
      phone: "+90 252 678 9012",
      email: "info@bodrumtransfer.com",
    },
    rating: 4.4,
    reviewCount: 156,
    priceLevel: "moderate",
    features: ["VIP Araç", "7/24 Hizmet", "Deneyimli Şoför", "Uygun Fiyat"],
    images: ["/places/transport1-1.jpg"],
    status: "active",
    verified: true,
    featured: false,
    ownerId: "1",
    ownerName: "Ahmet Yılmaz",
    ownerEmail: "ahmet@example.com",
    createdAt: new Date("2024-06-22"),
    updatedAt: new Date("2024-11-13"),
    views: 9876,
    bookingCount: 234,
    openingHours: {
      "Pazartesi": "24 saat",
      "Salı": "24 saat",
      "Çarşamba": "24 saat",
      "Perşembe": "24 saat",
      "Cuma": "24 saat",
      "Cumartesi": "24 saat",
      "Pazar": "24 saat"
    }
  },
  {
    id: "7",
    name: "Ölüdeniz Beach Club",
    type: "activity",
    category: "Plaj Aktiviteleri",
    description: "Ölüdeniz'in mavi sularında su sporları ve plaj eğlencesi sunan beach club.",
    address: "Ölüdeniz Mahallesi, Fethiye",
    city: "Muğla",
    district: "Fethiye",
    location: { lat: 36.5645, lng: 29.1287 },
    contact: {
      phone: "+90 252 789 0123",
      email: "info@oludenizbeach.com",
    },
    rating: 4.8,
    reviewCount: 612,
    priceLevel: "expensive",
    features: ["Şezlong", "Şemsiye", "Bar", "Restoran", "Duş", "Spor Aktiviteleri"],
    images: ["/places/activity2-1.jpg", "/places/activity2-2.jpg"],
    status: "active",
    verified: true,
    featured: true,
    ownerId: "10",
    ownerName: "Murat Demir",
    ownerEmail: "murat@example.com",
    createdAt: new Date("2024-07-30"),
    updatedAt: new Date("2024-11-14"),
    views: 54320,
    bookingCount: 189,
    openingHours: {
      "Pazartesi": "09:00 - 19:00",
      "Salı": "09:00 - 19:00",
      "Çarşamba": "09:00 - 19:00",
      "Perşembe": "09:00 - 19:00",
      "Cuma": "09:00 - 20:00",
      "Cumartesi": "09:00 - 20:00",
      "Pazar": "09:00 - 19:00"
    }
  },
  {
    id: "8",
    name: "Saklıkent Kanyon",
    type: "attraction",
    category: "Doğal Güzellikler",
    description: "Türkiye'nin en uzun kanyonu, doğa yürüyüşü ve soğuk su keyfi.",
    address: "Saklıkent Mahallesi, Seydikemer",
    city: "Muğla",
    district: "Seydikemer",
    location: { lat: 36.7778, lng: 29.3917 },
    contact: {
      phone: "+90 252 890 1234",
    },
    rating: 4.6,
    reviewCount: 789,
    priceLevel: "budget",
    features: ["Kanyon Yürüyüşü", "Soğuk Su", "Restoran", "Manzara", "Fotoğraf"],
    images: ["/places/attraction2-1.jpg", "/places/attraction2-2.jpg", "/places/attraction2-3.jpg"],
    status: "active",
    verified: true,
    featured: false,
    ownerId: "4",
    ownerName: "Zeynep Çelik",
    ownerEmail: "zeynep@example.com",
    createdAt: new Date("2024-08-12"),
    updatedAt: new Date("2024-11-10"),
    views: 67890,
    openingHours: {
      "Pazartesi": "09:00 - 18:00",
      "Salı": "09:00 - 18:00",
      "Çarşamba": "09:00 - 18:00",
      "Perşembe": "09:00 - 18:00",
      "Cuma": "09:00 - 18:00",
      "Cumartesi": "09:00 - 18:00",
      "Pazar": "09:00 - 18:00"
    }
  },
  {
    id: "9",
    name: "Gümüşlük Jazz Bar",
    type: "cafe",
    category: "Canlı Müzik",
    description: "Gümüşlük'te jazz müziği ve deniz manzarası eşliğinde akşam keyfi.",
    address: "Kadirga Cd. No:234",
    city: "Muğla",
    district: "Bodrum",
    location: { lat: 37.0379, lng: 27.2482 },
    contact: {
      phone: "+90 252 901 2345",
      email: "info@gumuslukjazz.com",
    },
    rating: 4.7,
    reviewCount: 198,
    priceLevel: "expensive",
    features: ["Canlı Müzik", "Deniz Manzarası", "Cocktail", "Atıştırmalıklar", "WiFi"],
    images: ["/places/cafe2-1.jpg", "/places/cafe2-2.jpg"],
    status: "pending",
    verified: false,
    featured: false,
    ownerId: "7",
    ownerName: "Fatma Yıldız",
    ownerEmail: "fatma@example.com",
    createdAt: new Date("2024-09-05"),
    updatedAt: new Date("2024-11-01"),
    views: 3456,
    openingHours: {
      "Pazartesi": "18:00 - 02:00",
      "Salı": "18:00 - 02:00",
      "Çarşamba": "18:00 - 02:00",
      "Perşembe": "18:00 - 02:00",
      "Cuma": "18:00 - 03:00",
      "Cumartesi": "18:00 - 03:00",
      "Pazar": "18:00 - 02:00"
    }
  },
  {
    id: "10",
    name: "Marmaris Grand Bazaar",
    type: "attraction",
    category: "Alışveriş",
    description: "Geleneksel Türk çarşı deneyimi, yerel ürünler ve hediyelik eşya satışı.",
    address: "Cumhuriyet Cd. No:567",
    city: "Muğla",
    district: "Marmaris",
    location: { lat: 36.8503, lng: 28.2765 },
    contact: {
      phone: "+90 252 012 3456",
    },
    rating: 4.2,
    reviewCount: 445,
    priceLevel: "budget",
    features: ["Geleneksel Çarşı", "Yerel Ürünler", "Hediyelik Eşya", "Pazarlık", "WiFi"],
    images: ["/places/attraction3-1.jpg", "/places/attraction3-2.jpg"],
    status: "inactive",
    verified: false,
    featured: false,
    ownerId: "8",
    ownerName: "Ali Vural",
    ownerEmail: "ali@example.com",
    createdAt: new Date("2024-10-10"),
    updatedAt: new Date("2024-11-01"),
    views: 23456,
    openingHours: {
      "Pazartesi": "09:00 - 21:00",
      "Salı": "09:00 - 21:00",
      "Çarşamba": "09:00 - 21:00",
      "Perşembe": "09:00 - 21:00",
      "Cuma": "09:00 - 21:00",
      "Cumartesi": "09:00 - 21:00",
      "Pazar": "10:00 - 20:00"
    }
  }
]