import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "TatilDesen hesabınıza giriş yapın.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
