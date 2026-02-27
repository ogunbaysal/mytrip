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
  activity: {
    requiresReservation: boolean;
    safetyRequirements: string;
    packages: ActivityPackageDraft[];
  };
};

const ACTIVITY_MODULE_KINDS = [
  "transfer",
  "boat_tour",
  "paragliding_microlight_skydiving",
  "safari",
  "water_sports",
  "ski",
  "balloon_tour",
] as const;

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
  activity: {
    requiresReservation: false,
    safetyRequirements: "",
    packages: [],
  },
});

export const buildTypeModuleOpeningHoursProfile = (
  kindId: string,
  moduleData: PlaceTypeModuleDraft,
): Record<string, unknown> | undefined => {
  switch (kindId) {
    case "hotel_pension":
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
    case "bungalow_tiny_house":
    case "detached_house_apartment":
    case "camp_site":
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
    case "transfer":
    case "boat_tour":
    case "paragliding_microlight_skydiving":
    case "safari":
    case "water_sports":
    case "ski":
    case "balloon_tour":
      return {
        typeProfile: {
          kind: "activity",
          requiresReservation: moduleData.activity.requiresReservation,
          safetyRequirements: moduleData.activity.safetyRequirements.trim() || undefined,
          packageDraftCount: moduleData.activity.packages.filter((item) => item.name.trim())
            .length,
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
    case "hotel_pension":
      return [
        `Taslak oda: ${moduleData.hotel.rooms.filter((room) => room.name.trim()).length}`,
        `Yildiz: ${moduleData.hotel.starRating || "-"}`,
        `Min konaklama: ${moduleData.hotel.minimumStayNights || "-"} gece`,
      ];
    case "villa":
    case "bungalow_tiny_house":
    case "detached_house_apartment":
    case "camp_site":
      return [
        `Maks misafir: ${moduleData.villa.maxGuests || "-"}`,
        `Yatak odasi: ${moduleData.villa.bedroomCount || "-"}`,
        `Havuz: ${moduleData.villa.poolAvailable ? "Var" : "Yok"}`,
      ];
    case "transfer":
    case "boat_tour":
    case "paragliding_microlight_skydiving":
    case "safari":
    case "water_sports":
    case "ski":
    case "balloon_tour":
      return [
        `Taslak paket: ${moduleData.activity.packages.filter((item) => item.name.trim()).length}`,
        `Rezervasyon: ${moduleData.activity.requiresReservation ? "Gerekli" : "Opsiyonel"}`,
      ];
    default:
      return [];
  }
};

export const validateTypeModuleDraft = (
  kindId: string,
  moduleData: PlaceTypeModuleDraft,
): string | null => {
  if (kindId === "hotel_pension") {
    const validRooms = moduleData.hotel.rooms.filter((room) => room.name.trim());
    if (validRooms.length === 0) {
      return "Otel türünde en az bir oda taslağı eklemelisiniz";
    }
  }

  if ((ACTIVITY_MODULE_KINDS as readonly string[]).includes(kindId)) {
    const validPackages = moduleData.activity.packages.filter((pkg) => pkg.name.trim());
    if (validPackages.length === 0) {
      return "Aktivite türünde en az bir paket taslağı eklemelisiniz";
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
  if (kindId === "hotel_pension") {
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

  if ((ACTIVITY_MODULE_KINDS as readonly string[]).includes(kindId)) {
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
