import type { ComponentType, SVGProps } from "react";

import { Compass, Ship, Sparkles, UtensilsCrossed, Waves, Users } from "lucide-react";

const CATEGORY_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  beachfront: Waves,
  design: Sparkles,
  family: Users,
  gastronomy: UtensilsCrossed,
  sailing: Ship,
  wellness: Compass,
};

const CATEGORIES = [
  {
    key: "beachfront",
    title: "Deniz kenarı villalar",
    description: "Saklı koylar",
  },
  {
    key: "design",
    title: "Tasarım evler",
    description: "Mimari açıdan özel",
  },
  {
    key: "family",
    title: "Aile dostu",
    description: "Çocuklu ailelere uygun",
  },
  {
    key: "gastronomy",
    title: "Gastronomi",
    description: "Yerel lezzetler",
  },
  {
    key: "sailing",
    title: "Mavi yolculuk",
    description: "Mavi tur rotaları",
  },
  {
    key: "wellness",
    title: "Wellness kaçamakları",
    description: "Ruhunu dinlendir",
  },
] as const;

export function CategorySection() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Ruh halinizi seçin</h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            Bölgeyi en iyi bilenlerin önerdiği konaklama ve deneyimler.
          </p>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {CATEGORIES.map(({ key, title, description }) => {
          const Icon = CATEGORY_ICON[key] ?? Sparkles;
          return (
            <button
              key={key}
              className="group flex min-w-[160px] flex-col items-start gap-3 rounded-3xl border border-transparent bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
              type="button"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-foreground">{title}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
