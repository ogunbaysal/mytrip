const FEATURE_LABEL_OVERRIDES: Record<string, string> = {
  wifi: "Wi-Fi",
  free_wifi: "Ücretsiz Wi-Fi",
  otopark: "Otopark",
  cocuk_dostu: "Çocuk dostu",
  canli_muzik: "Canlı müzik",
  alkollu_icecek: "Alkollü içecek",
  ozel_bolum: "Özel bölüm",
  free_parking: "Ücretsiz otopark",
  air_conditioning: "Klima",
  sea_view: "Deniz manzarası",
  deniz_manzaras: "Deniz manzarası",
  deniz_manzarasi: "Deniz manzarası",
  beach_access: "Plaj erişimi",
  room_service: "Oda servisi",
  pet_friendly: "Evcil hayvan dostu",
  family_friendly: "Aile dostu",
  wheelchair_accessible: "Engelli erişimine uygun",
  vegetarian_options: "Vejetaryen seçenekleri",
  vejetaryen_secenekleri: "Vejetaryen seçenekleri",
};

const FEATURE_ICON_OVERRIDES: Record<string, string> = {
  wifi: "📶",
  parking: "🅿️",
  otopark: "🅿️",
  free_parking: "🅿️",
  pool: "🏊",
  teras: "🌿",
  spa: "🧖",
  gym: "🏋️",
  restaurant: "🍽️",
  bar: "🍸",
  canli_muzik: "🎵",
  alkollu_icecek: "🍸",
  ozel_bolum: "🔒",
  cocuk_dostu: "👨‍👩‍👧‍👦",
  room_service: "🛎️",
  air_conditioning: "❄️",
  heating: "🔥",
  sea_view: "🌊",
  deniz_manzaras: "🌊",
  deniz_manzarasi: "🌊",
  beach_access: "🏖️",
  pet_friendly: "🐾",
  wheelchair_accessible: "♿",
  family_friendly: "👨‍👩‍👧‍👦",
};

const TURKISH_WORD_OVERRIDES: Record<string, string> = {
  cocuk: "çocuk",
  canli: "canlı",
  muzik: "müzik",
  alkollu: "alkollü",
  icecek: "içecek",
  ozel: "özel",
  bolum: "bölüm",
  secenekleri: "seçenekleri",
  ucretsiz: "ücretsiz",
  manzarasi: "manzarası",
  manzaras: "manzarası",
};

export function normalizePlaceFeature(feature: string): string {
  return feature
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getPlaceFeatureLabel(feature: string): string {
  const normalized = normalizePlaceFeature(feature);
  if (!normalized) return "";

  const predefinedLabel = FEATURE_LABEL_OVERRIDES[normalized];
  if (predefinedLabel) return predefinedLabel;

  const label = normalized
    .split("_")
    .map((word) => TURKISH_WORD_OVERRIDES[word] ?? word)
    .join(" ");
  return label.charAt(0).toLocaleUpperCase("tr-TR") + label.slice(1);
}

export function getPlaceFeatureIcon(feature: string): string {
  const normalized = normalizePlaceFeature(feature);
  return FEATURE_ICON_OVERRIDES[normalized] || "•";
}

export function getUniquePlaceFeatureLabels(
  features: string[],
  limit?: number,
): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();

  for (const feature of features) {
    const label = getPlaceFeatureLabel(feature);
    if (!label) continue;

    const dedupeKey = label.toLocaleLowerCase("tr-TR");
    if (seen.has(dedupeKey)) continue;

    seen.add(dedupeKey);
    labels.push(label);

    if (limit && labels.length >= limit) {
      break;
    }
  }

  return labels;
}
