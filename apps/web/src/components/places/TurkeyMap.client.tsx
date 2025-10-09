"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import type { GeoJsonObject, Feature } from "geojson";
import type { LeafletEventHandlerFnMap, PathOptions } from "leaflet";
import L from "leaflet";

interface ProvinceProperties {
  name: string;
  nameEn?: string;
  region?: string;
  [key: string]: unknown;
}

interface ProvinceFeature extends Feature {
  properties: ProvinceProperties;
}

interface TurkeyMapProps {
  className?: string;
  onProvinceClick?: (provinceName: string) => void;
}

export default function TurkeyMap({ className = "", onProvinceClick }: TurkeyMapProps) {
  const [geoData, setGeoData] = useState<GeoJsonObject | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    // Fix for default markers in react-leaflet (only on client)
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl: "/leaflet/marker-icon.png",
      shadowUrl: "/leaflet/marker-shadow.png",
    });

    // Load GeoJSON data
    fetch("/data/tr-provinces.geojson")
      .then((response) => response.json())
      .then((data) => setGeoData(data))
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, []);

  const getProvinceStyle = (feature: ProvinceFeature): PathOptions => {
    const isSelected = selectedProvince === feature.properties.name;
    
    return {
      fillColor: isSelected ? "#ff5a5f" : "#ffffff",
      weight: 2,
      opacity: 1,
      color: "#d1d5db",
      dashArray: "",
      fillOpacity: 1,
    };
  };

  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    const eventHandlers: LeafletEventHandlerFnMap = {
      click: () => {
        const provinceName = (feature.properties as ProvinceProperties).name;
        console.log("Province clicked:", provinceName);
        
        // Update selected province
        setSelectedProvince(provinceName);
        
        // Call external callback if provided
        onProvinceClick?.(provinceName);
        
        // Re-style all features
        if (geoJsonRef.current) {
          geoJsonRef.current.eachLayer((layer) => {
            if (layer instanceof L.Path) {
              const featureData = (layer as unknown as { feature: ProvinceFeature }).feature;
              layer.setStyle(getProvinceStyle(featureData));
            }
          });
        }
      },
      mouseover: (e) => {
        const layer = e.target;
        if (!selectedProvince || selectedProvince !== (feature.properties as ProvinceProperties).name) {
          layer.setStyle({
            fillColor: "#f3f4f6",
            fillOpacity: 1,
          });
        }
        
        // Show tooltip with only province name
        const tooltip = `
          <div class="font-medium text-sm">
            ${(feature.properties as ProvinceProperties).name}
          </div>
        `;
        layer.bindTooltip(tooltip, {
          permanent: false,
          direction: "top",
          className: "custom-tooltip",
        }).openTooltip();
      },
      mouseout: (e) => {
        const layer = e.target;
        if (!selectedProvince || selectedProvince !== (feature.properties as ProvinceProperties).name) {
          layer.setStyle(getProvinceStyle(feature as ProvinceFeature));
        }
        layer.closeTooltip();
      },
    };

    layer.on(eventHandlers);
  };

  if (!geoData) {
    return (
      <div className={`rounded-2xl shadow-sm border bg-background p-8 ${className}`}>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[400px] w-full relative overflow-hidden rounded-2xl shadow-sm border bg-gray-50 ${className}`}>
      <MapContainer
        center={[39, 35.5]}
        zoom={5}
        minZoom={5}
        maxZoom={6}
        style={{ height: "100%", width: "100%", backgroundColor: "#f9fafb" }}
        className="rounded-2xl"
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        zoomControl={true}
        maxBounds={[[35, 25], [43, 45]]}
        maxBoundsViscosity={1.0}
      >
{/* No tile layer - only show Turkey provinces */}
        
        <GeoJSON
          data={geoData}
          style={(feature) => getProvinceStyle(feature as ProvinceFeature)}
          onEachFeature={onEachFeature}
          ref={geoJsonRef}
        />
      </MapContainer>
      
      {selectedProvince && (
        <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border p-3 z-[1000]">
          <div className="text-sm font-medium text-foreground">
            Seçili Şehir
          </div>
          <div className="text-lg font-semibold text-primary">
            {selectedProvince}
          </div>
          <button
            onClick={() => setSelectedProvince(null)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Seçimi Temizle
          </button>
        </div>
      )}
      
      <style jsx global>{`
        .custom-tooltip {
          background: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid #e4e4e7 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          color: #18181b !important;
          font-size: 12px !important;
          padding: 8px 12px !important;
          backdrop-filter: blur(8px) !important;
        }
        
        .custom-tooltip::before {
          border-top-color: rgba(255, 255, 255, 0.95) !important;
        }
        
        .leaflet-container {
          font-family: var(--font-sans, "Inter", system-ui, sans-serif) !important;
        }
        
        .leaflet-control-zoom a {
          background-color: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid #e4e4e7 !important;
          color: #18181b !important;
          backdrop-filter: blur(8px) !important;
        }
        
        .leaflet-control-zoom a:hover {
          background-color: #f4f4f5 !important;
        }
        
        .leaflet-control-attribution {
          background-color: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(4px) !important;
          font-size: 10px !important;
        }
      `}</style>
    </div>
  );
}