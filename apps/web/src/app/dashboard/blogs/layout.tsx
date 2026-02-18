import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Blog Yazıları",
  description: "Blog içeriklerinizi oluşturun, düzenleyin ve yayın durumlarını yönetin.",
};

export default function DashboardBlogsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
