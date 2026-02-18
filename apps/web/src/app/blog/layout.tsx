import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "TatilDesen editörlerinden Muğla rehberleri, gezi rotaları ve seyahat hikayeleri.",
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
