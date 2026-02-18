import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Profilim",
  description: "TatilDesen profil bilgilerinizi görüntüleyin ve güncelleyin.",
};

export default function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
