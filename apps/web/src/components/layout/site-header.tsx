"use client";

import Link from "next/link";
import type { Route } from "next";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem =
  | {
      label: string;
      href: Route;
    }
  | {
      label: string;
      href: Route;
      query: Record<string, string>;
    };

const NAV_ITEMS: NavItem[] = [
  { label: "Konaklamalar", href: "/places" },
  { label: "Deneyimler", href: "/collections" },
  { label: "Restoranlar", href: "/places", query: { type: "restaurant" } },
  { label: "Hikayeler", href: "/blog" },
];

const HERO_EYEBROW = "Muğla, Türkiye";
const GUESTS_HELPER = "Kaç kişi?";
const LIST_PLACE = "Yerini listele";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-page/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4 px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-primary" aria-label="MyTrip ana sayfa">
          <span className="text-2xl font-semibold tracking-tight">MyTrip</span>
        </Link>

        <div className="flex flex-1 lg:hidden">
          <button
            type="button"
            className="flex h-11 w-full max-w-xs items-center justify-between rounded-full border border-border bg-white px-4 text-left text-sm font-medium shadow-sm transition hover:shadow-lg"
          >
            <span className="truncate text-foreground/90">{HERO_EYEBROW}</span>
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-white">
              <Search className="size-4" aria-hidden />
            </span>
          </button>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">
          <button
            type="button"
            className={cn(
              "flex h-12 w-full max-w-xl items-center rounded-full border border-border bg-white px-5 shadow-sm transition hover:shadow-lg",
            )}
          >
            <div className="flex flex-1 items-center gap-3 text-left">
              <span className="text-sm font-semibold text-foreground">{HERO_EYEBROW}</span>
              <span className="h-5 w-px bg-border" aria-hidden />
              <span className="text-sm text-muted-foreground">{GUESTS_HELPER}</span>
            </div>
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-white">
              <Search className="size-4" aria-hidden />
            </span>
          </button>
        </div>

        <nav className="ml-auto hidden items-center gap-1 xl:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={"query" in item ? { pathname: item.href, query: item.query } : item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-6">
          <Button
            variant="ghost"
            size="sm"
            className="hidden rounded-full border border-border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-white/90 lg:inline-flex"
          >
            {LIST_PLACE}
          </Button>
        </div>
      </div>
    </header>
  );
}
