"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LoaderCircle, ArrowRight, Sparkles } from "lucide-react";

import { useFeaturedPlaces } from "@/hooks/use-featured-content";

import { PlaceCard } from "./place-card";

const SECTION_TITLE = "Öne Çıkan Konaklamalar";
const SECTION_SUBTITLE =
  "Misafir yorumlarıyla öne çıkan, özenle seçilmiş tatil evleri ve villalar.";

export function FeaturedPlacesSection() {
  const { data, isLoading } = useFeaturedPlaces();

  const places = useMemo(() => data ?? [], [data]);

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <Sparkles className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Editör Seçimi
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {SECTION_TITLE}
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            {SECTION_SUBTITLE}
          </p>
        </div>
        <Link
          href="/places?featured=true"
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Tümünü Gör
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/70 bg-white/70 py-16">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : places.length === 0 ? (
        <div className="rounded-2xl bg-white/50 p-8 text-center text-sm text-muted-foreground">
          Öne çıkan konaklama bulunamadı.
        </div>
      ) : (
        /* Places Grid */
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {places.map((place, index) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <PlaceCard place={place} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
