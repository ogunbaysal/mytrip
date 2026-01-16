import { FeaturedCollectionsSection } from "@/components/collections/featured-collections-section";
import { CategorySection } from "@/components/marketing/category-section";
import { DestinationsSection } from "@/components/marketing/destinations-section";
import { HeroSection } from "@/components/marketing/hero";
import { FeaturedPlacesSection } from "@/components/places/featured-places-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section - Full width with map */}
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 md:px-6 md:pt-10">
        <HeroSection />
      </div>

      {/* Main Content Sections */}
      <div className="mx-auto w-full max-w-[1400px] space-y-16 px-4 py-16 md:space-y-20 md:px-6 md:py-20">
        {/* Destinations - Muğla Districts */}
        <DestinationsSection />

        {/* Category Selection */}
        <CategorySection />

        {/* Featured Places */}
        <FeaturedPlacesSection />

        {/* Themed Collections */}
        <FeaturedCollectionsSection />
      </div>
    </div>
  );
}
