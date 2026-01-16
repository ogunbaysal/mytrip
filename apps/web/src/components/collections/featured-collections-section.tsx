"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LoaderCircle, ArrowRight, Compass } from "lucide-react";

import { useFeaturedCollections } from "@/hooks/use-featured-content";

import { CollectionCard } from "./collection-card";

const SECTION_TITLE = "Temalı Koleksiyonlar";
const SECTION_SUBTITLE =
  "Seyahat editörlerinin hazırladığı özel rotaları keşfedin.";

export function FeaturedCollectionsSection() {
  const { data, isLoading } = useFeaturedCollections();

  const collections = useMemo(() => data ?? [], [data]);

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-violet-600">
            <Compass className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Rehberli Keşifler
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
          href="/collections"
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
      ) : collections.length === 0 ? (
        <div className="rounded-2xl bg-white/50 p-8 text-center text-sm text-muted-foreground">
          Koleksiyon bulunamadı.
        </div>
      ) : (
        /* Collections Grid */
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <CollectionCard collection={collection} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
