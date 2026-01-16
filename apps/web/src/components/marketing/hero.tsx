"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

const HERO_EYEBROW = "Muğla, Türkiye";
const HERO_TITLE = "Muğla'yı bir yerlisi gibi yaşayın";
const HERO_SUBTITLE =
  "Tasarım villalar, saklı koylar ve yerel rehberli deneyimlerle tanışın. Ege'nin en güzel köşelerini keşfedin.";

export function HeroSection() {
  const router = useRouter();

  const handleExploreClick = () => {
    router.push("/places");
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 shadow-2xl md:px-12 md:py-16">
      {/* Background decorative elements */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-blue-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 space-y-6"
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
            <MapPin className="size-3" />
            {HERO_EYEBROW}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            {HERO_TITLE}
          </h1>

          {/* Subtitle */}
          <p className="max-w-lg text-base text-white/70 md:text-lg">
            {HERO_SUBTITLE}
          </p>

          {/* CTA Button */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleExploreClick}
              size="lg"
              className="gap-2 rounded-full bg-primary px-6 text-white hover:bg-primary/90"
            >
              <Search className="size-4" />
              Tüm Konaklamaları Keşfet
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 pt-4">
            <div>
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-sm text-white/60">Konaklama</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">50+</div>
              <div className="text-sm text-white/60">Deneyim</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">13</div>
              <div className="text-sm text-white/60">İlçe</div>
            </div>
          </div>
        </motion.div>

        {/* Right Content - Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="w-full lg:w-1/2"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop"
              alt="Muğla'da lüks villa ve havuz manzarası"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {/* Floating badge */}
            <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    4.9 Ortalama Puan
                  </div>
                  <div className="text-xs text-slate-600">
                    2,500+ değerlendirme
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
