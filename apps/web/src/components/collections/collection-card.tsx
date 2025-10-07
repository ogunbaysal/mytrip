"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import type { CollectionSummary } from "@/types";

export function CollectionCard({ collection }: { collection: CollectionSummary }) {
  return (
    <Link
      href={`/collections/${collection.slug}` as Route}
      className="group flex flex-col gap-4 rounded-3xl border border-transparent bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
    >
      <div className="relative aspect-[5/3] overflow-hidden rounded-2xl">
        <Image
          src={collection.coverImage}
          alt={collection.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 320px"
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{collection.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{collection.description}</p>
        <span className="text-xs font-semibold uppercase tracking-wide text-primary/80">
          {collection.itemCount} öneri
        </span>
      </div>
    </Link>
  );
}
