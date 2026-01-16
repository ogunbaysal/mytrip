import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { SiteShell } from "@/components/layout/site-shell";
import { AppProviders } from "@/providers/app-providers";
import { fontClassName } from "@/styles/fonts";

export const metadata: Metadata = {
  metadataBase: new URL("https://mytrip.com"),
  title: {
    default: "MyTrip",
    template: "%s | MyTrip",
  },
  description:
    "Muğla'nın en iyi konaklama, yeme-içme ve deneyimlerini keşfetmenize yardımcı olan MyTrip ile tatilinizi planlayın.",
};

export const viewport: Viewport = {
  themeColor: "#ff5a5f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${fontClassName} antialiased bg-page text-foreground`}
        suppressHydrationWarning
      >
        <AppProviders>
          <SiteShell>{children}</SiteShell>
        </AppProviders>
      </body>
    </html>
  );
}
