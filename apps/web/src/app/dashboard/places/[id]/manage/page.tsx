"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CreditCard, ListChecks, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { api } from "@/lib/api";

type TabId = "calendar" | "reservations" | "pricing";

const tabItems: Array<{ id: TabId; label: string }> = [
  { id: "calendar", label: "Takvim" },
  { id: "reservations", label: "Rezervasyonlar" },
  { id: "pricing", label: "Fiyatlama" },
];

const expandDateRange = (startsOn: string, endsOn: string) => {
  const dates: Date[] = [];
  const start = new Date(`${startsOn}T00:00:00`);
  const end = new Date(`${endsOn}T00:00:00`);

  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + 86_400_000)) {
    dates.push(new Date(cursor));
  }
  return dates;
};

export default function OwnerPlaceManagePage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const placeId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  const [priceRuleForm, setPriceRuleForm] = useState({
    startsOn: "",
    endsOn: "",
    nightlyPrice: "",
  });
  const [placeBlockForm, setPlaceBlockForm] = useState({
    startsOn: "",
    endsOn: "",
    reason: "",
  });
  const [roomBlockForm, setRoomBlockForm] = useState({
    startsOn: "",
    endsOn: "",
    reason: "",
  });
  const [roomRateForm, setRoomRateForm] = useState({
    startsOn: "",
    endsOn: "",
    nightlyPrice: "",
    minStayNights: "1",
  });

  const placeQuery = useQuery({
    queryKey: ["owner-place-detail", placeId],
    queryFn: () => api.owner.places.getById(placeId),
  });
  const place = placeQuery.data?.place;
  const isHotel = place?.kind === "hotel_pension";
  const isVilla = [
    "villa",
    "bungalow_tiny_house",
    "detached_house_apartment",
    "camp_site",
  ].includes(place?.kind ?? "");

  const roomsQuery = useQuery({
    queryKey: ["owner-place-rooms", placeId],
    queryFn: () => api.owner.places.listRooms(placeId),
    enabled: isHotel,
  });

  const rooms = roomsQuery.data?.rooms ?? [];
  useEffect(() => {
    if (!isHotel) return;
    if (rooms.length === 0) {
      setSelectedRoomId("");
      return;
    }
    if (!rooms.some((room) => String(room.id) === selectedRoomId)) {
      setSelectedRoomId(String(rooms[0].id));
    }
  }, [isHotel, rooms, selectedRoomId]);

  const reservationsQuery = useQuery({
    queryKey: ["owner-place-reservations", placeId],
    queryFn: () => api.owner.places.listReservations(placeId, { page: 1, limit: 100 }),
    enabled: Boolean(placeId),
  });

  const priceRulesQuery = useQuery({
    queryKey: ["owner-place-price-rules", placeId],
    queryFn: () => api.owner.places.listPriceRules(placeId),
    enabled: isHotel || isVilla,
  });

  const placeBlocksQuery = useQuery({
    queryKey: ["owner-place-blocks", placeId],
    queryFn: () => api.owner.places.listAvailabilityBlocks(placeId),
    enabled: isVilla,
  });

  const roomBlocksQuery = useQuery({
    queryKey: ["owner-room-blocks", placeId, selectedRoomId],
    queryFn: () => api.owner.places.listRoomAvailabilityBlocks(placeId, selectedRoomId),
    enabled: isHotel && Boolean(selectedRoomId),
  });

  const roomRatesQuery = useQuery({
    queryKey: ["owner-room-rates", placeId, selectedRoomId],
    queryFn: () => api.owner.places.listRoomRates(placeId, selectedRoomId),
    enabled: isHotel && Boolean(selectedRoomId),
  });

  const invalidateManageQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["owner-place-reservations", placeId] }),
      queryClient.invalidateQueries({ queryKey: ["owner-place-price-rules", placeId] }),
      queryClient.invalidateQueries({ queryKey: ["owner-place-blocks", placeId] }),
      queryClient.invalidateQueries({ queryKey: ["owner-room-blocks", placeId, selectedRoomId] }),
      queryClient.invalidateQueries({ queryKey: ["owner-room-rates", placeId, selectedRoomId] }),
    ]);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({
      reservationId,
      status,
    }: {
      reservationId: string;
      status: "confirmed" | "cancelled";
    }) => api.owner.places.updateReservationStatus(placeId, reservationId, { status }),
    onSuccess: async () => {
      toast.success("Rezervasyon durumu güncellendi");
      await invalidateManageQueries();
    },
    onError: (error: Error) => toast.error(error.message || "İşlem başarısız"),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({
      reservationId,
      paymentStatus,
    }: {
      reservationId: string;
      paymentStatus: "pending" | "paid" | "refunded";
    }) => api.owner.places.updateReservationPayment(placeId, reservationId, { paymentStatus }),
    onSuccess: async () => {
      toast.success("Ödeme durumu güncellendi");
      await invalidateManageQueries();
    },
    onError: (error: Error) => toast.error(error.message || "İşlem başarısız"),
  });

  const createPriceRuleMutation = useMutation({
    mutationFn: () =>
      api.owner.places.createPriceRule(placeId, {
        startsOn: priceRuleForm.startsOn,
        endsOn: priceRuleForm.endsOn,
        nightlyPrice: Number(priceRuleForm.nightlyPrice),
      }),
    onSuccess: async () => {
      toast.success("Fiyat kuralı eklendi");
      setPriceRuleForm({ startsOn: "", endsOn: "", nightlyPrice: "" });
      await invalidateManageQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Fiyat kuralı eklenemedi"),
  });

  const deletePriceRuleMutation = useMutation({
    mutationFn: (ruleId: string) => api.owner.places.deletePriceRule(placeId, ruleId),
    onSuccess: async () => {
      toast.success("Fiyat kuralı silindi");
      await invalidateManageQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Fiyat kuralı silinemedi"),
  });

  const createPlaceBlockMutation = useMutation({
    mutationFn: () =>
      api.owner.places.createAvailabilityBlock(placeId, {
        startsOn: placeBlockForm.startsOn,
        endsOn: placeBlockForm.endsOn,
        reason: placeBlockForm.reason.trim() || undefined,
      }),
    onSuccess: async () => {
      toast.success("Takvim bloğu eklendi");
      setPlaceBlockForm({ startsOn: "", endsOn: "", reason: "" });
      await invalidateManageQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Takvim bloğu eklenemedi"),
  });

  const deletePlaceBlockMutation = useMutation({
    mutationFn: (blockId: string) => api.owner.places.deleteAvailabilityBlock(placeId, blockId),
    onSuccess: async () => {
      toast.success("Takvim bloğu silindi");
      await invalidateManageQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Takvim bloğu silinemedi"),
  });

  const createRoomBlockMutation = useMutation({
    mutationFn: () =>
      api.owner.places.createRoomAvailabilityBlock(placeId, selectedRoomId, {
        startsOn: roomBlockForm.startsOn,
        endsOn: roomBlockForm.endsOn,
        reason: roomBlockForm.reason.trim() || undefined,
      }),
    onSuccess: async () => {
      toast.success("Oda takvim bloğu eklendi");
      setRoomBlockForm({ startsOn: "", endsOn: "", reason: "" });
      await invalidateManageQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Oda takvim bloğu eklenemedi"),
  });

  const deleteRoomBlockMutation = useMutation({
    mutationFn: (blockId: string) =>
      api.owner.places.deleteRoomAvailabilityBlock(placeId, selectedRoomId, blockId),
    onSuccess: async () => {
      toast.success("Oda takvim bloğu silindi");
      await invalidateManageQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Oda takvim bloğu silinemedi"),
  });

  const createRoomRateMutation = useMutation({
    mutationFn: () =>
      api.owner.places.createRoomRate(placeId, selectedRoomId, {
        startsOn: roomRateForm.startsOn,
        endsOn: roomRateForm.endsOn,
        nightlyPrice: Number(roomRateForm.nightlyPrice),
        minStayNights: Number(roomRateForm.minStayNights || "1"),
        isRefundable: true,
      }),
    onSuccess: async () => {
      toast.success("Oda fiyat kuralı eklendi");
      setRoomRateForm({
        startsOn: "",
        endsOn: "",
        nightlyPrice: "",
        minStayNights: "1",
      });
      await invalidateManageQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Oda fiyat kuralı eklenemedi"),
  });

  const deleteRoomRateMutation = useMutation({
    mutationFn: (rateId: string) =>
      api.owner.places.deleteRoomRate(placeId, selectedRoomId, rateId),
    onSuccess: async () => {
      toast.success("Oda fiyat kuralı silindi");
      await invalidateManageQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Oda fiyat kuralı silinemedi"),
  });

  const reservations = reservationsQuery.data?.reservations ?? [];
  const priceRules = priceRulesQuery.data?.rules ?? [];
  const placeBlocks = placeBlocksQuery.data?.blocks ?? [];
  const roomBlocks = roomBlocksQuery.data?.blocks ?? [];
  const roomRates = (roomRatesQuery.data?.rates ?? []) as Array<{
    id: string;
    startsOn: string;
    endsOn: string;
    nightlyPrice: string;
    minStayNights: number;
  }>;

  const confirmedReservationDays = useMemo(() => {
    return reservations
      .filter((item) => {
        if (item.status !== "confirmed") return false;
        if (!isHotel) return true;
        return item.roomId === selectedRoomId;
      })
      .flatMap((item) => expandDateRange(item.checkInDate, item.checkOutDate));
  }, [isHotel, reservations, selectedRoomId]);

  const blockedDays = useMemo(() => {
    if (isHotel) {
      return roomBlocks.flatMap((item) => expandDateRange(item.startsOn, item.endsOn));
    }
    return placeBlocks.flatMap((item) => expandDateRange(item.startsOn, item.endsOn));
  }, [isHotel, placeBlocks, roomBlocks]);

  if (placeQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Mekan yönetim paneli yükleniyor...
      </div>
    );
  }

  if (!place) {
    return (
      <div className="rounded-xl border p-6">
        <p className="text-muted-foreground">Mekan bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{place.name}</h1>
          <p className="text-sm text-muted-foreground">
            Rezervasyon, takvim ve fiyat yönetimi
          </p>
        </div>
        <Link href={`/dashboard/places/${placeId}/edit`}>
          <Button variant="outline">Mekan Düzenle</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border p-2">
        {tabItems.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id)}
            className="rounded-lg"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "calendar" ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-xl border p-4">
            <div className="mb-4 flex items-center gap-2 font-medium">
              <CalendarDays className="h-4 w-4" />
              Takvim Görünümü
            </div>
            <Calendar
              mode="multiple"
              numberOfMonths={2}
              modifiers={{
                blocked: blockedDays,
                occupied: confirmedReservationDays,
              }}
              modifiersStyles={{
                blocked: { backgroundColor: "#FEE2E2", color: "#991B1B" },
                occupied: { backgroundColor: "#DBEAFE", color: "#1E3A8A" },
              }}
            />
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm bg-red-100" />
                Engelli
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm bg-blue-100" />
                Onaylı rezervasyon
              </span>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h2 className="mb-4 font-medium">Yeni Takvim Bloğu</h2>
            {isHotel ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Oda</Label>
                  <select
                    className="h-10 w-full rounded-lg border px-3 text-sm"
                    value={selectedRoomId}
                    onChange={(event) => setSelectedRoomId(event.target.value)}
                  >
                    {rooms.map((room) => (
                      <option key={String(room.id)} value={String(room.id)}>
                        {String(room.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Başlangıç</Label>
                    <Input
                      type="date"
                      value={roomBlockForm.startsOn}
                      onChange={(event) =>
                        setRoomBlockForm((prev) => ({ ...prev, startsOn: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Bitiş</Label>
                    <Input
                      type="date"
                      value={roomBlockForm.endsOn}
                      onChange={(event) =>
                        setRoomBlockForm((prev) => ({ ...prev, endsOn: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Not</Label>
                  <Input
                    value={roomBlockForm.reason}
                    onChange={(event) =>
                      setRoomBlockForm((prev) => ({ ...prev, reason: event.target.value }))
                    }
                    placeholder="Opsiyonel açıklama"
                  />
                </div>
                <Button
                  onClick={() => createRoomBlockMutation.mutate()}
                  disabled={!selectedRoomId || createRoomBlockMutation.isPending}
                  className="w-full"
                >
                  Bloğu Kaydet
                </Button>

                <div className="space-y-2 border-t pt-4">
                  {roomBlocks.map((block) => (
                    <div key={block.id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <span>
                        {block.startsOn} - {block.endsOn}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteRoomBlockMutation.mutate(block.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Başlangıç</Label>
                    <Input
                      type="date"
                      value={placeBlockForm.startsOn}
                      onChange={(event) =>
                        setPlaceBlockForm((prev) => ({ ...prev, startsOn: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Bitiş</Label>
                    <Input
                      type="date"
                      value={placeBlockForm.endsOn}
                      onChange={(event) =>
                        setPlaceBlockForm((prev) => ({ ...prev, endsOn: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Not</Label>
                  <Input
                    value={placeBlockForm.reason}
                    onChange={(event) =>
                      setPlaceBlockForm((prev) => ({ ...prev, reason: event.target.value }))
                    }
                    placeholder="Opsiyonel açıklama"
                  />
                </div>
                <Button
                  onClick={() => createPlaceBlockMutation.mutate()}
                  disabled={createPlaceBlockMutation.isPending}
                  className="w-full"
                >
                  Bloğu Kaydet
                </Button>

                <div className="space-y-2 border-t pt-4">
                  {placeBlocks.map((block) => (
                    <div key={block.id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <span>
                        {block.startsOn} - {block.endsOn}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deletePlaceBlockMutation.mutate(block.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "reservations" ? (
        <div className="space-y-4">
          {reservationsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Rezervasyonlar yükleniyor...
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Rezervasyon bulunmuyor.
            </div>
          ) : (
            reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {reservation.travelerName || reservation.travelerEmail}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {reservation.checkInDate} - {reservation.checkOutDate}
                      {reservation.roomName ? ` · ${reservation.roomName}` : ""}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Referans: {reservation.bookingReference}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {Number(reservation.totalPrice).toLocaleString("tr-TR")} ₺
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Durum: {reservation.status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ödeme: {reservation.paymentStatus}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {reservation.status === "pending" ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          reservationId: reservation.id,
                          status: "confirmed",
                        })
                      }
                    >
                      Onayla
                    </Button>
                  ) : null}
                  {reservation.status !== "cancelled" && reservation.status !== "completed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          reservationId: reservation.id,
                          status: "cancelled",
                        })
                      }
                    >
                      İptal Et
                    </Button>
                  ) : null}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updatePaymentMutation.mutate({
                        reservationId: reservation.id,
                        paymentStatus: "paid",
                      })
                    }
                  >
                    Ödendi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updatePaymentMutation.mutate({
                        reservationId: reservation.id,
                        paymentStatus: "refunded",
                      })
                    }
                  >
                    İade
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {activeTab === "pricing" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-xl border p-4">
            <div className="mb-3 flex items-center gap-2 font-medium">
              <CreditCard className="h-4 w-4" />
              Yeni Fiyat Kuralı
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Başlangıç</Label>
                  <Input
                    type="date"
                    value={priceRuleForm.startsOn}
                    onChange={(event) =>
                      setPriceRuleForm((prev) => ({ ...prev, startsOn: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bitiş</Label>
                  <Input
                    type="date"
                    value={priceRuleForm.endsOn}
                    onChange={(event) =>
                      setPriceRuleForm((prev) => ({ ...prev, endsOn: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Gecelik Fiyat</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceRuleForm.nightlyPrice}
                  onChange={(event) =>
                    setPriceRuleForm((prev) => ({
                      ...prev,
                      nightlyPrice: event.target.value,
                    }))
                  }
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createPriceRuleMutation.mutate()}
                disabled={createPriceRuleMutation.isPending}
              >
                Kuralı Kaydet
              </Button>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="mb-4 flex items-center gap-2 font-medium">
              <ListChecks className="h-4 w-4" />
              Tarih Bazlı Fiyat Kuralları
            </div>
            {priceRulesQuery.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Kurallar yükleniyor...
              </div>
            ) : priceRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz fiyat kuralı yok.</p>
            ) : (
              <div className="space-y-2">
                {priceRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <p>
                        {rule.startsOn} - {rule.endsOn}
                      </p>
                      <p className="text-muted-foreground">
                        {Number(rule.nightlyPrice).toLocaleString("tr-TR")} ₺
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePriceRuleMutation.mutate(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isHotel ? (
            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <CreditCard className="h-4 w-4" />
                Oda Bazlı Fiyat Kuralları
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Oda</Label>
                  <select
                    className="h-10 w-full rounded-lg border px-3 text-sm"
                    value={selectedRoomId}
                    onChange={(event) => setSelectedRoomId(event.target.value)}
                  >
                    {rooms.map((room) => (
                      <option key={String(room.id)} value={String(room.id)}>
                        {String(room.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Başlangıç</Label>
                    <Input
                      type="date"
                      value={roomRateForm.startsOn}
                      onChange={(event) =>
                        setRoomRateForm((prev) => ({ ...prev, startsOn: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Bitiş</Label>
                    <Input
                      type="date"
                      value={roomRateForm.endsOn}
                      onChange={(event) =>
                        setRoomRateForm((prev) => ({ ...prev, endsOn: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Gecelik Fiyat</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={roomRateForm.nightlyPrice}
                      onChange={(event) =>
                        setRoomRateForm((prev) => ({
                          ...prev,
                          nightlyPrice: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Min Gece</Label>
                    <Input
                      type="number"
                      min={1}
                      value={roomRateForm.minStayNights}
                      onChange={(event) =>
                        setRoomRateForm((prev) => ({
                          ...prev,
                          minStayNights: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => createRoomRateMutation.mutate()}
                  disabled={!selectedRoomId || createRoomRateMutation.isPending}
                >
                  Oda Kuralı Kaydet
                </Button>

                <div className="space-y-2 border-t pt-4">
                  {roomRatesQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Oda kuralları yükleniyor...
                    </div>
                  ) : roomRates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Henüz oda fiyat kuralı yok.</p>
                  ) : (
                    roomRates.map((rate) => (
                      <div
                        key={rate.id}
                        className="flex items-center justify-between rounded border p-2 text-sm"
                      >
                        <div>
                          <p>
                            {rate.startsOn} - {rate.endsOn}
                          </p>
                          <p className="text-muted-foreground">
                            {Number(rate.nightlyPrice).toLocaleString("tr-TR")} ₺ · Min{" "}
                            {rate.minStayNights} gece
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteRoomRateMutation.mutate(rate.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
