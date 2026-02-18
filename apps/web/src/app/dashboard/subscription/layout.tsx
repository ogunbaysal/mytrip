import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Abonelik",
  description: "Abonelik planınızı, kullanım limitlerinizi ve yenileme durumunu yönetin.",
};

export default function DashboardSubscriptionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
