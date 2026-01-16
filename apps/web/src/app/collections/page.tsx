"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

import { CollectionCard } from "@/components/collections/collection-card";
import { api } from "@/lib/api";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80";

export default function CollectionsPage() {
  const { data: collections, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await api.collections.list({ limit: 100 });
      return res.collections;
    },
  });

  const items = collections ?? [];

  return (
    <div className="space-y-14 pb-24 pt-10 md:space-y-16 md:pt-14">
      <section className="mx-auto w-full max-w-[1100px] px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl">
          <Image
            src={HERO_IMAGE}
            alt="TatilDesen koleksiyonları"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 1100px"
          />
          <div className="relative z-10 space-y-5 bg-gradient-to-t from-black/70 via-black/30 to-black/10 p-8 text-white md:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              TatilDesen Rotaları
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Editör seçkisiyle hazırlanan koleksiyonlar
              </h1>
              <p className="max-w-2xl text-sm text-white/85 md:text-base">
                Gurme keşiflerinden mavi yolculuk rotalarına kadar TatilDesen editörlerinin hazırladığı tematik planlarla Muğla&apos;yı baştan keşfedin.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1100px] space-y-4 px-4 md:px-6">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-foreground">Tüm koleksiyonlar</h2>
          <span className="text-sm text-muted-foreground">
            {isLoading ? "Yükleniyor..." : `${items.length} koleksiyon`}
          </span>
        </div>
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-white p-8 text-center text-sm text-muted-foreground">
            İçerik yükleniyor, lütfen bekleyin.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-white p-8 text-center text-sm text-muted-foreground">
            Şu anda görüntülenecek koleksiyon bulunamadı.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
