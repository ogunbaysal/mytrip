"use client";

import { Plus, Trash2 } from "lucide-react";

import { DashboardCard, SectionHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  ActivityPackageDraft,
  HotelRoomDraft,
  PlaceTypeModuleDraft,
} from "@/lib/place-type-module";

type PlaceTypeModuleFormProps = {
  kindId: string;
  value: PlaceTypeModuleDraft;
  onChange: (value: PlaceTypeModuleDraft) => void;
  disabled?: boolean;
};

const VILLA_KIND_IDS = [
  "villa",
  "bungalow_tiny_house",
  "detached_house_apartment",
  "camp_site",
] as const;

const ACTIVITY_KIND_IDS = [
  "transfer",
  "boat_tour",
  "paragliding_microlight_skydiving",
  "safari",
  "water_sports",
  "ski",
  "balloon_tour",
] as const;

const createRoomDraft = (): HotelRoomDraft => ({
  name: "",
  description: "",
  maxAdults: "2",
  maxChildren: "0",
  bedCount: "",
  bathroomCount: "",
  baseNightlyPrice: "",
  featureList: "",
});

const createActivityPackageDraft = (): ActivityPackageDraft => ({
  name: "",
  description: "",
  price: "",
  durationMinutes: "",
  minParticipants: "",
  maxParticipants: "",
});

export function PlaceTypeModuleForm({
  kindId,
  value,
  onChange,
  disabled,
}: PlaceTypeModuleFormProps) {
  const setHotelField = (field: keyof PlaceTypeModuleDraft["hotel"], fieldValue: unknown) => {
    onChange({
      ...value,
      hotel: {
        ...value.hotel,
        [field]: fieldValue,
      },
    });
  };

  const setVillaField = (field: keyof PlaceTypeModuleDraft["villa"], fieldValue: unknown) => {
    onChange({
      ...value,
      villa: {
        ...value.villa,
        [field]: fieldValue,
      },
    });
  };

  const setActivityField = (
    field: keyof PlaceTypeModuleDraft["activity"],
    fieldValue: unknown,
  ) => {
    onChange({
      ...value,
      activity: {
        ...value.activity,
        [field]: fieldValue,
      },
    });
  };

  const updateRoom = (
    roomIndex: number,
    field: keyof HotelRoomDraft,
    fieldValue: string,
  ) => {
    const nextRooms = value.hotel.rooms.map((room, index) =>
      index === roomIndex ? { ...room, [field]: fieldValue } : room,
    );
    setHotelField("rooms", nextRooms);
  };

  const removeRoom = (roomIndex: number) => {
    setHotelField(
      "rooms",
      value.hotel.rooms.filter((_, index) => index !== roomIndex),
    );
  };

  const updateActivityPackage = (
    packageIndex: number,
    field: keyof ActivityPackageDraft,
    fieldValue: string,
  ) => {
    const nextPackages = value.activity.packages.map((pkg, index) =>
      index === packageIndex ? { ...pkg, [field]: fieldValue } : pkg,
    );
    setActivityField("packages", nextPackages);
  };

  const removeActivityPackage = (packageIndex: number) => {
    setActivityField(
      "packages",
      value.activity.packages.filter((_, index) => index !== packageIndex),
    );
  };

  if (kindId === "hotel_pension") {
    return (
      <div className="space-y-6">
        <DashboardCard padding="md">
          <SectionHeader
            title="Otel Profili"
            subtitle="Konaklama kuralları ve temel profil bilgileri"
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Yıldız</Label>
              <Input
                value={value.hotel.starRating}
                onChange={(event) => setHotelField("starRating", event.target.value)}
                placeholder="Örn: 5"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Min Konaklama (gece)</Label>
              <Input
                value={value.hotel.minimumStayNights}
                onChange={(event) =>
                  setHotelField("minimumStayNights", event.target.value)
                }
                placeholder="Örn: 2"
                disabled={disabled}
              />
            </div>
            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.hotel.childFriendly}
                  onChange={(event) =>
                    setHotelField("childFriendly", event.target.checked)
                  }
                  disabled={disabled}
                />
                Çocuk dostu
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.hotel.allowsPets}
                  onChange={(event) => setHotelField("allowsPets", event.target.checked)}
                  disabled={disabled}
                />
                Evcil hayvan kabul
              </label>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard padding="md">
          <SectionHeader
            title="Oda Taslakları"
            subtitle="Gönderimden sonra odalar otomatik oluşturulacak"
            size="sm"
            className="mb-6"
          />

          <div className="space-y-4">
            {value.hotel.rooms.map((room, roomIndex) => (
              <div key={`room-${roomIndex}`} className="rounded-xl border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Oda #{roomIndex + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRoom(roomIndex)}
                    disabled={disabled}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-1 size-4" />
                    Kaldır
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Oda Adı *</Label>
                    <Input
                      value={room.name}
                      onChange={(event) =>
                        updateRoom(roomIndex, "name", event.target.value)
                      }
                      placeholder="Örn: Deluxe Deniz Manzaralı"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Açıklama</Label>
                    <Input
                      value={room.description}
                      onChange={(event) =>
                        updateRoom(roomIndex, "description", event.target.value)
                      }
                      placeholder="Kısa oda açıklaması"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maks Yetişkin</Label>
                    <Input
                      value={room.maxAdults}
                      onChange={(event) =>
                        updateRoom(roomIndex, "maxAdults", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maks Çocuk</Label>
                    <Input
                      value={room.maxChildren}
                      onChange={(event) =>
                        updateRoom(roomIndex, "maxChildren", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Yatak Sayısı</Label>
                    <Input
                      value={room.bedCount}
                      onChange={(event) =>
                        updateRoom(roomIndex, "bedCount", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Banyo Sayısı</Label>
                    <Input
                      value={room.bathroomCount}
                      onChange={(event) =>
                        updateRoom(roomIndex, "bathroomCount", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taban Fiyat (gecelik)</Label>
                    <Input
                      value={room.baseNightlyPrice}
                      onChange={(event) =>
                        updateRoom(roomIndex, "baseNightlyPrice", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Özellikler (virgülle)</Label>
                    <Input
                      value={room.featureList}
                      onChange={(event) =>
                        updateRoom(roomIndex, "featureList", event.target.value)
                      }
                      placeholder="wifi, balkon, klima"
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => setHotelField("rooms", [...value.hotel.rooms, createRoomDraft()])}
              disabled={disabled}
            >
              <Plus className="mr-2 size-4" />
              Oda Ekle
            </Button>
          </div>
        </DashboardCard>
      </div>
    );
  }

  if ((VILLA_KIND_IDS as readonly string[]).includes(kindId)) {
    return (
      <DashboardCard padding="md">
        <SectionHeader
          title="Konaklama Profili"
          subtitle="Müstakil konaklamalar için kapasite ve altyapı bilgileri"
          size="sm"
          className="mb-6"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Maks Misafir</Label>
            <Input
              value={value.villa.maxGuests}
              onChange={(event) => setVillaField("maxGuests", event.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Yatak Odası</Label>
            <Input
              value={value.villa.bedroomCount}
              onChange={(event) => setVillaField("bedroomCount", event.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Banyo</Label>
            <Input
              value={value.villa.bathroomCount}
              onChange={(event) => setVillaField("bathroomCount", event.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Temizlik Ücreti</Label>
            <Input
              value={value.villa.cleaningFee}
              onChange={(event) => setVillaField("cleaningFee", event.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.villa.poolAvailable}
                onChange={(event) => setVillaField("poolAvailable", event.target.checked)}
                disabled={disabled}
              />
              Havuz mevcut
            </label>
          </div>
        </div>
      </DashboardCard>
    );
  }

  if ((ACTIVITY_KIND_IDS as readonly string[]).includes(kindId)) {
    return (
      <DashboardCard padding="md">
        <SectionHeader
          title="Aktivite Paketleri"
          subtitle="Bu kategorilerde en az bir paket taslağı gerekir"
          size="sm"
          className="mb-6"
        />

        <div className="space-y-4">
          {value.activity.packages.map((pkg, packageIndex) => (
            <div key={`pkg-${packageIndex}`} className="rounded-xl border p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Paket #{packageIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeActivityPackage(packageIndex)}
                  disabled={disabled}
                  className="text-red-600"
                >
                  <Trash2 className="mr-1 size-4" />
                  Kaldır
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Paket Adı *</Label>
                  <Input
                    value={pkg.name}
                    onChange={(event) =>
                      updateActivityPackage(packageIndex, "name", event.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Açıklama</Label>
                  <Input
                    value={pkg.description}
                    onChange={(event) =>
                      updateActivityPackage(packageIndex, "description", event.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fiyat</Label>
                  <Input
                    value={pkg.price}
                    onChange={(event) =>
                      updateActivityPackage(packageIndex, "price", event.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Süre (dk)</Label>
                  <Input
                    value={pkg.durationMinutes}
                    onChange={(event) =>
                      updateActivityPackage(packageIndex, "durationMinutes", event.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Katılımcı</Label>
                  <Input
                    value={pkg.minParticipants}
                    onChange={(event) =>
                      updateActivityPackage(packageIndex, "minParticipants", event.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maks Katılımcı</Label>
                  <Input
                    value={pkg.maxParticipants}
                    onChange={(event) =>
                      updateActivityPackage(packageIndex, "maxParticipants", event.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setActivityField("packages", [
                  ...value.activity.packages,
                  createActivityPackageDraft(),
                ])
              }
              disabled={disabled}
            >
              <Plus className="mr-2 size-4" />
              Paket Ekle
            </Button>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.activity.requiresReservation}
                onChange={(event) =>
                  setActivityField("requiresReservation", event.target.checked)
                }
                disabled={disabled}
              />
              Rezervasyon gerekli
            </label>
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard padding="md">
      <SectionHeader
        title="Ek Modül Yok"
        subtitle="Bu kategori için ek form alanı tanımlı değil"
        size="sm"
      />
    </DashboardCard>
  );
}
