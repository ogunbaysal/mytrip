"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { LoaderCircle, Building2, Home, Gamepad2, UtensilsCrossed, Coffee, MapPin, Tent, Ship } from "lucide-react";

import { usePlaceTypes } from "@/hooks/use-featured-content";

const CATEGORY_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  hotel: Building2,
  villa: Home,
  stay: Home,
  entertainment: Gamepad2, // or activity
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  attraction: MapPin,
  activity: Tent,
  transport: Ship,
};

export function CategorySection() {
  const { data: types, isLoading } = usePlaceTypes();

  // Fallback if data is empty or loading failed, though hook handles error by returning empty usually
  // Ideally we might want to keep the static list as initial data or fallback
  
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Ne arıyorsunuz?</h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            Konaklama, yemek ve eğlence seçeneklerini keşfedin.
          </p>
        </div>
      </div>
      
      {isLoading ? (
         <div className="flex items-center justify-center rounded-3xl border border-dashed border-border/70 bg-white/70 py-12">
           <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
         </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {types?.map(({ id, title, description }) => {
            // Map icon loosely based on ID or normalized name
            const iconKey = id.toLowerCase();
            // Try specific key, then check for common mappings
            let Icon = CATEGORY_ICON[iconKey];
            if (!Icon) {
                if (iconKey === 'hotels') Icon = CATEGORY_ICON.hotel;
                else if (iconKey === 'villas') Icon = CATEGORY_ICON.villa;
                else if (iconKey === 'restaurants') Icon = CATEGORY_ICON.restaurant;
                else if (iconKey === 'cafes') Icon = CATEGORY_ICON.cafe;
                else Icon = MapPin; // default
            }

            return (
              <Link
                key={id}
                href={`/places?type=${id}`}
                className="group flex min-w-[160px] flex-col items-start gap-3 rounded-3xl border border-transparent bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-foreground">{title}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </Link>
            );
          })}
          {(!types || types.length === 0) && (
            <div className="text-sm text-muted-foreground p-4">Kategori bulunamadı.</div>
          )}
        </div>
      )}
    </section>
  );
}
