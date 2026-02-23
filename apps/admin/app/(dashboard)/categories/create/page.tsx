
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateCategoryPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/categories">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Kategori Yönetimi</h2>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900">
          Yeni kategoriler yalnızca geliştirici tarafından eklenebilir.
        </div>
      </div>
    </div>
  );
}
