import type { Metadata } from "next";

import { LatestBlogSection } from "@/components/blog/latest-blog-section";
import { FeaturedCollectionsSection } from "@/components/collections/featured-collections-section";
import { CategorySection } from "@/components/marketing/category-section";
import { HeroSection } from "@/components/marketing/hero";
import { FeaturedPlacesSection } from "@/components/places/featured-places-section";

export const metadata: Metadata = {
  title: "TatilDesen | Konaklama, Deneyim ve Mekan Rehberi",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 md:px-6 md:pt-8">
        <HeroSection />
      </div>

      <div className="mx-auto w-full max-w-[1400px] space-y-14 px-4 py-14 md:space-y-16 md:px-6 md:py-16">
        <CategorySection />

        <FeaturedPlacesSection />

        <LatestBlogSection />

        <FeaturedCollectionsSection />
      </div>
    </div>
  );
}
