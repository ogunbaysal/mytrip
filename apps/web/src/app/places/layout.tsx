import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mekan Arama",
  description:
    "Muğla ve çevresinde otel, villa, restoran, kafe, aktivite ve gezi noktalarını filtreleyerek keşfedin.",
};

export default function PlacesLayout({ children }: { children: ReactNode }) {
  return children;
}
