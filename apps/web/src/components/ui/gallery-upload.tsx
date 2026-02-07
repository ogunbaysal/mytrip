"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface GalleryUploadProps {
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function GalleryUpload({
  value = [],
  onChange,
  disabled,
}: GalleryUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const response = await api.owner.upload.single(file, "place_image");
        newUrls.push(response.url);
      }

      onChange([...value, ...newUrls]);
      toast.success(`${newUrls.length} görsel başarıyla yüklendi`);
    } catch (error) {
      console.error(error);
      toast.error("Görsel yüklenirken hata oluştu");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove));
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    if (direction === "left" && index === 0) return;
    if (direction === "right" && index === value.length - 1) return;

    const newIndex = direction === "left" ? index - 1 : index + 1;
    const newValue = [...value];
    const [movedItem] = newValue.splice(index, 1);
    newValue.splice(newIndex, 0, movedItem);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
              index === 0 && "ring-2 ring-primary ring-offset-2",
            )}
          >
            <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                onClick={() => handleRemove(url)}
                variant="destructive"
                size="icon"
                className="h-6 w-6"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1 px-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                onClick={() => moveImage(index, "left")}
                variant="secondary"
                size="icon"
                className="h-6 w-6 bg-white/80 hover:bg-white"
                disabled={index === 0}
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                onClick={() => moveImage(index, "right")}
                variant="secondary"
                size="icon"
                className="h-6 w-6 bg-white/80 hover:bg-white"
                disabled={index === value.length - 1}
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>

            {index === 0 && (
              <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                <Star className="h-3 w-3 fill-current" />
                Ana Görsel
              </div>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Mekan görseli ${index + 1}`} className="h-full w-full object-cover" />
          </div>
        ))}

        <div className="aspect-square">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
            className="h-full w-full flex-col gap-2 border-dashed bg-transparent hover:bg-muted"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {isUploading ? "Yükleniyor..." : "Görsel Ekle"}
            </span>
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
        disabled={disabled || isUploading}
      />

      <p className="text-xs text-muted-foreground">
        İlk sıradaki görsel ana görsel olarak kullanılır. Oklarla sıralamayı değiştirebilirsiniz.
      </p>
    </div>
  );
}
