import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "İşletme Başvurusu",
  description: "İşletmenizi TatilDesen'e kaydederek ilan yönetimine başlayın.",
};

export default function BusinessLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
