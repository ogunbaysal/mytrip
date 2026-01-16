"use client";

import { useLocalizedFormatting } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type MapPriceMarkerProps = {
  price: number;
  isActive?: boolean;
  onClick?: () => void;
};

export function MapPriceMarker({
  price,
  isActive = false,
  onClick,
}: MapPriceMarkerProps) {
  const { formatPrice } = useLocalizedFormatting();

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-1 text-sm font-medium shadow-md transition-all hover:scale-110 hover:z-50",
        isActive
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
      )}
    >
      {formatPrice(price)}
    </button>
  );
}

// CSS class for the marker - to be used with Leaflet's divIcon
export const getMarkerClassName = (isActive: boolean) =>
  cn(
    "!bg-transparent !border-none flex items-center justify-center",
    isActive && "z-50",
  );

// HTML content for Leaflet marker
export const createMarkerHtml = (
  price: number,
  isActive: boolean,
  currency = "₺",
) => {
  const formattedPrice = `${currency}${price.toLocaleString("tr-TR")}`;
  return `
    <div class="${cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-full px-2 py-1 text-sm font-medium shadow-md transition-all cursor-pointer",
      isActive
        ? "bg-gray-900 text-white scale-110"
        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:scale-110",
    )}">
      ${formattedPrice}
    </div>
  `;
};
