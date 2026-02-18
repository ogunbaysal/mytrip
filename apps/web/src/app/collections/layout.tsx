import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Koleksiyonlar",
  description:
    "TatilDesen editörlerinin hazırladığı tematik seyahat koleksiyonlarını keşfedin.",
};

export default function CollectionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
