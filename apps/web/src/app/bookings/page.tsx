import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { BookingsPageClient } from "./bookings-page-client";

function BookingsPageFallback() {
  return (
    <div className="container mx-auto flex items-center gap-2 px-4 py-10 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Rezervasyon sayfası yükleniyor...
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<BookingsPageFallback />}>
      <BookingsPageClient />
    </Suspense>
  );
}
