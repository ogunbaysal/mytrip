"use client";

import { Info } from "lucide-react";

import { GalleryUpload } from "@/components/ui/gallery-upload";
import { DashboardCard, SectionHeader } from "@/components/dashboard";

type PlaceMediaSectionProps = {
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
};

export function PlaceMediaSection({
  images,
  onImagesChange,
  disabled,
}: PlaceMediaSectionProps) {
  return (
    <DashboardCard padding="md">
      <SectionHeader
        title="Mekan Gorselleri"
        subtitle="Gorsel ekleyin ve siralayin. Ilk gorsel ana gorsel olur."
        icon={<Info className="size-5" />}
        size="sm"
        className="mb-6"
      />

      <GalleryUpload value={images} onChange={onImagesChange} disabled={disabled} />
    </DashboardCard>
  );
}
