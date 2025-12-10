import { db } from "../index";
import { place, placeCategory, user, blogPost, collection } from "../schemas";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

// Helper for random selection
const random = <T>(arr: readonly T[] | T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(2);
const randomSubset = <T>(arr: readonly T[] | T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// ============================================================================
// DATA SETS
// ============================================================================

const CATEGORIES = [
  { name: "Oteller", slug: "hotels", icon: "hotel", type: "hotel", description: "Lüks oteller ve butik konaklamalar" },
  { name: "Villalar", slug: "villas", icon: "home", type: "hotel", description: "Özel havuzlu ve manzaralı villalar" },
  { name: "Eğlence Mekanları", slug: "entertainment", icon: "attractions", type: "activity", description: "Gece kulüpleri ve barlar" },
  { name: "Restoranlar", slug: "restaurants", icon: "restaurant", type: "restaurant", description: "Yerel lezzetler ve dünya mutfağı" },
  { name: "Kafeler", slug: "cafes", icon: "local_cafe", type: "cafe", description: "Kahve dükkanları ve pastaneler" },
  { name: "Gezilecek Yerler", slug: "attractions", icon: "place", type: "attraction", description: "Tarihi ve turistik yerler" }
] as const;

const NEIGHBORHOODS = [
  { city: "Muğla", district: "Bodrum", neighborhoods: ["Yalıkavak", "Türkbükü", "Gümüşlük", "Torba", "Bitez"] },
  { city: "Muğla", district: "Marmaris", neighborhoods: ["Selimiye", "Bozburun", "Hisarönü", "Söğüt", "Datça"] },
  { city: "Muğla", district: "Fethiye", neighborhoods: ["Ölüdeniz", "Faralya", "Kayaköy", "Göcek", "Kabak"] }
];

const FEATURES = ["Wifi", "Havuz", "Otopark", "Klima", "Restoran", "Deniz Manzarası", "Spa", "Spor Salonu", "Kahvaltı"];

const IMAGES = [
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1613946043868-bd4d660f22f2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
];

const BLOG_TITLES = [
  "Muğla'nın En İyi 10 Koyu",
  "Bodrum'da Bir Hafta Sonu Rotası",
  "Fethiye'nin Saklı Cennetleri",
  "Datça'da Nerede Ne Yenir?",
  "Mavi Yolculuk Rehberi",
  "Likya Yolu Yürüyüş Tavsiyeleri",
  "Dalyan'da Caretta Carettalarla Tanışma",
  "Akyaka'da Kitesurf Deneyimi",
  "Köyceğiz Pazarı ve Yerel Lezzetler",
  "Antik Kentler Turu: Kaunos ve Knidos"
];

const COLLECTIONS_DATA = [
  {
      name: "Bodrum'un En İyi Plaj Kulüpleri",
      slug: "bodrum-best-beach-clubs",
      description: "Bodrum'un masmavi denizinin ve eğlenceli plaj partilerinin tadını çıkarın.",
      intro: "Bodrum'un en popüler beach club'larını sizin için derledik.",
      season: "Yaz",
      duration: "3 Gün",
      heroImage: "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?auto=format&fit=crop&w=1200&q=80",
      bestFor: ["Eğlence", "Deniz", "Gençler"],
      highlights: [
          { title: "Mavi Bayraklı Plajlar", description: "Kristal berraklığında sular." },
          { title: "DJ Performansları", description: "Ünlü DJ'ler ile gün batımı partileri." },
          { title: "Lüks Hizmet", description: "VIP localar ve özel servis." }
      ],
      itinerary: [
          { day: "1. Gün", title: "Türkbükü", description: "Güne Maça Kızı'nda kahvaltı ile başlayın." },
          { day: "2. Gün", title: "Yalıkavak", description: "Xuma Beach'te gün boyu eğlence." },
          { day: "3. Gün", title: "Gümüşlük", description: "Mimoza'da gün batımı yemeği." }
      ],
      tips: ["Rezervasyon yaptırmayı unutmayın.", "Güneş kreminizi alın."]
  },
  {
      name: "Datça'da Huzurlu Bir Kaçamak",
      slug: "datca-peaceful-escape",
      description: "Doğa ile iç içe, sakin ve huzurlu bir tatil.",
      intro: "Datça'nın bakir koylarında ruhunuzu dinlendirin.",
      season: "İlkbahar, Yaz",
      duration: "4 Gün",
      heroImage: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
      bestFor: ["Doğa", "Huzur", "Çiftler"],
      highlights: [
          { title: "Knidos Antik Kenti", description: "Tarihin izinde bir gün." },
          { title: "Palamutbükü", description: "Tertemiz bir deniz." },
          { title: "Eski Datça", description: "Taş evler ve begonyalar." }
      ],
      itinerary: [
          { day: "1. Gün", title: "Eski Datça", description: "Can Yücel'in evini ziyaret." },
          { day: "2. Gün", title: "Palamutbükü", description: "Deniz keyfi." },
          { day: "3. Gün", title: "Knidos", description: "Gün batımında antik kent." },
          { day: "4. Gün", title: "Kargı Koyu", description: "Doğa yürüyüşü ve deniz." }
      ],
      tips: ["Badem ezmesi almayı unutmayın.", "Nakit bulundurun."]
  },
    {
      name: "Fethiye Mavi Yolculuk",
      slug: "fethiye-blue-voyage",
      description: "Fethiye körfezinin eşsiz güzelliklerini keşfedin.",
      intro: "Tekne ile koy koy gezerek denizin tadını çıkarın.",
      season: "Yaz",
      duration: "1 Hafta",
      heroImage: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
      bestFor: ["Deniz", "Maceraperestler", "Gruplar"],
      highlights: [
          { title: "Kelebekler Vadisi", description: "Doğal bir cennet." },
          { title: "Ölüdeniz", description: "Dünyaca ünlü plaj." },
          { title: "12 Adalar", description: "Tekne turunun vazgeçilmezi." }
      ],
      itinerary: [
          { day: "1. Gün", title: "Fethiye Liman", description: "Tekneye yerleşme." },
          { day: "2. Gün", title: "Ölüdeniz", description: "Yamaç paraşütü imkanı." },
          { day: "3. Gün", title: "Kelebekler Vadisi", description: "Vadide yürüyüş." }
      ],
      tips: ["Deniz tutmasına karşı ilaç alın.", "Su altı kameranızı getirin."]
  }
];

async function main() {
  console.log("🌱 Seeding content...");

  // 1. Get or Create an Author (User) for ownership
  let authorId: string;
  const existingUser = await db.query.user.findFirst();
  
  if (existingUser) {
    authorId = existingUser.id;
    console.log(`Using existing user: ${existingUser.email}`);
  } else {
    console.log("No user found. Creating a demo user...");
    const newUserId = nanoid();
    await db.insert(user).values({
      id: newUserId,
      name: "Demo User",
      email: "demo@mytrip.com",
      role: "owner",
      status: "active",
    });
    authorId = newUserId;
    console.log(`Created demo user: demo@mytrip.com (${authorId})`);
  }

  // 2. Clear existing (optional, usually seeders are additive or reset-y, we'll try to be additive but safe)
  // For this task we just insert.

  // 3. Create Categories
  console.log("Creating categories...");
  const categoryIds: Record<string, string> = {};

  for (const cat of CATEGORIES) {
    // Check if exists
    const existing = await db.query.placeCategory.findFirst({
        where: eq(placeCategory.slug, cat.slug)
    });

    if (existing) {
        categoryIds[cat.slug] = existing.id;
        continue;
    }

    const id = nanoid();
    await db.insert(placeCategory).values({
      id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      icon: cat.icon
    });
    categoryIds[cat.slug] = id;
  }

  // 4. Create Places (50x)
  console.log("Creating 50 places...");
  
  const PLACE_PREFIXES = ["Grand", "Royal", "Sunset", "Blue", "Golden", "White", "Vista", "Panorama", "Elite", "Luxury"];
  const PLACE_SUFFIXES = ["Hotel", "Resort", "Villa", "Palace", "Lounge", "Beach Club", "Konak", "Garden", "Suites", "Lodge"];

  for (let i = 0; i < 50; i++) {
    const region = random(NEIGHBORHOODS);
    const category = random(CATEGORIES);
    const district = region.district;
    const hood = random(region.neighborhoods);
    const name = `${random(PLACE_PREFIXES)} ${hood} ${random(PLACE_SUFFIXES)}`;
    const slug = `${name.toLowerCase().replace(/ /g, "-")}-${nanoid(6)}`;
    
    // Coordinates around Mugla (rough box)
    const lat = 36.5 + Math.random();
    const lng = 27.5 + Math.random();

    await db.insert(place).values({
      id: nanoid(),
      slug,
      name,
      type: category.type as any,
      categoryId: categoryIds[category.slug],
      category: category.slug, // Legacy
      description: `${name}, ${district} bölgesinin en gözde mekanlarından biridir. Eşsiz manzarası ve kaliteli hizmetiyle misafirlerini bekliyor. ${randomSubset(FEATURES, 3).join(", ")} gibi olanaklarıyla konforlu bir deneyim sunuyoruz.`,
      shortDescription: `${district}, ${hood} bölgesinde eşsiz bir deneyim.`,
      address: `${hood} Mah. Atatürk Cad. No:${randomInt(1, 100)}, ${district}, Muğla`,
      city: "Muğla",
      district: district,
      location: JSON.stringify({ lat, lng }),
      contactInfo: JSON.stringify({ phone: "+90 252 555 5555", email: "info@mytrip.com" }),
      rating: randomFloat(3.5, 5.0),
      reviewCount: randomInt(10, 500),
      priceLevel: random(["budget", "moderate", "expensive", "luxury"]) as any,
      nightlyPrice: (randomInt(1000, 10000)).toString(),
      features: JSON.stringify(randomSubset(FEATURES, 5)),
      images: JSON.stringify(randomSubset(IMAGES, 5)),
      status: "active",
      verified: Math.random() > 0.3,
      featured: Math.random() > 0.8,
      ownerId: authorId,
      views: randomInt(100, 5000),
      bookingCount: randomInt(0, 100)
    });
  }

  // 5. Create Blogs (10x)
  console.log("Creating 10 blog posts...");
  for (const title of BLOG_TITLES) {
    const slug = title.toLowerCase().replace(/ /g, "-").replace(/['']/g, "") + "-" + nanoid(4);
    
    await db.insert(blogPost).values({
      id: nanoid(),
      slug,
      title,
      excerpt: `${title} hakkında bilmeniz gereken her şey. Keşfedilmemiş noktalar ve ipuçları.`,
      content: `<p>${title} yazımızda bölgenin en güzel yerlerini inceliyoruz.</p><p>Detaylı rehberimiz yakında güncellenecektir.</p>`,
      heroImage: random(IMAGES),
      images: JSON.stringify(randomSubset(IMAGES, 3)),
      category: random(["travel", "activity", "food"]) as any,
      status: "published",
      authorId: authorId,
      publishedAt: new Date(),
      readingLevel: "medium",
      targetAudience: "travelers",
      featured: Math.random() > 0.7,
      views: randomInt(50, 2000)
    });
  }

  // 6. Create Collections
  console.log("Creating collections...");
  
  // Grab all place IDs
  const createdPlaces = await db.select({ id: place.id }).from(place);
  const placeIds = createdPlaces.map(p => p.id);

  if (placeIds.length > 0) {
    for (const col of COLLECTIONS_DATA) {
        // Pick random places for this collection
        const collectionPlaces = randomSubset(placeIds, randomInt(3, 8));
        
        await db.insert(collection).values({
            id: nanoid(),
            slug: col.slug,
            name: col.name,
            description: col.description,
            intro: col.intro,
            heroImage: col.heroImage,
            coverImage: col.heroImage,
            season: col.season,
            duration: col.duration,
            bestFor: JSON.stringify(col.bestFor),
            highlights: JSON.stringify(col.highlights),
            itinerary: JSON.stringify(col.itinerary),
            tips: JSON.stringify(col.tips),
            featuredPlaces: JSON.stringify(collectionPlaces),
            itemCount: collectionPlaces.length,
            status: "published",
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
  }

  console.log("✅ Seeding complete!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
