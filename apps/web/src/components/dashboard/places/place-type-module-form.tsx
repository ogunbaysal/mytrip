"use client";

import { Plus, Trash2 } from "lucide-react";

import { DashboardCard, SectionHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  ActivityPackageDraft,
  DiningMenuDraft,
  DiningMenuItemDraft,
  HotelRoomDraft,
  PlaceTypeModuleDraft,
} from "@/lib/place-type-module";

type PlaceTypeModuleFormProps = {
  kindId: string;
  value: PlaceTypeModuleDraft;
  onChange: (value: PlaceTypeModuleDraft) => void;
  disabled?: boolean;
};

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

const createDiningItemDraft = (): DiningMenuItemDraft => ({
  name: "",
  description: "",
  price: "",
  tags: "",
});

const createDiningMenuDraft = (): DiningMenuDraft => ({
  name: "",
  description: "",
  items: [createDiningItemDraft()],
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

  const setDiningField = (
    field: keyof PlaceTypeModuleDraft["dining"],
    fieldValue: unknown,
  ) => {
    onChange({
      ...value,
      dining: {
        ...value.dining,
        [field]: fieldValue,
      },
    });
  };

  const setBeachField = (field: keyof PlaceTypeModuleDraft["beach"], fieldValue: unknown) => {
    onChange({
      ...value,
      beach: {
        ...value.beach,
        [field]: fieldValue,
      },
    });
  };

  const setNaturalField = (
    field: keyof PlaceTypeModuleDraft["natural"],
    fieldValue: unknown,
  ) => {
    onChange({
      ...value,
      natural: {
        ...value.natural,
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

  const setVisitField = (field: keyof PlaceTypeModuleDraft["visit"], fieldValue: unknown) => {
    onChange({
      ...value,
      visit: {
        ...value.visit,
        [field]: fieldValue,
      },
    });
  };

  const setOtherField = (
    field: keyof PlaceTypeModuleDraft["otherMonetized"],
    fieldValue: unknown,
  ) => {
    onChange({
      ...value,
      otherMonetized: {
        ...value.otherMonetized,
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

  const updateDiningMenu = (
    menuIndex: number,
    field: keyof DiningMenuDraft,
    fieldValue: string | DiningMenuItemDraft[],
  ) => {
    const nextMenus = value.dining.menus.map((menu, index) =>
      index === menuIndex ? { ...menu, [field]: fieldValue } : menu,
    );
    setDiningField("menus", nextMenus);
  };

  const updateDiningItem = (
    menuIndex: number,
    itemIndex: number,
    field: keyof DiningMenuItemDraft,
    fieldValue: string,
  ) => {
    const menu = value.dining.menus[menuIndex];
    if (!menu) return;
    const nextItems = menu.items.map((item, index) =>
      index === itemIndex ? { ...item, [field]: fieldValue } : item,
    );
    updateDiningMenu(menuIndex, "items", nextItems);
  };

  const removeDiningMenu = (menuIndex: number) => {
    setDiningField(
      "menus",
      value.dining.menus.filter((_, index) => index !== menuIndex),
    );
  };

  const removeDiningItem = (menuIndex: number, itemIndex: number) => {
    const menu = value.dining.menus[menuIndex];
    if (!menu) return;
    const nextItems = menu.items.filter((_, index) => index !== itemIndex);
    updateDiningMenu(menuIndex, "items", nextItems.length > 0 ? nextItems : [createDiningItemDraft()]);
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

  if (kindId === "hotel") {
    return (
      <div className="space-y-6">
        <DashboardCard padding="md">
          <SectionHeader
            title="Otel Profili"
            subtitle="Konaklama kurallari ve temel profil bilgileri"
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Yildiz</Label>
              <Input
                value={value.hotel.starRating}
                onChange={(event) => setHotelField("starRating", event.target.value)}
                placeholder="Orn: 5"
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
                placeholder="Orn: 2"
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
                Cocuk dostu
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
            title="Oda Taslaklari"
            subtitle="Gonderimden sonra odalar otomatik olusturulacak"
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
                    Kaldir
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Oda Adi *</Label>
                    <Input
                      value={room.name}
                      onChange={(event) =>
                        updateRoom(roomIndex, "name", event.target.value)
                      }
                      placeholder="Orn: Deluxe Deniz Manzarali"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Aciklama</Label>
                    <Input
                      value={room.description}
                      onChange={(event) =>
                        updateRoom(roomIndex, "description", event.target.value)
                      }
                      placeholder="Kisa oda aciklamasi"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maks Yetiskin</Label>
                    <Input
                      value={room.maxAdults}
                      onChange={(event) =>
                        updateRoom(roomIndex, "maxAdults", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maks Cocuk</Label>
                    <Input
                      value={room.maxChildren}
                      onChange={(event) =>
                        updateRoom(roomIndex, "maxChildren", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Yatak Sayisi</Label>
                    <Input
                      value={room.bedCount}
                      onChange={(event) =>
                        updateRoom(roomIndex, "bedCount", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Banyo Sayisi</Label>
                    <Input
                      value={room.bathroomCount}
                      onChange={(event) =>
                        updateRoom(roomIndex, "bathroomCount", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temel Gecelik Fiyat</Label>
                    <Input
                      value={room.baseNightlyPrice}
                      onChange={(event) =>
                        updateRoom(roomIndex, "baseNightlyPrice", event.target.value)
                      }
                      placeholder="TRY"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ozellikler (virgulle)</Label>
                    <Input
                      value={room.featureList}
                      onChange={(event) =>
                        updateRoom(roomIndex, "featureList", event.target.value)
                      }
                      placeholder="wifi, klima, balkon"
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

  if (kindId === "villa") {
    return (
      <DashboardCard padding="md">
        <SectionHeader
          title="Villa Profili"
          subtitle="Villa turu icin temel profil alanlari"
          size="sm"
          className="mb-6"
        />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Maks Misafir</Label>
            <Input
              value={value.villa.maxGuests}
              onChange={(event) => setVillaField("maxGuests", event.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Yatak Odasi</Label>
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
            <Label>Temizlik Ucreti</Label>
            <Input
              value={value.villa.cleaningFee}
              onChange={(event) => setVillaField("cleaningFee", event.target.value)}
              placeholder="TRY"
              disabled={disabled}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.villa.poolAvailable}
                onChange={(event) => setVillaField("poolAvailable", event.target.checked)}
                disabled={disabled}
              />
              Havuz var
            </label>
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (["restaurant", "cafe", "bar_club"].includes(kindId)) {
    return (
      <div className="space-y-6">
        <DashboardCard padding="md">
          <SectionHeader
            title="Yeme Icme Profili"
            subtitle="Fiyat ve hizmet bilgileri"
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Ortalama Kisi Basi Fiyat</Label>
              <Input
                value={value.dining.averagePricePerPerson}
                onChange={(event) =>
                  setDiningField("averagePricePerPerson", event.target.value)
                }
                placeholder="TRY"
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Dress Code</Label>
              <Input
                value={value.dining.dressCode}
                onChange={(event) => setDiningField("dressCode", event.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.dining.reservationRequired}
                  onChange={(event) =>
                    setDiningField("reservationRequired", event.target.checked)
                  }
                  disabled={disabled}
                />
                Rezervasyon gerekli
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.dining.servesAlcohol}
                  onChange={(event) =>
                    setDiningField("servesAlcohol", event.target.checked)
                  }
                  disabled={disabled}
                />
                Alkol servisi
              </label>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard padding="md">
          <SectionHeader
            title="Menu Taslaklari"
            subtitle="Gonderimde bu menuler otomatik kaydedilir"
            size="sm"
            className="mb-6"
          />

          <div className="space-y-4">
            {value.dining.menus.map((menu, menuIndex) => (
              <div key={`menu-${menuIndex}`} className="rounded-xl border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Menu #{menuIndex + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDiningMenu(menuIndex)}
                    disabled={disabled}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-1 size-4" />
                    Kaldir
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Menu Adi *</Label>
                    <Input
                      value={menu.name}
                      onChange={(event) =>
                        updateDiningMenu(menuIndex, "name", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aciklama</Label>
                    <Input
                      value={menu.description}
                      onChange={(event) =>
                        updateDiningMenu(menuIndex, "description", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {menu.items.map((item, itemIndex) => (
                    <div key={`menu-item-${menuIndex}-${itemIndex}`} className="rounded-lg border p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <h5 className="text-xs font-semibold text-muted-foreground">
                          Urun #{itemIndex + 1}
                        </h5>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDiningItem(menuIndex, itemIndex)}
                          disabled={disabled}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-1 size-3" />
                          Sil
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          value={item.name}
                          onChange={(event) =>
                            updateDiningItem(menuIndex, itemIndex, "name", event.target.value)
                          }
                          placeholder="Urun adi"
                          disabled={disabled}
                        />
                        <Input
                          value={item.price}
                          onChange={(event) =>
                            updateDiningItem(menuIndex, itemIndex, "price", event.target.value)
                          }
                          placeholder="Fiyat"
                          disabled={disabled}
                        />
                        <Input
                          value={item.description}
                          onChange={(event) =>
                            updateDiningItem(
                              menuIndex,
                              itemIndex,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Aciklama"
                          disabled={disabled}
                        />
                        <Input
                          value={item.tags}
                          onChange={(event) =>
                            updateDiningItem(menuIndex, itemIndex, "tags", event.target.value)
                          }
                          placeholder="etiket1, etiket2"
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateDiningMenu(menuIndex, "items", [
                        ...menu.items,
                        createDiningItemDraft(),
                      ])
                    }
                    disabled={disabled}
                  >
                    <Plus className="mr-2 size-4" />
                    Urun Ekle
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => setDiningField("menus", [...value.dining.menus, createDiningMenuDraft()])}
              disabled={disabled}
            >
              <Plus className="mr-2 size-4" />
              Menu Ekle
            </Button>
          </div>
        </DashboardCard>
      </div>
    );
  }

  if (kindId === "beach") {
    return (
      <DashboardCard padding="md">
        <SectionHeader
          title="Plaj Profili"
          subtitle="Giriste ucret ve tesis ozellikleri"
          size="sm"
          className="mb-6"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Giris Ucreti</Label>
            <Input
              value={value.beach.entranceFee}
              onChange={(event) => setBeachField("entranceFee", event.target.value)}
              placeholder="TRY"
              disabled={disabled}
            />
          </div>
          <div className="flex items-end gap-4 pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.beach.hasSunbedRental}
                onChange={(event) =>
                  setBeachField("hasSunbedRental", event.target.checked)
                }
                disabled={disabled}
              />
              Sunbed kiralama var
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.beach.hasShower}
                onChange={(event) => setBeachField("hasShower", event.target.checked)}
                disabled={disabled}
              />
              Dus var
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.beach.hasLifeguard}
                onChange={(event) => setBeachField("hasLifeguard", event.target.checked)}
                disabled={disabled}
              />
              Cankurtaran var
            </label>
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (kindId === "natural_location") {
    return (
      <DashboardCard padding="md">
        <SectionHeader
          title="Dogal Lokasyon Profili"
          subtitle="Zorluk ve ziyaret suresi"
          size="sm"
          className="mb-6"
        />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Giris Ucreti</Label>
            <Input
              value={value.natural.entryFee}
              onChange={(event) => setNaturalField("entryFee", event.target.value)}
              placeholder="TRY"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Zorluk Seviyesi</Label>
            <Input
              value={value.natural.difficultyLevel}
              onChange={(event) => setNaturalField("difficultyLevel", event.target.value)}
              placeholder="Kolay / Orta / Zor"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Onerilen Sure (dk)</Label>
            <Input
              value={value.natural.recommendedDurationMinutes}
              onChange={(event) =>
                setNaturalField("recommendedDurationMinutes", event.target.value)
              }
              disabled={disabled}
            />
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (kindId === "activity_location") {
    return (
      <div className="space-y-6">
        <DashboardCard padding="md">
          <SectionHeader
            title="Aktivite Profili"
            subtitle="Rezervasyon ve guvenlik notlari"
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Guvenlik Gereksinimleri</Label>
              <Input
                value={value.activity.safetyRequirements}
                onChange={(event) =>
                  setActivityField("safetyRequirements", event.target.value)
                }
                placeholder="Orn: Kask, lisans"
                disabled={disabled}
              />
            </div>
            <div className="flex items-end pb-2">
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

        <DashboardCard padding="md">
          <SectionHeader
            title="Paket Taslaklari"
            subtitle="Kayit sonrasinda paketler otomatik olusturulur"
            size="sm"
            className="mb-6"
          />

          <div className="space-y-4">
            {value.activity.packages.map((pkg, packageIndex) => (
              <div key={`package-${packageIndex}`} className="rounded-xl border p-4">
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
                    Kaldir
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Paket Adi *</Label>
                    <Input
                      value={pkg.name}
                      onChange={(event) =>
                        updateActivityPackage(packageIndex, "name", event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Aciklama</Label>
                    <Input
                      value={pkg.description}
                      onChange={(event) =>
                        updateActivityPackage(
                          packageIndex,
                          "description",
                          event.target.value,
                        )
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
                      placeholder="TRY"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sure (dk)</Label>
                    <Input
                      value={pkg.durationMinutes}
                      onChange={(event) =>
                        updateActivityPackage(
                          packageIndex,
                          "durationMinutes",
                          event.target.value,
                        )
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Katilimci</Label>
                    <Input
                      value={pkg.minParticipants}
                      onChange={(event) =>
                        updateActivityPackage(
                          packageIndex,
                          "minParticipants",
                          event.target.value,
                        )
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maks Katilimci</Label>
                    <Input
                      value={pkg.maxParticipants}
                      onChange={(event) =>
                        updateActivityPackage(
                          packageIndex,
                          "maxParticipants",
                          event.target.value,
                        )
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            ))}

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
          </div>
        </DashboardCard>
      </div>
    );
  }

  if (kindId === "visit_location") {
    return (
      <DashboardCard padding="md">
        <SectionHeader
          title="Ziyaret Lokasyonu Profili"
          subtitle="Bilet ve gezi bilgileri"
          size="sm"
          className="mb-6"
        />

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Bilet Fiyati</Label>
            <Input
              value={value.visit.ticketPrice}
              onChange={(event) => setVisitField("ticketPrice", event.target.value)}
              placeholder="TRY"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Onerilen Sure (dk)</Label>
            <Input
              value={value.visit.recommendedDurationMinutes}
              onChange={(event) =>
                setVisitField("recommendedDurationMinutes", event.target.value)
              }
              disabled={disabled}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.visit.requiresGuide}
                onChange={(event) => setVisitField("requiresGuide", event.target.checked)}
                disabled={disabled}
              />
              Rehber gerekli
            </label>
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (kindId === "other_monetized") {
    return (
      <DashboardCard padding="md">
        <SectionHeader
          title="Diger Monetize Profil"
          subtitle="Fiyat ve ek notlar"
          size="sm"
          className="mb-6"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Baslangic Fiyati</Label>
            <Input
              value={value.otherMonetized.startingPrice}
              onChange={(event) =>
                setOtherField("startingPrice", event.target.value)
              }
              placeholder="TRY"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Notlar</Label>
            <Input
              value={value.otherMonetized.notes}
              onChange={(event) => setOtherField("notes", event.target.value)}
              placeholder="Ek fiyatlandirma notlari"
              disabled={disabled}
            />
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard padding="md">
      <SectionHeader
        title="Tur Modulu"
        subtitle="Bu tur icin ozel modül bulunmuyor"
        size="sm"
      />
    </DashboardCard>
  );
}
