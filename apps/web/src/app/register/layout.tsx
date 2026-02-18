import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "TatilDesen'e üye olun ve favori rotalarınızı kaydedin.",
};

export default function RegisterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
