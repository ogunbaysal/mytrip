import type { Metadata } from "next";
import type { ReactNode } from "react";

import DashboardLayoutClient from "./dashboard-layout-client";

export const metadata: Metadata = {
  title: "İşletme Paneli",
  description: "Mekanlarınızı, blog içeriklerinizi ve abonelik planınızı yönetin.",
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
