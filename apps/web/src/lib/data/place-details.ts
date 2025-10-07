import type { PlaceDetail } from "@/types";

import { FEATURED_COLLECTIONS } from "./collections";
import { FEATURED_PLACES } from "./featured-places";

const collectionBySlug = new Map(FEATURED_COLLECTIONS.map((collection) => [collection.slug, collection]));
const placeBySlug = new Map(FEATURED_PLACES.map((place) => [place.slug, place]));

function pickPlaces(slugs: string[] = []) {
  return slugs
    .map((slug) => placeBySlug.get(slug))
    .filter((place): place is NonNullable<(typeof FEATURED_PLACES)[number]> => Boolean(place));
}

function pickCollections(slugs: string[] = []) {
  return slugs
    .map((slug) => collectionBySlug.get(slug))
    .filter((collection): collection is NonNullable<(typeof FEATURED_COLLECTIONS)[number]> => Boolean(collection));
}

export const PLACE_DETAILS: PlaceDetail[] = [
  {
    ...placeBySlug.get("casa-selimiye")!,
    heroImage:
      "https://images.unsplash.com/photo-1648477999235-211f19d2447d?auto=format&fit=crop&w=2400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80",
    ],
    shortHighlights: [
      "Özel iskelesi ve kahvaltısı tekneyle gelen butik taş ev",
      "Egenin en berrak koylarından birinde konumlanmış",
      "Şef eşliğinde özel yemek ve tekne turu rezervasyonu",
    ],
    description:
      "Casa Selimiye, Gökova Körfezi'nin saklı koylarından birinde yer alan üç odalı taş bir villa. Sabahları tekneyle gelen kahvaltı servisi, akşamları ise özel şef menüleri ve gün batımı tekne turları ile misafirlerine unutulmaz bir deneyim sunar. Tasarım detayları ve sürdürülebilir malzemelerle öne çıkan ev, Ege'nin sakin ritmini yaşamak isteyen çiftler ve arkadaş grupları için ideal.",
    amenities: [
      { icon: "🌊", label: "Özel iskele" },
      { icon: "🥐", label: "Günlük kahvaltı servisi" },
      { icon: "🔥", label: "Dış mekan şömine" },
      { icon: "🛥️", label: "Gün batımı tekne turu" },
      { icon: "🧖", label: "Açık hava duş alanı" },
      { icon: "🛎️", label: "Concierge hizmeti" },
    ],
    checkInInfo: "Check-in: 15.00 / Check-out: 11.00",
    checkOutInfo: "Erken check-in için concierge ekibiyle iletişime geçin.",
    featuredCollections: pickCollections(["blue-cruise-itinerary"]),
    nearbyPlaces: pickPlaces(["terra-gumusluk", "datca-ciftlik-evi"]),
  },
  {
    ...placeBySlug.get("terra-gumusluk")!,
    heroImage:
      "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=2400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80",
    ],
    shortHighlights: [
      "Ege kıyısına bakan sonsuzluk havuzu",
      "Sanat koleksiyonu ve okuma köşeleri",
      "Şömineli açık plan yaşam alanı",
    ],
    description:
      "Terra Gümüşlük, modern mimarinin doğa ile buluştuğu bir tasarım evi. İç mekânda özenle seçilmiş sanat eserleri, açık plan yaşam alanı ve panoramik teraslar bulunuyor. Misafirlerimiz için özel yoga seansları, şef eşliğinde akşam yemekleri ve yarımadayı keşfedecekleri rehberli tur önerileri sunuyoruz.",
    amenities: [
      { icon: "🏊", label: "Sonsuzluk havuzu" },
      { icon: "🖼️", label: "Özel sanat koleksiyonu" },
      { icon: "🧘", label: "Yoga terası" },
      { icon: "🔥", label: "Kapalı / açık şömine" },
      { icon: "🍷", label: "Şarap mahzeni" },
      { icon: "🪴", label: "Akıllı ev otomasyonu" },
    ],
    checkInInfo: "Check-in: 16.00 / Check-out: 11.00",
    featuredCollections: pickCollections(["bodrum-gastronomy-guide"]),
    nearbyPlaces: pickPlaces(["casa-selimiye", "bodrum-gurme-turu"]),
  },
  {
    ...placeBySlug.get("bozburun-blue")!,
    heroImage:
      "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?auto=format&fit=crop&w=2400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1520583457224-aee11bad5112?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1600&q=80",
    ],
    shortHighlights: [
      "Panoramik teraslı dubleks loft",
      "Aileler için geniş yaşam alanı",
      "Odun fırınlı açık mutfak",
    ],
    description:
      "Bozburun Blue Loft, aileler ve arkadaş grupları için tasarlanmış iki katlı bir Akdeniz evi. Panoramik terası, çocuklar için oyun alanı ve sahile inen özel patikası ile tatilinizi keyifli kılar. Sabahları yöresel ürünlerle hazırlanan kahvaltı sepeti, akşamları ise taş fırında pişen yerel lezzetler eşlik ediyor.",
    amenities: [
      { icon: "👨‍👩‍👧", label: "Çocuk oyun alanı" },
      { icon: "🔥", label: "Odun fırını" },
      { icon: "🛶", label: "Kano ve paddle board" },
      { icon: "📶", label: "Yüksek hızlı internet" },
      { icon: "🌿", label: "Geniş bahçe" },
    ],
    checkInInfo: "Check-in: 15.00 / Check-out: 11.00",
    featuredCollections: pickCollections(["blue-cruise-itinerary"]),
    nearbyPlaces: pickPlaces(["casa-selimiye", "datca-ciftlik-evi"]),
  },
  {
    ...placeBySlug.get("datca-ciftlik-evi")!,
    heroImage:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=2400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1441123285228-1448e608f3d5?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1498551172505-8ee7ad69f235?auto=format&fit=crop&w=1600&q=80",
    ],
    shortHighlights: [
      "Organik zeytin çiftliği atmosferi",
      "Şef masası ve tadım menüleri",
      "Meditasyon ve nefes atölyeleri",
    ],
    description:
      "Datça Çiftlik Evi, zeytin ve badem ağaçlarının ortasında konumlanan taş bir konukevi. Misafirler gün boyu çiftlik aktivitelerine katılabilir, akşamları ise yerel şeflerin hazırladığı tadım menülerini asma altı masalarda deneyimleyebilir. Wellness programları ve doğa yürüyüşleri ile ruhunuzu dinlendirin.",
    amenities: [
      { icon: "🌿", label: "Organik bahçe" },
      { icon: "🍽️", label: "Şef masası" },
      { icon: "🧘", label: "Nefes / meditasyon atölyesi" },
      { icon: "🚲", label: "Bisiklet parkuru" },
      { icon: "📚", label: "Köy kütüphanesi" },
    ],
    checkInInfo: "Check-in: 14.00 / Check-out: 11.00",
    featuredCollections: pickCollections(["agean-wellness-retreats"]),
    nearbyPlaces: pickPlaces(["bozburun-blue", "datca-levrek-sofrasi"]),
  },
  {
    ...placeBySlug.get("bodrum-gurme-turu")!,
    heroImage:
      "https://images.unsplash.com/photo-1421622548261-c45bfe178854?auto=format&fit=crop&w=2400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1600&q=80",
    ],
    shortHighlights: [
      "Gurme rotalar ve bağ ziyaretleri",
      "Yerel şeflerle atölyeler",
      "Butik otel konaklaması",
    ],
    description:
      "Bodrum Gurme Turu, gastronomi meraklıları için tasarlanmış üç günlük butik bir deneyim. Yarımadanın seçkin restoranlarında tadım menüleri, yerel üreticilerle bağ gezileri ve şef eşliğinde yemek atölyeleri ile dolu bir program sunuyoruz. Konaklama olarak seçili butik otellerde kalınır ve transferler MyTrip tarafından organize edilir.",
    amenities: [
      { icon: "🍷", label: "Bağ gezisi" },
      { icon: "👩‍🍳", label: "Şef atölyesi" },
      { icon: "🚐", label: "Transfer hizmeti" },
      { icon: "📸", label: "Gurme rehber" },
    ],
    checkInInfo: "Program cuma sabahı başlar, pazar akşamı sona erer.",
    featuredCollections: pickCollections(["bodrum-gastronomy-guide"]),
    nearbyPlaces: pickPlaces(["terra-gumusluk", "datca-levrek-sofrasi"]),
  },
  {
    ...placeBySlug.get("datca-levrek-sofrasi")!,
    heroImage:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=2400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1600&q=80",
    ],
    shortHighlights: [
      "Denize sıfır balık restoranı",
      "Günlük yakalanan taze ürünler",
      "Yerel şarap eşleşmeleri",
    ],
    description:
      "Datça Levrek Sofrası, sahil boyunca uzanan masaları ve odun ateşinde hazırlanan deniz ürünleriyle ünlüdür. Günlük olarak balıkçı teknelerinden gelen ürünlerle hazırlanan menüler, yerel şarap eşleşmeleriyle tamamlanır. Akşam güneşinin batışını izleyerek gastronomik bir deneyim yaşayın.",
    amenities: [
      { icon: "🍴", label: "Şef tadım menüsü" },
      { icon: "🍷", label: "Yerel şarap seçkisi" },
      { icon: "🏝️", label: "Denize sıfır" },
      { icon: "🎶", label: "Canlı müzik akşamları" },
    ],
    featuredCollections: pickCollections(["bodrum-gastronomy-guide", "blue-cruise-itinerary"]),
    nearbyPlaces: pickPlaces(["casa-selimiye", "datca-ciftlik-evi"]),
  },
];

export const PLACE_DETAILS_BY_SLUG = new Map(
  PLACE_DETAILS.map((detail) => [detail.slug, detail]),
);
