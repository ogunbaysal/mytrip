import { FeaturedCollectionsSection } from "@/components/collections/featured-collections-section";
import { FeaturedPlacesSection } from "@/components/places/featured-places-section";
import { CategorySection } from "@/components/marketing/category-section";
import { HeroSection } from "@/components/marketing/hero";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-16 px-4 pb-24 pt-10 md:space-y-20 md:px-6 md:pt-14">
      <HeroSection />
      <CategorySection />
      <FeaturedPlacesSection />
      <FeaturedCollectionsSection />
    </div>
  );
}
