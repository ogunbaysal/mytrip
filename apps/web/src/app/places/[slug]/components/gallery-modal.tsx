"use client";

import { useState } from "react";
import Image from "next/image";
import { Grid3X3, X, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface PlaceDetailGalleryModalProps {
  images: string[];
  placeName: string;
}

export function PlaceDetailGalleryModal({
  images,
  placeName,
}: PlaceDetailGalleryModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      selectedIndex === 0 ? images.length - 1 : selectedIndex - 1,
    );
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(
      selectedIndex === images.length - 1 ? 0 : selectedIndex + 1,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedIndex === null) return;
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") setSelectedIndex(null);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="absolute bottom-4 right-4 gap-2 bg-background hover:bg-background/90"
        >
          <Grid3X3 className="h-4 w-4" />
          Tüm fotoğrafları göster
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] max-w-5xl overflow-y-auto p-0"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b bg-background p-4">
          <DialogTitle className="text-lg font-semibold">
            {placeName} - Fotoğraflar
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Kapat</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        {/* Gallery View */}
        {selectedIndex === null ? (
          <div className="grid gap-2 p-4 md:grid-cols-2">
            {images.map((image, index) => (
              <button
                key={index}
                className={`relative overflow-hidden rounded-lg ${
                  index === 0 ? "md:col-span-2 md:aspect-[2/1]" : "aspect-[4/3]"
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <Image
                  src={image}
                  alt={`${placeName} - ${index + 1}`}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                  sizes={index === 0 ? "100vw" : "50vw"}
                />
              </button>
            ))}
          </div>
        ) : (
          /* Lightbox View */
          <div className="relative flex h-[80vh] items-center justify-center bg-black">
            <Image
              src={images[selectedIndex]}
              alt={`${placeName} - ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />

            {/* Navigation */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 h-12 w-12 rounded-full bg-white/90 text-black hover:bg-white"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Önceki</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 h-12 w-12 rounded-full bg-white/90 text-black hover:bg-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Sonraki</span>
            </Button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
              {selectedIndex + 1} / {images.length}
            </div>

            {/* Back to Grid */}
            <Button
              variant="ghost"
              className="absolute left-4 top-4 gap-2 bg-white/90 text-black hover:bg-white"
              onClick={() => setSelectedIndex(null)}
            >
              <Grid3X3 className="h-4 w-4" />
              Tüm fotoğraflar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
