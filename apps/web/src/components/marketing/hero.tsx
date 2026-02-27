"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const HERO_EYEBROW = "TatilDesen";
const HERO_TITLE = "Komisyonsuz tatil planını tek ekranda başlat";
const HERO_SUBTITLE =
  "Konaklama, deneyim ve popüler mekanları hızlıca keşfet. Aradığını seç, sana en uygun seçeneklere geç.";

export function HeroSection() {
  const router = useRouter();

  const handleExploreClick = () => {
    router.push("/places");
  };

  return (
    <section className="relative h-[300px] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-2xl md:px-10 md:py-8">
      <div
        className="pointer-events-none absolute -left-28 -top-28 size-72 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -right-28 size-72 rounded-full bg-blue-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />

      <div className="relative flex h-full items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="max-w-3xl space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
            <MapPin className="size-3" />
            {HERO_EYEBROW}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white md:text-4xl">
            {HERO_TITLE}
          </h1>

          <p className="max-w-2xl text-sm text-white/70 md:text-base">{HERO_SUBTITLE}</p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              onClick={handleExploreClick}
              className="gap-2 rounded-full bg-primary px-6 text-white hover:bg-primary/90"
            >
              <Search className="size-4" />
              Keşfetmeye Başla
            </Button>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/85">
              <Sparkles className="size-3.5" />
              Güncel önerilerle hızlı keşif
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
