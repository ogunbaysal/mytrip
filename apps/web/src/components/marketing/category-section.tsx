"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LoaderCircle,
  Building2,
  Home,
  Gamepad2,
  UtensilsCrossed,
  Coffee,
  MapPin,
  Tent,
  Ship,
  ArrowRight,
} from "lucide-react";

import { usePlaceTypes } from "@/hooks/use-featured-content";

const CATEGORY_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  hotel: Building2,
  villa: Home,
  stay: Home,
  entertainment: Gamepad2,
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  attraction: MapPin,
  activity: Tent,
  transport: Ship,
};

const CATEGORY_GRADIENT: Record<string, string> = {
  hotel: "from-blue-500 to-blue-600",
  villa: "from-emerald-500 to-emerald-600",
  stay: "from-violet-500 to-violet-600",
  entertainment: "from-pink-500 to-pink-600",
  restaurant: "from-orange-500 to-orange-600",
  cafe: "from-amber-500 to-amber-600",
  attraction: "from-cyan-500 to-cyan-600",
  activity: "from-lime-500 to-lime-600",
  transport: "from-indigo-500 to-indigo-600",
};

const SECTION_TITLE = "Ne Arıyorsunuz?";
const SECTION_SUBTITLE =
  "Konaklama, yemek ve eğlence seçeneklerini kategoriye göre keşfedin.";

export function CategorySection() {
  const { data: types, isLoading } = usePlaceTypes();

  const getIconForType = (id: string) => {
    const iconKey = id.toLowerCase();
    let Icon = CATEGORY_ICON[iconKey];
    if (!Icon) {
      if (iconKey === "hotels") Icon = CATEGORY_ICON.hotel;
      else if (iconKey === "villas") Icon = CATEGORY_ICON.villa;
      else if (iconKey === "restaurants") Icon = CATEGORY_ICON.restaurant;
      else if (iconKey === "cafes") Icon = CATEGORY_ICON.cafe;
      else Icon = MapPin;
    }
    return Icon;
  };

  const getGradientForType = (id: string) => {
    const key = id.toLowerCase();
    return (
      CATEGORY_GRADIENT[key] ||
      CATEGORY_GRADIENT[key.replace(/s$/, "")] ||
      "from-slate-500 to-slate-600"
    );
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {SECTION_TITLE}
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            {SECTION_SUBTITLE}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/70 bg-white/70 py-16">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Category Cards */
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {types?.map(({ id, title, description }, index) => {
            const Icon = getIconForType(id);
            const gradient = getGradientForType(id);

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  href={`/places?type=${id}`}
                  className="group flex min-w-[180px] flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Icon with gradient background */}
                  <div
                    className={`inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-${gradient.split("-")[1]}/20`}
                  >
                    <Icon className="size-6" aria-hidden />
                  </div>

                  {/* Content */}
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {description}
                    </p>
                  </div>

                  {/* Explore link */}
                  <div className="mt-auto flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Keşfet
                    <ArrowRight className="size-3" />
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {(!types || types.length === 0) && (
            <div className="rounded-2xl bg-white/50 p-8 text-sm text-muted-foreground">
              Kategori bulunamadı.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
