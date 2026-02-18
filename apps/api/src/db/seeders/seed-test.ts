/**
 * Test Data Seeder
 *
 * Seeds test/demo data for development and testing environments:
 * - Test users (business owners and travelers)
 * - Sample places (hotels, restaurants, cafes, etc.)
 * - Sample blog posts
 * - Sample collections/guides
 *
 * IMPORTANT: This seeder should NOT be run in production!
 *
 * Usage: bun run db:seed:test
 */

import { db } from "../index.ts";
import { nanoid } from "nanoid";
import { eq, sql } from "drizzle-orm";
import { replacePlaceAmenities } from "../../lib/place-relations.ts";

// Schemas
import { user } from "../schemas/auth.ts";
import {
  blog,
  blogCategory,
  blogImage,
  file,
  place,
  placeKind,
  placeImage,
} from "../schemas/index.ts";
import { collection } from "../schemas/collections.ts";
import { province, district } from "../schemas/locations.ts";
import { subscription, subscriptionPlan } from "../schemas/subscriptions.ts";

// ============================================================================
// HELPER UTILITIES
// ============================================================================

const random = <T>(arr: readonly T[] | T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number): string =>
  (Math.random() * (max - min) + min).toFixed(2);
const randomSubset = <T>(arr: readonly T[] | T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

const slugify = (text: string): string => {
  const turkishMap: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "c",
    Ğ: "g",
    İ: "i",
    Ö: "o",
    Ş: "s",
    Ü: "u",
  };
  return text
    .split("")
    .map((char) => turkishMap[char] || char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

const logSection = (title: string): void => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("=".repeat(60));
};

const logSuccess = (message: string): void => {
  console.log(`  ✅ ${message}`);
};

const logInfo = (message: string): void => {
  console.log(`  ℹ️  ${message}`);
};

// ============================================================================
// TEST DATA DEFINITIONS
// ============================================================================

// Muğla-focused test data - all locations within Muğla province
const MUGLA_DISTRICTS = [
  {
    name: "Bodrum",
    neighborhoods: [
      "Yalıkavak",
      "Türkbükü",
      "Gümüşlük",
      "Torba",
      "Bitez",
      "Gümbet",
      "Ortakent",
    ],
  },
  {
    name: "Marmaris",
    neighborhoods: [
      "Selimiye",
      "Bozburun",
      "Hisarönü",
      "İçmeler",
      "Turunç",
      "Söğüt",
    ],
  },
  {
    name: "Fethiye",
    neighborhoods: [
      "Ölüdeniz",
      "Faralya",
      "Kayaköy",
      "Göcek",
      "Kabak",
      "Hisarönü",
      "Çalış",
    ],
  },
  {
    name: "Datça",
    neighborhoods: [
      "Eski Datça",
      "Palamutbükü",
      "Kargı Koyu",
      "Mesudiye",
      "Knidos",
    ],
  },
  {
    name: "Köyceğiz",
    neighborhoods: ["Dalyan", "İztuzu", "Sultaniye", "Ekincik"],
  },
  { name: "Milas", neighborhoods: ["Güllük", "Ören"] },
  { name: "Muğla Merkez", neighborhoods: ["Ula", "Saburhane", "Yeşilyurt"] },
] as const;

const TEST_USERS = [
  {
    name: "Mehmet Yılmaz",
    email: "mehmet@demo.com",
    role: "owner" as const,
    bio: "Bodrum'da 15 yıldır turizm sektöründe",
  },
  {
    name: "Ayşe Kaya",
    email: "ayse@demo.com",
    role: "owner" as const,
    bio: "Fethiye'nin en iyi restoranlarının sahibi",
  },
  {
    name: "Can Demir",
    email: "can@demo.com",
    role: "owner" as const,
    bio: "Marmaris'te butik otel işletmecisi",
  },
  {
    name: "Zeynep Çelik",
    email: "zeynep@demo.com",
    role: "traveler" as const,
    bio: "Gezi bloggerı ve fotoğrafçı",
  },
  {
    name: "Emre Öztürk",
    email: "emre@demo.com",
    role: "traveler" as const,
    bio: "Doğa ve macera tutkunu",
  },
] as const;

const FEATURES = {
  hotel: [
    "Wifi",
    "Havuz",
    "Otopark",
    "Klima",
    "Restoran",
    "Deniz Manzarası",
    "Spa",
    "Spor Salonu",
    "Kahvaltı Dahil",
    "Özel Plaj",
    "Bar",
    "Oda Servisi",
    "Çamaşırhane",
    "Concierge",
  ],
  restaurant: [
    "Wifi",
    "Otopark",
    "Klima",
    "Deniz Manzarası",
    "Teras",
    "Canlı Müzik",
    "Özel Bölüm",
    "Çocuk Dostu",
    "Vejetaryen Seçenekleri",
    "Alkollü İçecek",
  ],
  cafe: [
    "Wifi",
    "Klima",
    "Teras",
    "Deniz Manzarası",
    "Çalışma Alanı",
    "Kahvaltı",
    "Tatlılar",
    "Ev Yapımı",
  ],
  activity: [
    "Profesyonel Rehber",
    "Ekipman Dahil",
    "Transfer",
    "Sigorta",
    "Fotoğraf Servisi",
    "Yemek Dahil",
  ],
};

const IMAGES = {
  hotel: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80",
  ],
  cafe: [
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
  ],
  activity: [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=800&q=80",
  ],
  nature: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
  ],
};

const PLACE_TEMPLATES = {
  hotel: [
    { prefix: "Grand", suffix: "Hotel", priceRange: [2000, 5000] },
    { prefix: "Boutique", suffix: "Otel", priceRange: [1500, 3500] },
    { prefix: "Luxury", suffix: "Resort", priceRange: [3000, 8000] },
    { prefix: "Blue", suffix: "Suites", priceRange: [1000, 2500] },
    { prefix: "Vista", suffix: "Palace", priceRange: [2500, 6000] },
    { prefix: "Panorama", suffix: "Beach Hotel", priceRange: [1800, 4000] },
  ],
  restaurant: [
    { prefix: "Balık", suffix: "Restaurant", priceRange: [200, 500] },
    { prefix: "Deniz", suffix: "Lokantası", priceRange: [150, 400] },
    { prefix: "Akdeniz", suffix: "Mutfağı", priceRange: [180, 450] },
    { prefix: "Ege", suffix: "Sofrası", priceRange: [120, 350] },
    { prefix: "Lezzet", suffix: "Durağı", priceRange: [100, 250] },
  ],
  cafe: [
    { prefix: "Kahve", suffix: "Dükkanı", priceRange: [50, 150] },
    { prefix: "Sunset", suffix: "Cafe", priceRange: [60, 180] },
    { prefix: "Garden", suffix: "Coffee", priceRange: [40, 120] },
    { prefix: "Beach", suffix: "Bar & Cafe", priceRange: [80, 200] },
  ],
  activity: [
    { prefix: "Blue", suffix: "Diving Center", priceRange: [500, 1500] },
    { prefix: "Adventure", suffix: "Tours", priceRange: [300, 800] },
    { prefix: "Aegean", suffix: "Boat Tours", priceRange: [400, 1200] },
    { prefix: "Sky", suffix: "Paragliding", priceRange: [600, 1800] },
  ],
};

const BLOG_TOPICS = [
  {
    title: "Muğla'nın En Güzel 10 Koyu",
    category: "travel" as const,
    excerpt:
      "Turkuaz suları ve bakir doğasıyla Muğla'nın keşfedilmeyi bekleyen gizli koylarını sizler için derledik.",
    tags: ["koylar", "deniz", "muğla", "gezi"],
  },
  {
    title: "Bodrum'da Bir Hafta Sonu Rehberi",
    category: "travel" as const,
    excerpt:
      "Bodrum'un tarihi sokaklarından beach club'larına, en iyi hafta sonu rotasını sizinle paylaşıyoruz.",
    tags: ["bodrum", "gezi", "hafta sonu", "tatil"],
  },
  {
    title: "Fethiye'nin Saklı Cennetleri",
    category: "travel" as const,
    excerpt:
      "Ölüdeniz'den Kabak'a, Fethiye'nin el değmemiş doğal güzelliklerini keşfedin.",
    tags: ["fethiye", "ölüdeniz", "doğa", "plaj"],
  },
  {
    title: "Datça'da Nerede Ne Yenir?",
    category: "food" as const,
    excerpt:
      "Badem ezmesinden taze balığa, Datça'nın eşsiz lezzetlerini keşfetmeye hazır mısınız?",
    tags: ["datça", "yemek", "lezzet", "restoran"],
  },
  {
    title: "Mavi Yolculuk: Kaptan Rehberi",
    category: "activity" as const,
    excerpt:
      "Mavi yolculuğa çıkmadan önce bilmeniz gereken her şey bu rehberde.",
    tags: ["mavi yolculuk", "tekne", "deniz", "macera"],
  },
  {
    title: "Likya Yolu Yürüyüş Rehberi",
    category: "activity" as const,
    excerpt:
      "Dünyanın en güzel 10 uzun mesafe yürüyüş rotasından biri olan Likya Yolu'nu keşfedin.",
    tags: ["likya yolu", "trekking", "yürüyüş", "doğa"],
  },
  {
    title: "Dalyan'da Caretta Carettalarla Tanışma",
    category: "culture" as const,
    excerpt:
      "İztuzu Plajı'nın koruma altındaki misafirleri hakkında bilmeniz gerekenler.",
    tags: ["dalyan", "caretta", "doğa", "koruma"],
  },
  {
    title: "Muğla'nın Antik Kentleri",
    category: "history" as const,
    excerpt: "Knidos'tan Kaunos'a, bölgenin zengin tarihini keşfedin.",
    tags: ["antik kent", "tarih", "arkeoloji", "kültür"],
  },
  {
    title: "Yalıkavak'ta Yaşam",
    category: "lifestyle" as const,
    excerpt: "Balıkçı köyünden jet-set destinasyonuna: Yalıkavak'ın dönüşümü.",
    tags: ["yalıkavak", "bodrum", "yaşam tarzı", "marina"],
  },
  {
    title: "Muğla'da İşletme Açmak",
    category: "business" as const,
    excerpt: "Turizm sektöründe girişimciler için Muğla rehberi.",
    tags: ["iş", "girişimcilik", "turizm", "muğla"],
  },
];

const COLLECTION_TEMPLATES = [
  {
    name: "Bodrum'un En İyi Beach Club'ları",
    slug: "bodrum-beach-clubs",
    description:
      "Bodrum'un masmavi denizinin ve eğlenceli plaj partilerinin tadını çıkarın.",
    intro: "Bodrum'un en popüler beach club'larını sizin için derledik.",
    season: "Yaz (Haziran-Eylül)",
    duration: "3 Gün",
    bestFor: ["Eğlence", "Deniz", "Çiftler"],
    highlights: [
      {
        title: "Mavi Bayraklı Plajlar",
        description: "Kristal berraklığında sular",
      },
      {
        title: "DJ Performansları",
        description: "Ünlü DJ'ler ile gün batımı partileri",
      },
      { title: "Lüks Hizmet", description: "VIP localar ve özel servis" },
    ],
    itinerary: [
      {
        day: "1. Gün",
        title: "Türkbükü",
        description: "Güne Maça Kızı'nda kahvaltı ile başlayın",
      },
      {
        day: "2. Gün",
        title: "Yalıkavak",
        description: "Xuma Beach'te gün boyu eğlence",
      },
      {
        day: "3. Gün",
        title: "Gümüşlük",
        description: "Mimoza'da gün batımı yemeği",
      },
    ],
    tips: [
      "Rezervasyon yaptırmayı unutmayın",
      "Güneş kreminizi alın",
      "Akşam kıyafeti getirin",
    ],
  },
  {
    name: "Datça'da Huzurlu Kaçamak",
    slug: "datca-huzur",
    description:
      "Doğa ile iç içe, sakin ve huzurlu bir tatil için Datça'yı keşfedin.",
    intro: "Datça'nın bakir koylarında ruhunuzu dinlendirin.",
    season: "İlkbahar-Sonbahar",
    duration: "4 Gün",
    bestFor: ["Doğa", "Huzur", "Çiftler"],
    highlights: [
      { title: "Knidos Antik Kenti", description: "Tarihin izinde bir gün" },
      { title: "Palamutbükü", description: "Tertemiz bir deniz" },
      { title: "Eski Datça", description: "Taş evler ve begonyalar" },
    ],
    itinerary: [
      {
        day: "1. Gün",
        title: "Eski Datça",
        description: "Can Yücel'in evini ziyaret",
      },
      { day: "2. Gün", title: "Palamutbükü", description: "Deniz keyfi" },
      {
        day: "3. Gün",
        title: "Knidos",
        description: "Gün batımında antik kent",
      },
      {
        day: "4. Gün",
        title: "Kargı Koyu",
        description: "Doğa yürüyüşü ve deniz",
      },
    ],
    tips: [
      "Badem ezmesi almayı unutmayın",
      "Nakit bulundurun",
      "Araç kiralayın",
    ],
  },
  {
    name: "Fethiye Mavi Yolculuk",
    slug: "fethiye-mavi-yolculuk",
    description: "Fethiye körfezinin eşsiz güzelliklerini tekne ile keşfedin.",
    intro: "Koy koy gezerek denizin tadını çıkarın.",
    season: "Yaz (Mayıs-Ekim)",
    duration: "1 Hafta",
    bestFor: ["Deniz", "Macera", "Gruplar"],
    highlights: [
      { title: "Kelebekler Vadisi", description: "Doğal bir cennet" },
      { title: "Ölüdeniz", description: "Dünyaca ünlü plaj" },
      { title: "12 Adalar", description: "Tekne turunun vazgeçilmezi" },
    ],
    itinerary: [
      {
        day: "1. Gün",
        title: "Fethiye Limanı",
        description: "Tekneye yerleşme",
      },
      {
        day: "2. Gün",
        title: "Ölüdeniz",
        description: "Yamaç paraşütü imkanı",
      },
      {
        day: "3. Gün",
        title: "Kelebekler Vadisi",
        description: "Vadide yürüyüş",
      },
    ],
    tips: [
      "Deniz tutmasına karşı hazırlıklı olun",
      "Su altı kameranızı getirin",
      "Erken rezervasyon yapın",
    ],
  },
];

// ============================================================================
// SEEDER FUNCTIONS
// ============================================================================

async function seedTestUsers(): Promise<Map<string, string>> {
  logSection("Seeding Test Users");

  const userMap = new Map<string, string>();

  for (const testUser of TEST_USERS) {
    const existing = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });

    if (existing) {
      userMap.set(testUser.email, existing.id);
      logInfo(`User "${testUser.email}" already exists`);
      continue;
    }

    const id = nanoid();
    await db.insert(user).values({
      id,
      name: testUser.name,
      email: testUser.email,
      role: testUser.role,
      bio: testUser.bio,
      status: "active",
    });

    userMap.set(testUser.email, id);
    logSuccess(`Created user: ${testUser.name} (${testUser.role})`);
  }

  return userMap;
}

async function seedTestSubscriptions(
  userMap: Map<string, string>,
): Promise<void> {
  logSection("Seeding Test Subscriptions");

  // Get standard yearly plan for owners
  const standardPlan = await db.query.subscriptionPlan.findFirst({
    where: eq(subscriptionPlan.id, "plan-standard-yearly"),
  });

  if (!standardPlan) {
    logInfo("No subscription plans found, skipping subscriptions");
    return;
  }

  for (const testUser of TEST_USERS.filter((u) => u.role === "owner")) {
    const userId = userMap.get(testUser.email);
    if (!userId) continue;

    // Check if subscription exists
    const existing = await db.query.subscription.findFirst({
      where: eq(subscription.userId, userId),
    });

    if (existing) {
      logInfo(`Subscription for "${testUser.email}" already exists`);
      continue;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    await db.insert(subscription).values({
      id: nanoid(),
      userId,
      planId: standardPlan.id,
      status: "active",
      provider: "mock",
      basePrice: standardPlan.price,
      discountAmount: "0",
      price: standardPlan.price,
      currency: "TRY",
      billingCycle: standardPlan.billingCycle,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      nextBillingDate: endDate.toISOString().split("T")[0],
    });

    logSuccess(`Created subscription for: ${testUser.name}`);
  }
}

async function seedTestPlaces(userMap: Map<string, string>): Promise<string[]> {
  logSection("Seeding Test Places (50 places)");

  // Get categories
  const categories = await db.select().from(placeKind);
  if (categories.length === 0) {
    logInfo("No categories found, run seed-core first");
    return [];
  }

  const categoryMap = new Map(categories.map((c) => [c.slug, c]));
  const [muglaProvince] = await db
    .select({ id: province.id })
    .from(province)
    .where(eq(province.name, "Muğla"))
    .limit(1);

  if (!muglaProvince) {
    logInfo('Muğla province not found, run "db:seed:core" first');
    return [];
  }

  const provinceDistricts = await db
    .select({ id: district.id, name: district.name })
    .from(district)
    .where(eq(district.provinceId, muglaProvince.id));

  const districtMap = new Map(
    provinceDistricts.map((d) => [slugify(d.name), d.id]),
  );

  const ownerIds = TEST_USERS.filter((u) => u.role === "owner")
    .map((u) => userMap.get(u.email))
    .filter(Boolean) as string[];

  const existingSeedPlaces = await db
    .select({ id: place.id })
    .from(place)
    .where(sql`${place.slug} LIKE 'seed-place-%'`);
  if (existingSeedPlaces.length > 0) {
    logInfo(
      `Found ${existingSeedPlaces.length} existing deterministic seed places, skipping`,
    );
    return existingSeedPlaces.map((item) => item.id);
  }

  const placeIds: string[] = [];
  const placesToCreate = 50;

  const typeMapping: Record<string, string[]> = {
    hotel: ["hotels", "villas", "guesthouses", "apart-hotels"],
    restaurant: ["restaurants"],
    cafe: ["cafes", "bars", "beach-clubs"],
    activity: ["activities", "attractions", "nature-beaches", "spa-wellness"],
  };

  for (let i = 0; i < placesToCreate; i++) {
    const placeType = random([
      "hotel",
      "restaurant",
      "cafe",
      "activity",
    ]) as keyof typeof PLACE_TEMPLATES;
    const template = random(PLACE_TEMPLATES[placeType]);
    const districtData = random(MUGLA_DISTRICTS);
    const neighborhood = random(districtData.neighborhoods);
    const districtId = districtMap.get(slugify(districtData.name));
    if (!districtId) {
      continue;
    }

    // Select appropriate category
    const categorySlug = random(typeMapping[placeType]);
    const category = categoryMap.get(categorySlug);

    const name = `${template.prefix} ${neighborhood} ${template.suffix}`;
    const slug = `seed-place-${String(i + 1).padStart(3, "0")}`;

    // Check if slug exists
    const existing = await db.query.place.findFirst({
      where: eq(place.slug, slug),
    });

    if (existing) {
      placeIds.push(existing.id);
      continue;
    }

    const lat = 36.5 + Math.random() * 0.8; // Muğla area
    const lng = 27.5 + Math.random() * 1.2;

    const typeFeatures =
      FEATURES[placeType as keyof typeof FEATURES] || FEATURES.hotel;
    const typeImages = IMAGES[placeType as keyof typeof IMAGES] || IMAGES.hotel;

    const id = nanoid();

    await db.insert(place).values({
      id,
      slug,
      name,
      categoryId: category?.id,
      description: `${name}, ${districtData.name} bölgesinin en gözde mekanlarından biridir. ${neighborhood}'da yer alan bu işletme, eşsiz konumu ve kaliteli hizmetiyle öne çıkıyor. ${randomSubset(typeFeatures, 4).join(", ")} gibi olanaklarıyla konforlu bir deneyim sunuyoruz.`,
      shortDescription: `${districtData.name}, ${neighborhood} bölgesinde eşsiz bir deneyim.`,
      address: `${neighborhood} Mah. Atatürk Cad. No:${randomInt(1, 150)}, ${districtData.name}, Muğla`,
      cityId: muglaProvince.id,
      districtId,
      location: JSON.stringify({ lat: lat.toFixed(6), lng: lng.toFixed(6) }),
      contactInfo: JSON.stringify({
        phone: `+90 252 ${randomInt(100, 999)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
        email: `info@${slugify(name).substring(0, 15)}.com`,
        website: `https://www.${slugify(name).substring(0, 15)}.com`,
      }),
      rating: randomFloat(3.8, 5.0),
      reviewCount: randomInt(15, 500),
      priceLevel: random(["budget", "moderate", "expensive", "luxury"]) as any,
      nightlyPrice: randomInt(
        template.priceRange[0],
        template.priceRange[1],
      ).toString(),
      status: random(["active", "active", "active", "pending"]) as any, // Mostly active
      verified: Math.random() > 0.3,
      featured: Math.random() > 0.85,
      ownerId: random(ownerIds),
      views: randomInt(100, 5000),
      bookingCount: randomInt(5, 200),
      openingHours: JSON.stringify({
        monday: "09:00-23:00",
        tuesday: "09:00-23:00",
        wednesday: "09:00-23:00",
        thursday: "09:00-23:00",
        friday: "09:00-24:00",
        saturday: "09:00-24:00",
        sunday: "10:00-22:00",
      }),
    });

    const placeFeatures = randomSubset(typeFeatures, randomInt(5, 10));
    await replacePlaceAmenities(id, placeFeatures);

    const imageUrls = randomSubset(typeImages, randomInt(3, 5));
    const imageFiles = imageUrls.map((url, idx) => ({
      id: nanoid(),
      filename: `seed-place-${id}-${idx + 1}.jpg`,
      storedFilename: `seed-place-${id}-${idx + 1}-${nanoid(6)}.jpg`,
      url,
      mimeType: "image/jpeg",
      size: 0,
      type: "image" as const,
      usage: "place_image" as const,
      uploadedById: random(ownerIds),
    }));

    if (imageFiles.length > 0) {
      await db.insert(file).values(imageFiles);
      await db.insert(placeImage).values(
        imageFiles.map((img, idx) => ({
          placeId: id,
          fileId: img.id,
          sortOrder: idx,
        })),
      );
    }

    placeIds.push(id);
  }

  logSuccess(`Prepared ${placeIds.length} deterministic places`);
  return placeIds;
}

async function seedTestBlogs(userMap: Map<string, string>): Promise<void> {
  logSection("Seeding Test Blog Posts");

  const authorIds = Array.from(userMap.values());
  const categories = await db
    .select({ id: blogCategory.id, slug: blogCategory.slug })
    .from(blogCategory)
    .where(eq(blogCategory.active, true));
  const categoryBySlug = new Map(categories.map((item) => [item.slug, item.id]));

  for (const topic of BLOG_TOPICS) {
    const slug = `seed-blog-${slugify(topic.title)}`;

    // Check if exists
    const existing = await db.query.blog.findFirst({
      where: eq(blog.slug, slug),
    });

    if (existing) {
      logInfo(`Blog "${topic.title}" already exists`);
      continue;
    }

    const categoryId = categoryBySlug.get(topic.category) ?? null;
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - randomInt(1, 90));

    const blogId = nanoid();

    const heroFileId = nanoid();
    const featuredFileId = nanoid();
    const galleryImages = randomSubset(IMAGES.nature, 3);
    const galleryFileRows = galleryImages.map((url, idx) => ({
      id: nanoid(),
      filename: `seed-blog-${blogId}-gallery-${idx + 1}.jpg`,
      storedFilename: `seed-blog-${blogId}-gallery-${idx + 1}-${nanoid(6)}.jpg`,
      url,
      mimeType: "image/jpeg",
      size: 0,
      type: "image" as const,
      usage: "blog_content" as const,
      uploadedById: random(authorIds),
    }));

    await db.insert(file).values([
      {
        id: heroFileId,
        filename: `seed-blog-${blogId}-hero.jpg`,
        storedFilename: `seed-blog-${blogId}-hero-${nanoid(6)}.jpg`,
        url: random(IMAGES.nature),
        mimeType: "image/jpeg",
        size: 0,
        type: "image" as const,
        usage: "blog_hero" as const,
        uploadedById: random(authorIds),
      },
      {
        id: featuredFileId,
        filename: `seed-blog-${blogId}-featured.jpg`,
        storedFilename: `seed-blog-${blogId}-featured-${nanoid(6)}.jpg`,
        url: random(IMAGES.nature),
        mimeType: "image/jpeg",
        size: 0,
        type: "image" as const,
        usage: "blog_featured" as const,
        uploadedById: random(authorIds),
      },
      ...galleryFileRows,
    ]);

    await db.insert(blog).values({
      id: blogId,
      slug,
      title: topic.title,
      excerpt: topic.excerpt,
      content: `<h2>${topic.title}</h2><p>${topic.excerpt}</p><p>Bu yazıda ${topic.tags.join(", ")} konularını detaylı olarak ele alacağız. Muğla bölgesinin eşsiz güzellikleri ve keşfedilmeyi bekleyen hazineleri hakkında bilmeniz gereken her şeyi bu rehberde bulabilirsiniz.</p><h3>Neden Muğla?</h3><p>Muğla, Türkiye'nin güneybatısında yer alan, doğal güzellikleri, tarihi zenginlikleri ve eşsiz mutfağıyla öne çıkan bir il. Bodrum'un canlı gece hayatından Datça'nın huzurlu koylarına, Fethiye'nin paraşüt turlarından Marmaris'in tekne gezilerine kadar her zevke hitap eden aktiviteler sunuyor.</p>`,
      heroImageId: heroFileId,
      featuredImageId: featuredFileId,
      categoryId,
      tags: JSON.stringify(topic.tags),
      status: "published",
      featured: Math.random() > 0.7,
      authorId: random(authorIds),
      publishedAt,
      views: randomInt(50, 3000),
      readTime: randomInt(3, 12),
      likeCount: randomInt(5, 150),
      shareCount: randomInt(0, 25),
      language: "tr",
      seoTitle: topic.title,
      seoDescription: topic.excerpt,
      seoKeywords: JSON.stringify(topic.tags),
    });

    await db.insert(blogImage).values(
      galleryFileRows.map((item, idx) => ({
        blogId,
        fileId: item.id,
        sortOrder: idx,
      })),
    );

    logSuccess(`Created blog: ${topic.title}`);
  }
}

async function seedTestCollections(placeIds: string[]): Promise<void> {
  logSection("Seeding Test Collections");

  if (placeIds.length === 0) {
    logInfo("No places available for collections");
    return;
  }

  for (const template of COLLECTION_TEMPLATES) {
    // Check if exists
    const existing = await db.query.collection.findFirst({
      where: eq(collection.slug, template.slug),
    });

    if (existing) {
      logInfo(`Collection "${template.name}" already exists`);
      continue;
    }

    const featuredPlaces = randomSubset(placeIds, randomInt(4, 8));

    await db.insert(collection).values({
      id: nanoid(),
      slug: template.slug,
      name: template.name,
      description: template.description,
      intro: template.intro,
      coverImage: random(IMAGES.nature),
      heroImage: random(IMAGES.nature),
      season: template.season,
      duration: template.duration,
      bestFor: JSON.stringify(template.bestFor),
      highlights: JSON.stringify(template.highlights),
      itinerary: JSON.stringify(template.itinerary),
      tips: JSON.stringify(template.tips),
      featuredPlaces: JSON.stringify(featuredPlaces),
      itemCount: featuredPlaces.length,
      status: "published",
    });

    logSuccess(`Created collection: ${template.name}`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  console.log("\n🧪 Starting Test Data Seeder...");
  console.log("   ⚠️  This seeds demo/test data - DO NOT run in production!\n");

  const startTime = Date.now();

  try {
    // 1. Create test users
    const userMap = await seedTestUsers();

    // 2. Create subscriptions for owners
    await seedTestSubscriptions(userMap);

    // 3. Create test places
    const placeIds = await seedTestPlaces(userMap);

    // 4. Create test blogs
    await seedTestBlogs(userMap);

    // 5. Create test collections
    await seedTestCollections(placeIds);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    logSection("Test Data Seeding Complete");
    console.log(`\n  ⏱️  Completed in ${elapsed}s`);
    console.log("\n  Summary:");
    console.log(`    • ${TEST_USERS.length} test users`);
    console.log(
      `    • ${TEST_USERS.filter((u) => u.role === "owner").length} subscriptions`,
    );
    console.log(`    • ${placeIds.length} places`);
    console.log(`    • ${BLOG_TOPICS.length} blog posts`);
    console.log(`    • ${COLLECTION_TEMPLATES.length} collections`);
    console.log("");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
