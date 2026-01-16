"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";

interface Destination {
  id: string;
  name: string;
  description: string;
  placeCount: number;
  gradient: string;
  emoji: string;
}

// Muğla districts with their characteristics
const DESTINATIONS: Destination[] = [
  {
    id: "bodrum",
    name: "Bodrum",
    description: "Ege'nin incisi, antik tarihi ve gece hayatı",
    placeCount: 150,
    gradient: "from-blue-500 to-cyan-400",
    emoji: "🏖️",
  },
  {
    id: "fethiye",
    name: "Fethiye",
    description: "Ölüdeniz, kelebek vadisi ve doğa harikaları",
    placeCount: 120,
    gradient: "from-emerald-500 to-teal-400",
    emoji: "🦋",
  },
  {
    id: "marmaris",
    name: "Marmaris",
    description: "Turkuaz koylar ve tekne turları",
    placeCount: 100,
    gradient: "from-violet-500 to-purple-400",
    emoji: "⛵",
  },
  {
    id: "datça",
    name: "Datça",
    description: "Bozulmamış doğa ve badem çiçekleri",
    placeCount: 45,
    gradient: "from-amber-500 to-orange-400",
    emoji: "🌸",
  },
  {
    id: "köyceğiz",
    name: "Köyceğiz",
    description: "Termal kaplıcalar ve çamur banyoları",
    placeCount: 30,
    gradient: "from-lime-500 to-green-400",
    emoji: "♨️",
  },
  {
    id: "dalaman",
    name: "Dalaman",
    description: "Rafting ve doğa sporları merkezi",
    placeCount: 25,
    gradient: "from-sky-500 to-blue-400",
    emoji: "🚣",
  },
];

const SECTION_TITLE = "Muğla'yı Keşfedin";
const SECTION_SUBTITLE =
  "İlçe seçerek size en uygun konaklamayı bulun. Her ilçenin kendine özgü güzelliği var.";

export function DestinationsSection() {
  const router = useRouter();

  const handleDestinationClick = (destinationId: string) => {
    router.push(`/places?district=${encodeURIComponent(destinationId)}`);
  };

  return (
    <section className="space-y-8">
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
        <button
          onClick={() => router.push("/places")}
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Tümünü Gör
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Destination Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DESTINATIONS.map((destination, index) => (
          <motion.button
            key={destination.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            onClick={() => handleDestinationClick(destination.id)}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Background gradient on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${destination.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
            />

            <div className="relative flex items-start justify-between">
              <div className="space-y-3">
                {/* Emoji & Name */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{destination.emoji}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {destination.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      <span>{destination.placeCount}+ konaklama</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {destination.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-all group-hover:bg-primary group-hover:text-white">
                <ArrowRight className="size-5" />
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${destination.gradient} transition-all duration-300 group-hover:w-full`}
            />
          </motion.button>
        ))}
      </div>

      {/* "Flexible" Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6"
      >
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              Henüz karar veremediniz mi?
            </h3>
            <p className="text-sm text-muted-foreground">
              Tüm Muğla'daki konaklamaları keşfedin ve size en uygun yeri bulun.
            </p>
          </div>
          <button
            onClick={() => router.push("/places")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            Esnek Arama Yap
            <ArrowRight className="size-4" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
