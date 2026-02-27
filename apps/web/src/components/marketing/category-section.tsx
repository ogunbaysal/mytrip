"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Compass,
  Home,
  LoaderCircle,
  MapPin,
  Ship,
  Sparkles,
  Tent,
} from "lucide-react";

import { getPlaceKindLabel } from "@/lib/place-kind";
import { usePlaceTypes } from "@/hooks/use-featured-content";

const SECTION_TITLE = "Ne Arıyorsunuz?";
const SECTION_SUBTITLE =
  "Bir kategori seçin, arama sayfasında size uygun sonuçlara direkt geçin.";

const KIND_ORDER = [
  "villa",
  "bungalow_tiny_house",
  "hotel_pension",
  "detached_house_apartment",
  "camp_site",
  "transfer",
  "boat_tour",
  "paragliding_microlight_skydiving",
  "safari",
  "water_sports",
  "ski",
  "balloon_tour",
] as const;

const KIND_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  villa: Home,
  bungalow_tiny_house: Home,
  hotel_pension: Building2,
  detached_house_apartment: Home,
  camp_site: Tent,
  transfer: MapPin,
  boat_tour: Ship,
  paragliding_microlight_skydiving: Compass,
  safari: Compass,
  water_sports: Ship,
  ski: Sparkles,
  balloon_tour: Sparkles,
  stay: Home,
  activity: Compass,
};

type CategoryItem = {
  id: string;
  title: string;
  description: string;
};

function sortByKindOrder(a: CategoryItem, b: CategoryItem) {
  const ia = KIND_ORDER.indexOf(a.id as (typeof KIND_ORDER)[number]);
  const ib = KIND_ORDER.indexOf(b.id as (typeof KIND_ORDER)[number]);

  if (ia === -1 && ib === -1) return a.title.localeCompare(b.title, "tr");
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}

export function CategorySection() {
  const { data: types, isLoading } = usePlaceTypes();

  const items: CategoryItem[] = (types ?? [])
    .map((item) => ({
      id: item.id,
      title: getPlaceKindLabel(item.id, item.title),
      description:
        item.description?.trim() ||
        `${item.count ?? 0} seçenek`,
    }))
    .sort(sortByKindOrder);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {SECTION_TITLE}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          {SECTION_SUBTITLE}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/70 bg-white/70 py-16">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => {
            const Icon = KIND_ICON[item.id] ?? MapPin;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.28, delay: index * 0.04 }}
              >
                <Link
                  href={`/places?category=${encodeURIComponent(item.id)}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                >
                  <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="size-5" aria-hidden />
                  </span>

                  <h3 className="text-lg font-semibold leading-tight text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </Link>
              </motion.div>
            );
          })}

          {items.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-white/60 p-8 text-sm text-muted-foreground">
              Kategori bulunamadı.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
