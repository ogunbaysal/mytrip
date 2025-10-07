import type { CollectionSummary } from "@/types";

export const FEATURED_COLLECTIONS: CollectionSummary[] = [
  {
    id: "blue-cruise",
    slug: "blue-cruise-itinerary",
    name: "Mavi Tur Haftası",
    description: "Göcek'ten demir alıp sakin koyları, adaları ve gün batımı guletlerini keşfedin.",
    coverImage:
      "https://images.unsplash.com/photo-1591587923461-13896f6a76e7?auto=format&fit=crop&w=1600&q=80",
    itemCount: 8,
  },
  {
    id: "bodrum-gastronomy",
    slug: "bodrum-gastronomy-guide",
    name: "Bodrum Gurme Rotası",
    description: "Şef dokunuşlu tadımlar, farm-to-table sofralar ve pazar turları.",
    coverImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    itemCount: 6,
  },
  {
    id: "wellness-retreats",
    slug: "agean-wellness-retreats",
    name: "Wellness Kaçamakları",
    description: "Termal kaynaklar, orman yoga terasları ve hamam ritüelleri.",
    coverImage:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80",
    itemCount: 5,
  },
];
