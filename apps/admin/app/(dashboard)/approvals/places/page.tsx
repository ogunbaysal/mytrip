"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

type Place = {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  shortDescription: string;
  address: string;
  city: string;
  district: string;
  location: { lat: number; lng: number } | string;
  contactInfo: { phone?: string; email?: string; website?: string } | string;
  priceLevel: string;
  nightlyPrice: string;
  images: string[] | string;
  features: string[] | string;
  status: string;
  createdAt: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
};

export default function ApprovePlacesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending">("pending");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingPlaceId, setRejectingPlaceId] = useState<string | null>(null);

  const { data: placesData, isLoading } = useQuery({
    queryKey: ["admin-approvals-places", filter],
    queryFn: () =>
      api.approvals.places.list(filter === "all" ? {} : { status: filter }),
  });

  const places = placesData?.places || [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.approvals.places.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-approvals-places"] });
      alert("Mekan başarıyla onaylandı");
    },
    onError: (error: Error) => {
      alert(`Onaylama hatası: ${error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.approvals.places.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-approvals-places"] });
      setShowRejectDialog(false);
      setRejectReason("");
      setRejectingPlaceId(null);
      alert("Mekan reddedildi");
    },
    onError: (error: Error) => {
      alert(`Reddetme hatası: ${error.message}`);
    },
  });

  const handleApprove = (id: string) => {
    if (window.confirm("Bu mekanı onaylamak istediğinizden emin misiniz?")) {
      approveMutation.mutate(id);
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectingPlaceId(id);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      alert("Lütfen bir reddetme sebebi giriniz");
      return;
    }
    if (rejectingPlaceId) {
      rejectMutation.mutate({ id: rejectingPlaceId, reason: rejectReason });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const parseJSON = (data: string | object, fallback: any) => {
    if (typeof data === "object") return data;
    try {
      return JSON.parse(data as string);
    } catch {
      return fallback;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mekan Onayları</h1>
        <p className="text-muted-foreground">
          İşletme sahipleri tarafından eklenen mekanları inceleyip onaylayın
          veya reddedin.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          Bekleyen ({places.filter((p: Place) => p.status === "pending").length}
          )
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Tümü
        </Button>
      </div>

      <div className="space-y-4">
        {places.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Onay bekleyen mekan yok</h3>
            <p className="text-muted-foreground">
              {filter === "pending"
                ? "Şu anda onay bekleyen mekan bulunmuyor."
                : "Henüz mekan eklenmemiş."}
            </p>
          </Card>
        ) : (
          places.map((place: Place) => (
            <Card key={place.id} className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{place.name}</h3>
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {place.type}
                        </span>
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                          {place.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-4" />
                        {formatDate(place.createdAt)}
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        place.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : place.status === "active"
                            ? "bg-green-100 text-green-800"
                            : place.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {place.status === "pending"
                        ? "Beklemede"
                        : place.status === "active"
                          ? "Aktif"
                          : place.status === "rejected"
                            ? "Reddedildi"
                            : place.status}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="size-4 text-muted-foreground" />
                      {place.address}, {place.district}, {place.city}
                    </div>
                    {parseJSON(place.contactInfo, {}).phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="size-4 text-muted-foreground" />
                        {parseJSON(place.contactInfo, {}).phone}
                      </div>
                    )}
                    {parseJSON(place.contactInfo, {}).email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="size-4 text-muted-foreground" />
                        {parseJSON(place.contactInfo, {}).email}
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {place.shortDescription || place.description?.slice(0, 150)}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Gecelik:</span>
                    <span className="text-lg font-bold">
                      ₺{Number(place.nightlyPrice).toLocaleString("tr-TR")}
                    </span>
                    {place.priceLevel && (
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                        {place.priceLevel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Özellikler:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(parseJSON(place.features, []) as string[])
                        .slice(0, 5)
                        .map((feature, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-gray-100 px-2 py-1 text-xs"
                          >
                            {feature}
                          </span>
                        ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPlace(place)}
                  >
                    <Eye className="mr-2 size-4" />
                    Detayları Görüntüle
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {place.status === "pending" && (
                    <>
                      <Button
                        onClick={() => handleApprove(place.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 size-4" />
                        Onayla
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRejectClick(place.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="mr-2 size-4" />
                        Reddet
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={!!selectedPlace}
        onOpenChange={() => setSelectedPlace(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlace?.name}</DialogTitle>
          </DialogHeader>
          {selectedPlace && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-semibold">Mekan Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tip:</span>{" "}
                      {selectedPlace.type}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Kategori:</span>{" "}
                      {selectedPlace.category}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Fiyat Seviyesi:
                      </span>{" "}
                      {selectedPlace.priceLevel}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Gecelik Fiyat:
                      </span>{" "}
                      ₺
                      {Number(selectedPlace.nightlyPrice).toLocaleString(
                        "tr-TR",
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold">İletişim Bilgileri</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Adres:</span>{" "}
                      {selectedPlace.address}
                    </div>
                    <div>
                      <span className="text-muted-foreground">İlçe:</span>{" "}
                      {selectedPlace.district}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Şehir:</span>{" "}
                      {selectedPlace.city}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Telefon:</span>{" "}
                      {parseJSON(selectedPlace.contactInfo, {}).phone || "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">E-posta:</span>{" "}
                      {parseJSON(selectedPlace.contactInfo, {}).email || "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Website:</span>{" "}
                      {parseJSON(selectedPlace.contactInfo, {}).website ? (
                        <a
                          href={
                            parseJSON(selectedPlace.contactInfo, {}).website
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {parseJSON(selectedPlace.contactInfo, {}).website}
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Açıklama</h4>
                <p className="text-sm">{selectedPlace.description}</p>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Özellikler</h4>
                <div className="flex flex-wrap gap-2">
                  {(parseJSON(selectedPlace.features, []) as string[]).map(
                    (feature, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm"
                      >
                        {feature}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Görseller</h4>
                <div className="grid gap-2 md:grid-cols-3">
                  {(parseJSON(selectedPlace.images, []) as string[]).map(
                    (image, idx) => (
                      <img
                        key={idx}
                        src={image}
                        alt={`${selectedPlace.name} - ${idx + 1}`}
                        className="h-48 w-full rounded-lg object-cover"
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlace(null)}>
              Kapat
            </Button>
            {selectedPlace?.status === "pending" && (
              <>
                <Button
                  onClick={() => {
                    setSelectedPlace(null);
                    handleApprove(selectedPlace.id);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 size-4" />
                  Onayla
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setSelectedPlace(null);
                    handleRejectClick(selectedPlace.id);
                  }}
                >
                  <X className="mr-2 size-4" />
                  Reddet
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reddetme Sebebi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bu mekanı reddetme sebebinizi belirtiniz. İşletme sahibi bu sebep
              ile birlikte bilgilendirilecektir.
            </p>
            <Textarea
              placeholder="Reddetme sebebinizi buraya yazın..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <span className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <X className="mr-2 size-4" />
                  Reddet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
