import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  description: "Şifre sıfırlama bağlantısı talep edin.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
