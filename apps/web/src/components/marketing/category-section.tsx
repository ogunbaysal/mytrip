import type { ComponentType, SVGProps } from "react";
import Link from "next/link";

import { Building2, Home, Gamepad2, UtensilsCrossed, Coffee, MapPin } from "lucide-react";

const CATEGORY_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  hotels: Building2,
  villas: Home,
  entertainment: Gamepad2,
  restaurants: UtensilsCrossed,
  cafes: Coffee,
  attractions: MapPin,
};

const CATEGORIES = [
  {
    key: "hotels",
    title: "Oteller",
    description: "Konforlu konaklama",
  },
  {
    key: "villas",
    title: "Villalar",
    description: "Özel tatil evleri",
  },
  {
    key: "entertainment",
    title: "Eğlence Mekanları",
    description: "Gece hayatı ve etkinlikler",
  },
  {
    key: "restaurants",
    title: "Restaurantlar",
    description: "Lezzet durağı",
  },
  {
    key: "cafes",
    title: "Kafeler",
    description: "Keyifli mola",
  },
  {
    key: "attractions",
    title: "Gezilecek Yerler",
    description: "Unutulmaz deneyimler",
  },
] as const;

export function CategorySection() {
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
      <div className="flex gap-3 overflow-x-auto pb-2">
        {CATEGORIES.map(({ key, title, description }) => {
          const Icon = CATEGORY_ICON[key] ?? MapPin;
          return (
            <Link
              key={key}
              href="/places"
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
      </div>
    </section>
  );
}
