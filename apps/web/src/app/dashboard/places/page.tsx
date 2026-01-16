"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Building2,
  MapPin,
  MoreVertical,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PageHeader,
  DashboardCard,
  StatusBadge,
  EmptyState,
  ProgressBar,
} from "@/components/dashboard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type PlaceStatus = "pending" | "active" | "rejected" | "inactive" | "suspended";

const STATUS_OPTIONS: { value: PlaceStatus | "all"; label: string }[] = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "active", label: "Yayında" },
  { value: "pending", label: "Beklemede" },
  { value: "rejected", label: "Reddedildi" },
  { value: "inactive", label: "Pasif" },
  { value: "suspended", label: "Askıda" },
];

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

  const usagePercentage = usage
    ? Math.round(((usage.places.current || 0) / (usage.places.max || 1)) * 100)
    : 0;

  const canAddPlace =
    usage && (usage.places.current || 0) < (usage.places.max || 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Mekanlarım"
        description="Yayınlanan mekanlarınızı ve beklemede olan başvurularınızı yönetin"
        icon={<Building2 className="size-5" />}
        actions={
          canAddPlace ? (
            <Link href="/dashboard/places/create">
              <Button className="gap-2">
                <Plus className="size-4" />
                Mekan Ekle
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => (window.location.href = "/pricing")}
            >
              <TrendingUp className="size-4" />
              Planı Yükselt
            </Button>
          )
        }
      />

      {/* Search and Filters */}
      <DashboardCard padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Mekan ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as PlaceStatus | "all")
            }
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </DashboardCard>

      {/* Content */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Mekanlar yükleniyor...
            </p>
          </div>
        </div>
      ) : filteredPlaces.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-8" />}
          title={
            searchQuery || statusFilter !== "all"
              ? "Sonuç Bulunamadı"
              : "Henüz Mekan Yok"
          }
          description={
            searchQuery || statusFilter !== "all"
              ? "Arama kriterlerinize uygun mekan bulunamadı. Filtreleri değiştirmeyi deneyin."
              : "İlk mekanınızı ekleyerek müşterilerinize ulaşmaya başlayın."
          }
          actionLabel="İlk Mekanı Ekle"
          actionHref={canAddPlace ? "/dashboard/places/create" : undefined}
          onAction={
            !canAddPlace ? () => (window.location.href = "/pricing") : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((place, index) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <DashboardCard hoverable padding="none">
                {/* Image / Status Banner */}
                <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200">
                  {place.images?.[0] ? (
                    <Image
                      src={place.images[0]}
                      alt={place.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 className="size-12 text-slate-300" />
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute left-3 top-3">
                    <StatusBadge status={place.status as PlaceStatus} />
                  </div>

                  {/* Actions dropdown */}
                  <div className="absolute right-3 top-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-8 bg-white/90 backdrop-blur-sm hover:bg-white"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/places/${place.slug}`}
                            target="_blank"
                            className="flex items-center gap-2"
                          >
                            <Eye className="size-4" />
                            Görüntüle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/places/${place.id}/edit`}
                            className="flex items-center gap-2"
                          >
                            <Edit className="size-4" />
                            Düzenle
                          </Link>
                        </DropdownMenuItem>
                        {place.status !== "active" &&
                          place.status !== "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDelete(place.id, place.name)
                                }
                                className="text-red-600 focus:text-red-600"
                                disabled={deletePlaceMutation.isPending}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Sil
                              </DropdownMenuItem>
                            </>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-foreground line-clamp-1">
                    {place.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="line-clamp-1">
                      {place.city || place.district || "Konum belirtilmemiş"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {place.category}
                  </p>
                </div>
              </DashboardCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Usage Footer */}
      {usage && (
        <DashboardCard padding="md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Plan Kullanımı</h3>
              <p className="text-sm text-muted-foreground">
                {usage.places.current} / {usage.places.max} mekan kullanılıyor
              </p>
            </div>

            <div className="w-full md:w-64">
              <ProgressBar
                value={usagePercentage}
                showLabel
                label={`${usagePercentage}%`}
              />
            </div>

            {!canAddPlace && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/pricing")}
              >
                Planı Yükselt
              </Button>
            )}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
