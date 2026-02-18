import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mekanlarım",
  description: "İşletmenize ait mekan ilanlarını oluşturun, düzenleyin ve yönetin.",
};

export default function DashboardPlacesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
