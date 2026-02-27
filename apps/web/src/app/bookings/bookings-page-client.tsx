"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Users, BedDouble, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
});

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  cancelled: "İptal",
  completed: "Tamamlandı",
};

const paymentLabels: Record<string, string> = {
  pending: "Ödeme Bekliyor",
  paid: "Ödendi",
  refunded: "İade Edildi",
};

export function BookingsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const placeSlugParam = searchParams.get("place");
  const initialCheckIn = searchParams.get("checkIn") || "";
  const initialCheckOut = searchParams.get("checkOut") || "";
  const initialGuests = Number(searchParams.get("adults") || "1");

  const [checkInDate, setCheckInDate] = useState(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut);
  const [guests, setGuests] = useState(Number.isFinite(initialGuests) ? initialGuests : 1);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState("");

  const checkoutMode = Boolean(placeSlugParam);

  const placeQuery = useQuery({
    queryKey: ["booking-place", placeSlugParam],
    queryFn: () => api.places.getBySlug(placeSlugParam as string),
    enabled: checkoutMode && Boolean(placeSlugParam),
  });

  const place = placeQuery.data;
  const isHotel = place?.kind === "hotel_pension";

  const roomsQuery = useQuery({
    queryKey: ["booking-rooms", place?.id, checkInDate, checkOutDate, guests],
    queryFn: () =>
      api.bookings.listRooms({
        placeId: place!.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
      }),
    enabled:
      checkoutMode &&
      Boolean(place?.id) &&
      isHotel &&
      Boolean(checkInDate) &&
      Boolean(checkOutDate) &&
      guests > 0,
  });

  const availableRooms = useMemo(
    () => (roomsQuery.data?.rooms ?? []).filter((room) => room.available),
    [roomsQuery.data?.rooms],
  );

  useEffect(() => {
    if (!isHotel) return;
    if (availableRooms.length === 0) {
      setSelectedRoomId("");
      return;
    }

    if (!availableRooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(availableRooms[0].id);
    }
  }, [availableRooms, isHotel, selectedRoomId]);

  const quoteQuery = useQuery({
    queryKey: ["booking-quote", place?.id, selectedRoomId, checkInDate, checkOutDate, guests],
    queryFn: () =>
      api.bookings.quote({
        placeId: place!.id,
        roomId: isHotel ? selectedRoomId : undefined,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
      }),
    enabled:
      checkoutMode &&
      Boolean(place?.id) &&
      Boolean(checkInDate) &&
      Boolean(checkOutDate) &&
      guests > 0 &&
      (!isHotel || Boolean(selectedRoomId)),
  });

  const createReservation = useMutation({
    mutationFn: () =>
      api.bookings.create({
        placeId: place!.id,
        roomId: isHotel ? selectedRoomId : undefined,
        checkInDate,
        checkOutDate,
        guests,
        specialRequests: specialRequests.trim() || undefined,
      }),
    onSuccess: (result) => {
      toast.success("Rezervasyon oluşturuldu");
      router.replace(`/bookings?reservationId=${result.booking.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Rezervasyon oluşturulamadı");
    },
  });

  const myReservationsQuery = useQuery({
    queryKey: ["my-reservations"],
    queryFn: () => api.bookings.listMine(),
    enabled: !checkoutMode,
  });

  const canReserve =
    checkoutMode &&
    Boolean(place?.id) &&
    Boolean(checkInDate) &&
    Boolean(checkOutDate) &&
    guests > 0 &&
    (!isHotel || Boolean(selectedRoomId)) &&
    Boolean(quoteQuery.data?.quote);

  if (!checkoutMode) {
    const reservations = myReservationsQuery.data?.reservations ?? [];
    return (
      <div className="container mx-auto space-y-6 px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Rezervasyonlarım</h1>
          <Link href="/places">
            <Button>Yeni Rezervasyon</Button>
          </Link>
        </div>

        {myReservationsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Rezervasyonlar yükleniyor...
          </div>
        ) : reservations.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-muted-foreground">Henüz rezervasyonunuz yok.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{reservation.placeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {reservation.checkInDate} - {reservation.checkOutDate}
                      {reservation.roomName ? ` · ${reservation.roomName}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Referans: {reservation.bookingReference}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {currencyFormatter.format(Number(reservation.totalPrice || 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {statusLabels[reservation.status] || reservation.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {paymentLabels[reservation.paymentStatus] || reservation.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Rezervasyon Tamamla</h1>

      {placeQuery.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Mekan bilgisi yükleniyor...
        </div>
      ) : !place ? (
        <div className="rounded-xl border p-8 text-center">
          <p className="mb-4 text-muted-foreground">Mekan bulunamadı.</p>
          <Link href="/places">
            <Button>Mekanları Gör</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-5 rounded-xl border p-5">
            <div>
              <p className="text-sm text-muted-foreground">Mekan</p>
              <p className="text-lg font-semibold">{place.name}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Giriş</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={checkInDate}
                  onChange={(event) => setCheckInDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Çıkış</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={checkOutDate}
                  onChange={(event) => setCheckOutDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Misafir</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  max={30}
                  value={guests}
                  onChange={(event) =>
                    setGuests(Math.max(1, Number.parseInt(event.target.value || "1", 10) || 1))
                  }
                />
              </div>
            </div>

            {isHotel ? (
              <div className="space-y-2">
                <Label>Oda Seçimi</Label>
                {roomsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Odalar yükleniyor...</p>
                ) : availableRooms.length === 0 ? (
                  <p className="text-sm text-red-600">Bu tarihler için müsait oda bulunamadı.</p>
                ) : (
                  <div className="grid gap-2">
                    {availableRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        className={`rounded-lg border p-3 text-left transition ${
                          selectedRoomId === room.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                        onClick={() => setSelectedRoomId(room.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">{room.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Maks {room.maxGuests} misafir
                            </p>
                          </div>
                          <BedDouble className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="specialRequests">Özel İstekler</Label>
              <Input
                id="specialRequests"
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
                placeholder="Opsiyonel not"
              />
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <h2 className="mb-4 text-lg font-semibold">Fiyat Özeti</h2>
            {quoteQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Fiyat hesaplanıyor...
              </div>
            ) : quoteQuery.error ? (
              <p className="text-sm text-red-600">
                {(quoteQuery.error as Error).message || "Fiyat hesaplanamadı"}
              </p>
            ) : quoteQuery.data?.quote ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {quoteQuery.data.quote.checkInDate} - {quoteQuery.data.quote.checkOutDate}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {quoteQuery.data.quote.guests} misafir
                  </div>
                </div>
                <div className="max-h-40 space-y-2 overflow-auto border-t pt-3 text-sm">
                  {quoteQuery.data.quote.nightlyLines.map((line) => (
                    <div key={line.date} className="flex items-center justify-between">
                      <span>{line.date}</span>
                      <span>{currencyFormatter.format(line.nightlyPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t pt-3 font-semibold">
                  <span>Toplam</span>
                  <span>{currencyFormatter.format(quoteQuery.data.quote.total)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tarih ve misafir bilgilerini girerek fiyat alın.
              </p>
            )}

            <Button
              className="mt-5 w-full"
              disabled={!canReserve || createReservation.isPending}
              onClick={() => createReservation.mutate()}
            >
              {createReservation.isPending ? "Rezervasyon Oluşturuluyor..." : "Rezerve Et"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
