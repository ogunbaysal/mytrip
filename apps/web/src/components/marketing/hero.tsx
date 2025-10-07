"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { PlaceSearchForm } from "@/components/places/place-search-form";

const HERO_EYEBROW = "Muğla, Türkiye";
const HERO_TITLE = "Muğla'yı bir yerlisi gibi yaşayın";
const HERO_SUBTITLE = "Tasarım villalar, saklı koylar ve yerel rehberli deneyimlerle tanışın.";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#fff6f5] via-white to-[#f7f4ff] px-4 py-14 shadow-soft md:px-12 md:py-20">
      <div className="absolute -left-32 top-10 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="absolute -right-16 bottom-0 size-72 rounded-full bg-[#ffd8db]/40 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-10 lg:flex-row lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-sm">
            <Sparkles className="size-3" />
            {HERO_EYEBROW}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {HERO_TITLE}
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">{HERO_SUBTITLE}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="w-full lg:max-w-lg"
        >
          <PlaceSearchForm />
        </motion.div>
      </div>
    </section>
  );
}
