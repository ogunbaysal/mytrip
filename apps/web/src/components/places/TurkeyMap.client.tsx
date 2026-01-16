"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import type { GeoJsonObject, Feature } from "geojson";
import type { PathOptions, Layer, LeafletMouseEvent } from "leaflet";
import L from "leaflet";

interface ProvinceProperties {
  name: string;
  [key: string]: unknown;
}

interface TurkeyMapProps {
  className?: string;
  onProvinceClick?: (provinceName: string) => void;
}

// Component to fit bounds after map loads
function FitBounds({ geoData }: { geoData: GeoJsonObject }) {
  const map = useMap();

  useEffect(() => {
    const geoJsonLayer = L.geoJSON(geoData);
    const bounds = geoJsonLayer.getBounds();
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, geoData]);

  return null;
}

export default function TurkeyMap({
  className = "",
  onProvinceClick,
}: TurkeyMapProps) {
  const [geoData, setGeoData] = useState<GeoJsonObject | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // Store callback in ref to avoid stale closures
  const callbackRef = useRef(onProvinceClick);
  useEffect(() => {
    callbackRef.current = onProvinceClick;
  }, [onProvinceClick]);

  useEffect(() => {
    fetch("/data/tr-provinces.geojson")
      .then((res) => res.json())
      .then((data) => {
        console.log("GeoJSON loaded, features:", data.features?.length);
        setGeoData(data);
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  const getStyle = (feature: Feature | undefined): PathOptions => {
    if (!feature?.properties) return {};

    const name = (feature.properties as ProvinceProperties).name;
    const isSelected = selectedProvince === name;
    const isHovered = hoveredProvince === name && !isSelected;

    return {
      fillColor: isSelected ? "#ff5a5f" : isHovered ? "#fecaca" : "#ffffff",
      weight: isSelected ? 2 : 1,
      opacity: 1,
      color: isSelected ? "#dc2626" : "#d1d5db",
      fillOpacity: 1,
    };
  };

  const handleClick = (provinceName: string) => {
    console.log("handleClick called for:", provinceName);
    setSelectedProvince(provinceName);

    // Use setTimeout to ensure state updates don't interfere
    setTimeout(() => {
      if (callbackRef.current) {
        console.log("Executing navigation callback for:", provinceName);
        callbackRef.current(provinceName);
      }
    }, 0);
  };

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const props = feature.properties as ProvinceProperties;
    const provinceName = props?.name;

    if (!provinceName) {
      console.warn("Feature without name:", feature);
      return;
    }

    // Bind click event
    layer.on({
      click: (e: LeafletMouseEvent) => {
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
          e.originalEvent.preventDefault();
        }
        handleClick(provinceName);
      },
      mouseover: () => {
        setHoveredProvince(provinceName);
        (layer as L.Path).setStyle({
          fillColor: selectedProvince === provinceName ? "#ff5a5f" : "#fecaca",
        });
        layer
          .bindTooltip(provinceName, {
            permanent: false,
            direction: "top",
            className: "province-tooltip",
          })
          .openTooltip();
      },
      mouseout: () => {
        setHoveredProvince(null);
        (layer as L.Path).setStyle({
          fillColor: selectedProvince === provinceName ? "#ff5a5f" : "#ffffff",
        });
        layer.unbindTooltip();
      },
    });
  };

  if (!geoData) {
    return (
      <div className={`rounded-2xl border bg-white ${className}`}>
        <div className="flex items-center justify-center h-full min-h-[300px]">
          <div className="text-muted-foreground animate-pulse">
            Harita yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full relative overflow-hidden rounded-2xl border bg-white ${className}`}
      style={{ isolation: "isolate" }}
    >
      <MapContainer
        center={[39, 35]}
        zoom={6}
        style={{
          height: "100%",
          width: "100%",
          background: "#ffffff",
          zIndex: 1,
        }}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        dragging={false}
        touchZoom={false}
        keyboard={false}
        boxZoom={false}
        attributionControl={false}
      >
        <FitBounds geoData={geoData} />
        <GeoJSON
          data={geoData}
          style={getStyle}
          onEachFeature={onEachFeature}
        />
      </MapContainer>

      {selectedProvince && (
        <div className="absolute bottom-3 left-3 bg-white rounded-lg shadow-md border px-3 py-1.5 z-[1000] pointer-events-none">
          <span className="text-xs text-muted-foreground">Seçili: </span>
          <span className="text-sm font-semibold text-primary">
            {selectedProvince}
          </span>
        </div>
      )}

      <style jsx global>{`
        .province-tooltip {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
          color: #1f2937 !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          padding: 4px 10px !important;
        }
        .province-tooltip::before {
          display: none !important;
        }
        .leaflet-interactive {
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
}
