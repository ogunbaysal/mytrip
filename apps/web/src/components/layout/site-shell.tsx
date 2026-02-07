import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-page text-foreground">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
