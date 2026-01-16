"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-orange-100 text-orange-800",
} as const;

const STATUS_LABELS = {
  pending: "Beklemede",
  active: "Yayınlanmış",
  rejected: "Reddedilmiş",
  inactive: "Pasif",
  suspended: "Askıya Alınmış",
} as const;

type PlaceStatus = keyof typeof STATUS_COLORS;

export default function PlacesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlaceStatus | "all">("all");

  const { data: placesData, isLoading } = useQuery({
    queryKey: ["owner-places", statusFilter, searchQuery],
    queryFn: () =>
      api.owner.places.list({
        page: 1,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const deletePlaceMutation = useMutation({
    mutationFn: (placeId: string) => api.owner.places.delete(placeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-places"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      alert(error.message || "Silme işlemi başarısız oldu");
    },
  });

  const places = placesData?.places || [];
  const usage = usageData?.usage;

  const filteredPlaces = places.filter((place) => {
    const matchesSearch =
      !searchQuery ||
      place.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || place.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (placeId: string, placeName: string) => {
    if (
      window.confirm(`${placeName} mekanını silmek istediğinize emin misiniz?`)
    ) {
      deletePlaceMutation.mutate(placeId);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Mekanlarım</h1>
        <p className="text-muted-foreground">
          Yayınlanan mekanlarınızı ve beklemede bekleyen başvurularınızı yönetin
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Mekan ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as PlaceStatus | "all")
              }
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="active">Yayınlanmış</option>
              <option value="rejected">Reddedilmiş</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>

          <Link href="/dashboard/places/create">
            <Button>
              <Plus className="mr-2 size-4" />
              Mekan Ekle
            </Button>
          </Link>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredPlaces.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-lg text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Arama kriterlerinize uygun mekan bulunamadı."
              : "Henüz mekan eklemediniz."}
          </p>
          <Link href="/dashboard/places/create">
            <Button>
              <Plus className="mr-2 size-4" />
              İlk Mekanı Ekle
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((place) => (
            <Card key={place.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    STATUS_COLORS[place.status as PlaceStatus],
                  )}
                >
                  <span className="text-sm font-semibold">
                    {STATUS_LABELS[place.status as PlaceStatus]}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">{place.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {place.category} • {place.city || "Bulunmuyor"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link href={`/places/${place.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Eye className="size-4" />
                    </Button>
                  </Link>

                  <Link href={`/dashboard/places/${place.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="size-4" />
                    </Button>
                  </Link>

                  {place.status !== "active" && place.status !== "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(place.id, place.name)}
                      disabled={deletePlaceMutation.isPending}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {usage && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Plan Kullanımı</h3>
              <p className="text-sm text-muted-foreground">
                {usage.places.current} / {usage.places.max} mekan kullanılıyor
              </p>
            </div>
            {(usage.places.current || 0) >= (usage.places.max || 1) && (
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/pricing")}
              >
                Planı Yükselt
              </Button>
            )}
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${((usage.places.current || 0) / (usage.places.max || 1)) * 100}%`,
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
