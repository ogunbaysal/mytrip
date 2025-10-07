import type { CollectionDetail, PlaceSummary } from "@/types";

import { FEATURED_COLLECTIONS } from "./collections";
import { FEATURED_PLACES } from "./featured-places";

const placeBySlug = new Map<string, PlaceSummary>(
  FEATURED_PLACES.map((place) => [place.slug, place]),
);

function pickPlaces(slugs: string[]): PlaceSummary[] {
  return slugs
    .map((slug) => placeBySlug.get(slug))
    .filter((place): place is PlaceSummary => Boolean(place));
}

export const COLLECTION_DETAILS: CollectionDetail[] = [
  {
    ...FEATURED_COLLECTIONS.find((collection) => collection.slug === "blue-cruise-itinerary")!,
    heroImage:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80",
    intro:
      "Göcek marinalarından çıkıp, mavi yolculuğun en özel koylarında geçen bir hafta. Sakin sularda serinleyin, gulet kahvaltılarının tadını çıkarın ve gün batımını denizden izleyin.",
    duration: "7 gün",
    season: "Mayıs - Eylül",
    bestFor: ["Deniz tutkunları", "Çiftler", "Arkadaş grupları"],
    highlights: [
      {
        title: "Gizli koylarda yüzme",
        description:
          "Sadece denizden ulaşılabilen bakir koylarda yüzün, şnorkelle Akdeniz'in canlı dünyasını keşfedin.",
      },
      {
        title: "Gulet üstünde akşam yemeği",
        description:
          "Yıldızların altında yerel mezeler ve deniz ürünleri eşliğinde özel şef menülerini tadın.",
      },
      {
        title: "Kıyı kasabalarında gün batımı",
        description:
          "Bozburun ve Selimiye gibi kıyı kasabalarına demir atıp sahil kafelerinde gün batımını izleyin.",
      },
    ],
    itinerary: [
      {
        day: "1. Gün",
        title: "Göcek'ten çıkış ve Yassıca Adaları",
        description:
          "Sabah erkenden gulete yerleşin, Göcek koylarında demirleyip günü Yassıca Adaları'nda yüzerek geçirin.",
      },
      {
        day: "3. Gün",
        title: "Bedri Rahmi Koyu ve Dalyan",
        description:
          "Bedri Rahmi Koyu'nda sanatçının kayaları izleyin, Dalyan Kaunos kaya mezarlarını küçük tekneyle ziyaret edin.",
      },
      {
        day: "5. Gün",
        title: "Bozburun ve Selimiye köyleri",
        description:
          "Bozburun'un atölyelerinde gulet yapımını görün, akşam Selimiye'de sahil restoranlarında taze deniz mahsulleri tadın.",
      },
      {
        day: "7. Gün",
        title: "Sarsala Koyu'nda vedalaşma",
        description:
          "Sabah deniziyle ünlü Sarsala Koyu'nda son kez yüzün, Göcek marinaya dönüşte yerel pazardan hediyelik alın.",
      },
    ],
    tips: [
      "Güneşin en dik geldiği saatlerde güvertede gölgeli alanlar için geniş kenarlı şapka bulundurun.",
      "Akşam serinliği için hafif bir triko veya şal çantada olsun.",
      "Gulet şefine sevdiğiniz kahvaltılıkları önceden ileterek size özel menüler hazırlamasını sağlayın.",
    ],
    featuredPlaces: pickPlaces(["casa-selimiye", "bozburun-blue"]),
  },
  {
    ...FEATURED_COLLECTIONS.find((collection) => collection.slug === "bodrum-gastronomy-guide")!,
    heroImage:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1600&q=80",
    intro:
      "Bodrum yarımadasının en yaratıcı şeflerini, butik bağlarını ve deniz ürünü sofralarını keşfeden üç günlük gurme rota.",
    duration: "3 gün",
    season: "Yıl boyu",
    bestFor: ["Gastronomi meraklıları", "Çiftler", "Arkadaş grupları"],
    highlights: [
      {
        title: "Şef tadım menüleri",
        description:
          "Yarımadanın yükselen şeflerinin yerel ürünlerle hazırladığı çok tabaklı tadım menülerini deneyimleyin.",
      },
      {
        title: "Bağ gezileri",
        description:
          "Seferihisar ve Yalıkavak'taki butik bağlarda üzümlerle buluşup mahzenlerde şarap tadın.",
      },
      {
        title: "Pazar keşfi",
        description:
          "Bodrum pazarlarında yerel üreticilerden zeytinyağı, peynir ve otları tanıyıp alışveriş yapın.",
      },
    ],
    itinerary: [
      {
        day: "1. Gün",
        title: "Yalıkavak sahilinde akşam",
        description:
          "Günü Yalıkavak marinada balık restoranlarında başlatın, geceyi canlı müzik eşliğinde sahilde tamamlayın.",
      },
      {
        day: "2. Gün",
        title: "Kırsal sofralar ve bağlar",
        description:
          "Sabah köy kahvaltısı sonrası bağ evi turu yapın, öğleden sonra taş fırında pişenleri tadın.",
      },
      {
        day: "3. Gün",
        title: "Bodrum çarşısı ve dönüş",
        description:
          "Çarşıda zanaatkârları ziyaret edin, mandalina lokumları alın, dönüş öncesi sahil cafe'de serinleyin.",
      },
    ],
    tips: [
      "Restoran rezervasyonlarını en az üç gün önceden yapın, özellikle hafta sonları hızlı doluyor.",
      "Şef menülerinde şarap eşleşmesi için yerel üreticilerden seçilen şişeleri tercih edin.",
      "Pazar turu için sabah erken gidin, taze ürünler çabuk tükeniyor.",
    ],
    featuredPlaces: pickPlaces(["terra-gumusluk", "casa-selimiye"]),
  },
  {
    ...FEATURED_COLLECTIONS.find((collection) => collection.slug === "agean-wellness-retreats")!,
    heroImage:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1600&q=80",
    intro:
      "Termal kaynaklar, orman yürüyüşleri ve mindfulness atölyeleriyle yenilenmeye odaklı dört günlük wellness kaçamağı.",
    duration: "4 gün",
    season: "Ekim - Mayıs",
    bestFor: ["Wellness tutkunları", "Yalnız tatil", "Anne-kız kaçamağı"],
    highlights: [
      {
        title: "Termal spa ritüelleri",
        description:
          "Islak alanlarda kese-köpük, deniz tuzu peelingleri ve mineral havuzlarla vücudunuzu şımartın.",
      },
      {
        title: "Orman yoga seansları",
        description:
          "Sabah gün doğumunda çam ormanlarının kokusu eşliğinde nefes çalışmaları ve meditasyon yapın.",
      },
      {
        title: "Sağlıklı gurme menüler",
        description:
          "Şeflerin yerel ürünlerle hazırladığı bitkisel ağırlıklı menülerle dengeli beslenin.",
      },
    ],
    itinerary: [
      {
        day: "1. Gün",
        title: "Termal karşılama ve nefes çalışması",
        description:
          "Otele giriş sonrası spa turu alın, akşam üstü nefes egzersizi ve hafif yoga seansına katılın.",
      },
      {
        day: "2. Gün",
        title: "Orman yürüyüşü ve atölyeler",
        description:
          "Sabah guide eşliğinde orman yürüyüşü, öğleden sonra sağlıklı fermente atölyesine katılım.",
      },
      {
        day: "3. Gün",
        title: "Mindfulness ve masaj",
        description:
          "Sessizlik ritüeli sonrası uzman terapistlerden derin doku masajıyla gevşeyin.",
      },
      {
        day: "4. Gün",
        title: "Slow breakfast ve vedalaşma",
        description:
          "Mevsimsel kahvaltı sonrası kişisel bakım setinizi alıp yenilenmiş şekilde ayrılın.",
      },
    ],
    tips: [
      "Seanslar arasında su tüketimini artırmak için termos şişe taşıyın.",
      "Yoga için kaymayan mat ve rahat kıyafet getirin.",
      "Spa menüsündeki özel kürleri önceden rezervasyonla planlayın.",
    ],
    featuredPlaces: pickPlaces(["datca-ciftlik", "casa-selimiye"]),
  },
];

export const COLLECTION_DETAILS_BY_SLUG = new Map(
  COLLECTION_DETAILS.map((collection) => [collection.slug, collection]),
);
