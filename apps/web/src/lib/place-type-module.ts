import { api } from "@/lib/api";

export type HotelRoomDraft = {
  name: string;
  description: string;
  maxAdults: string;
  maxChildren: string;
  bedCount: string;
  bathroomCount: string;
  baseNightlyPrice: string;
  featureList: string;
};

export type DiningMenuItemDraft = {
  name: string;
  description: string;
  price: string;
  tags: string;
};

export type DiningMenuDraft = {
  name: string;
  description: string;
  items: DiningMenuItemDraft[];
};

export type ActivityPackageDraft = {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
  minParticipants: string;
  maxParticipants: string;
};

export type PlaceTypeModuleDraft = {
  hotel: {
    starRating: string;
    minimumStayNights: string;
    childFriendly: boolean;
    allowsPets: boolean;
    rooms: HotelRoomDraft[];
  };
  villa: {
    maxGuests: string;
    bedroomCount: string;
    bathroomCount: string;
    poolAvailable: boolean;
    cleaningFee: string;
  };
  dining: {
    averagePricePerPerson: string;
    reservationRequired: boolean;
    servesAlcohol: boolean;
    dressCode: string;
    menus: DiningMenuDraft[];
  };
  beach: {
    entranceFee: string;
    hasSunbedRental: boolean;
    hasShower: boolean;
    hasLifeguard: boolean;
  };
  natural: {
    entryFee: string;
    difficultyLevel: string;
    recommendedDurationMinutes: string;
  };
  activity: {
    requiresReservation: boolean;
    safetyRequirements: string;
    packages: ActivityPackageDraft[];
  };
  visit: {
    ticketPrice: string;
    recommendedDurationMinutes: string;
    requiresGuide: boolean;
  };
  otherMonetized: {
    startingPrice: string;
    notes: string;
  };
};

const toOptionalNumber = (value: string): number | undefined => {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized.replace(",", "."));
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

const toOptionalInt = (value: string): number | undefined => {
  const parsed = toOptionalNumber(value);
  if (parsed === undefined) return undefined;
  return Math.trunc(parsed);
};

const normalizeTags = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );

const normalizeRoomFeatures = (value: string) =>
  normalizeTags(value).map((tag, index) => ({ key: tag, sortOrder: index }));

export const createDefaultPlaceTypeModuleDraft = (): PlaceTypeModuleDraft => ({
  hotel: {
    starRating: "",
    minimumStayNights: "",
    childFriendly: true,
    allowsPets: false,
    rooms: [],
  },
  villa: {
    maxGuests: "",
    bedroomCount: "",
    bathroomCount: "",
    poolAvailable: false,
    cleaningFee: "",
  },
  dining: {
    averagePricePerPerson: "",
    reservationRequired: false,
    servesAlcohol: false,
    dressCode: "",
    menus: [],
  },
  beach: {
    entranceFee: "",
    hasSunbedRental: false,
    hasShower: false,
    hasLifeguard: false,
  },
  natural: {
    entryFee: "",
    difficultyLevel: "",
    recommendedDurationMinutes: "",
  },
  activity: {
    requiresReservation: false,
    safetyRequirements: "",
    packages: [],
  },
  visit: {
    ticketPrice: "",
    recommendedDurationMinutes: "",
    requiresGuide: false,
  },
  otherMonetized: {
    startingPrice: "",
    notes: "",
  },
});

export const buildTypeModuleOpeningHoursProfile = (
  kindId: string,
  moduleData: PlaceTypeModuleDraft,
): Record<string, unknown> | undefined => {
  switch (kindId) {
    case "hotel":
      return {
        typeProfile: {
          kind: "hotel",
          starRating: toOptionalInt(moduleData.hotel.starRating),
          minimumStayNights: toOptionalInt(moduleData.hotel.minimumStayNights),
          childFriendly: moduleData.hotel.childFriendly,
          allowsPets: moduleData.hotel.allowsPets,
          roomDraftCount: moduleData.hotel.rooms.filter((room) => room.name.trim()).length,
        },
      };
    case "villa":
      return {
        typeProfile: {
          kind: "villa",
          maxGuests: toOptionalInt(moduleData.villa.maxGuests),
          bedroomCount: toOptionalInt(moduleData.villa.bedroomCount),
          bathroomCount: toOptionalInt(moduleData.villa.bathroomCount),
          poolAvailable: moduleData.villa.poolAvailable,
          cleaningFee: toOptionalNumber(moduleData.villa.cleaningFee),
        },
      };
    case "restaurant":
    case "cafe":
    case "bar_club":
      return {
        typeProfile: {
          kind: "dining",
          averagePricePerPerson: toOptionalNumber(moduleData.dining.averagePricePerPerson),
          reservationRequired: moduleData.dining.reservationRequired,
          servesAlcohol: moduleData.dining.servesAlcohol,
          dressCode: moduleData.dining.dressCode.trim() || undefined,
          menuDraftCount: moduleData.dining.menus.filter((menu) => menu.name.trim()).length,
        },
      };
    case "beach":
      return {
        typeProfile: {
          kind: "beach",
          entranceFee: toOptionalNumber(moduleData.beach.entranceFee),
          hasSunbedRental: moduleData.beach.hasSunbedRental,
          hasShower: moduleData.beach.hasShower,
          hasLifeguard: moduleData.beach.hasLifeguard,
        },
      };
    case "natural_location":
      return {
        typeProfile: {
          kind: "natural_location",
          entryFee: toOptionalNumber(moduleData.natural.entryFee),
          difficultyLevel: moduleData.natural.difficultyLevel.trim() || undefined,
          recommendedDurationMinutes: toOptionalInt(
            moduleData.natural.recommendedDurationMinutes,
          ),
        },
      };
    case "activity_location":
      return {
        typeProfile: {
          kind: "activity_location",
          requiresReservation: moduleData.activity.requiresReservation,
          safetyRequirements: moduleData.activity.safetyRequirements.trim() || undefined,
          packageDraftCount: moduleData.activity.packages.filter((item) => item.name.trim())
            .length,
        },
      };
    case "visit_location":
      return {
        typeProfile: {
          kind: "visit_location",
          ticketPrice: toOptionalNumber(moduleData.visit.ticketPrice),
          recommendedDurationMinutes: toOptionalInt(
            moduleData.visit.recommendedDurationMinutes,
          ),
          requiresGuide: moduleData.visit.requiresGuide,
        },
      };
    case "other_monetized":
      return {
        typeProfile: {
          kind: "other_monetized",
          startingPrice: toOptionalNumber(moduleData.otherMonetized.startingPrice),
          notes: moduleData.otherMonetized.notes.trim() || undefined,
        },
      };
    default:
      return undefined;
  }
};

export const buildTypeModulePreviewHighlights = (
  kindId: string,
  moduleData: PlaceTypeModuleDraft,
): string[] => {
  switch (kindId) {
    case "hotel":
      return [
        `Taslak oda: ${moduleData.hotel.rooms.filter((room) => room.name.trim()).length}`,
        `Yildiz: ${moduleData.hotel.starRating || "-"}`,
        `Min konaklama: ${moduleData.hotel.minimumStayNights || "-"} gece`,
      ];
    case "villa":
      return [
        `Maks misafir: ${moduleData.villa.maxGuests || "-"}`,
        `Yatak odasi: ${moduleData.villa.bedroomCount || "-"}`,
        `Havuz: ${moduleData.villa.poolAvailable ? "Var" : "Yok"}`,
      ];
    case "restaurant":
    case "cafe":
    case "bar_club":
      return [
        `Taslak menu: ${moduleData.dining.menus.filter((menu) => menu.name.trim()).length}`,
        `Ort. kisi basi fiyat: ${moduleData.dining.averagePricePerPerson || "-"}`,
        `Rezervasyon: ${moduleData.dining.reservationRequired ? "Gerekli" : "Opsiyonel"}`,
      ];
    case "beach":
      return [
        `Giriste ucret: ${moduleData.beach.entranceFee || "-"}`,
        `Can kurtaran: ${moduleData.beach.hasLifeguard ? "Var" : "Yok"}`,
      ];
    case "natural_location":
      return [
        `Zorluk: ${moduleData.natural.difficultyLevel || "-"}`,
        `Süre: ${moduleData.natural.recommendedDurationMinutes || "-"} dk`,
      ];
    case "activity_location":
      return [
        `Taslak paket: ${moduleData.activity.packages.filter((item) => item.name.trim()).length}`,
        `Rezervasyon: ${moduleData.activity.requiresReservation ? "Gerekli" : "Opsiyonel"}`,
      ];
    case "visit_location":
      return [
        `Bilet: ${moduleData.visit.ticketPrice || "-"}`,
        `Süre: ${moduleData.visit.recommendedDurationMinutes || "-"} dk`,
      ];
    case "other_monetized":
      return [
        `Baslangic fiyat: ${moduleData.otherMonetized.startingPrice || "-"}`,
      ];
    default:
      return [];
  }
};

export const validateTypeModuleDraft = (
  kindId: string,
  moduleData: PlaceTypeModuleDraft,
): string | null => {
  if (kindId === "hotel") {
    const validRooms = moduleData.hotel.rooms.filter((room) => room.name.trim());
    if (validRooms.length === 0) {
      return "Otel türünde en az bir oda taslağı eklemelisiniz";
    }
  }

  if (kindId === "activity_location") {
    const validPackages = moduleData.activity.packages.filter((pkg) => pkg.name.trim());
    if (validPackages.length === 0) {
      return "Aktivite türünde en az bir paket taslağı eklemelisiniz";
    }
  }

  if (["restaurant", "cafe", "bar_club"].includes(kindId)) {
    const validMenus = moduleData.dining.menus.filter((menu) => menu.name.trim());
    if (validMenus.length === 0) {
      return "Yeme & içme türlerinde en az bir menü taslağı eklemelisiniz";
    }
  }

  return null;
};

export const provisionTypeModulesForPlace = async ({
  placeId,
  kindId,
  moduleData,
}: {
  placeId: string;
  kindId: string;
  moduleData: PlaceTypeModuleDraft;
}): Promise<void> => {
  if (kindId === "hotel") {
    const validRooms = moduleData.hotel.rooms.filter((room) => room.name.trim());
    for (const room of validRooms) {
      await api.owner.places.createRoom(placeId, {
        name: room.name.trim(),
        description: room.description.trim() || undefined,
        maxAdults: toOptionalInt(room.maxAdults) ?? 2,
        maxChildren: toOptionalInt(room.maxChildren) ?? 0,
        bedCount: toOptionalInt(room.bedCount),
        bathroomCount: toOptionalInt(room.bathroomCount),
        baseNightlyPrice: toOptionalNumber(room.baseNightlyPrice),
        status: "active",
        features: normalizeRoomFeatures(room.featureList),
      });
    }
    return;
  }

  if (["restaurant", "cafe", "bar_club"].includes(kindId)) {
    const menus = moduleData.dining.menus
      .filter((menu) => menu.name.trim())
      .map((menu, menuIndex) => ({
        name: menu.name.trim(),
        description: menu.description.trim() || undefined,
        isActive: true,
        sortOrder: menuIndex,
        sections: [
          {
            name: "Genel",
            description: undefined,
            sortOrder: 0,
            items: menu.items
              .filter((item) => item.name.trim())
              .map((item, itemIndex) => ({
                name: item.name.trim(),
                description: item.description.trim() || undefined,
                price: toOptionalNumber(item.price),
                isAvailable: true,
                sortOrder: itemIndex,
                tags: normalizeTags(item.tags),
              })),
          },
        ],
      }));

    if (menus.length > 0) {
      await api.owner.places.upsertMenu(placeId, { menus });
    }
    return;
  }

  if (kindId === "activity_location") {
    const packages = moduleData.activity.packages.filter((item) => item.name.trim());
    for (const [index, pkg] of packages.entries()) {
      await api.owner.places.createPackage(placeId, {
        name: pkg.name.trim(),
        description: pkg.description.trim() || undefined,
        price: toOptionalNumber(pkg.price),
        durationMinutes: toOptionalInt(pkg.durationMinutes),
        minParticipants: toOptionalInt(pkg.minParticipants),
        maxParticipants: toOptionalInt(pkg.maxParticipants),
        sortOrder: index,
        isActive: true,
      });
    }
  }
};
