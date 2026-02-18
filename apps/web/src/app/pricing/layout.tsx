import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description: "İşletmeniz için uygun TatilDesen abonelik planını seçin.",
};

export default function PricingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
