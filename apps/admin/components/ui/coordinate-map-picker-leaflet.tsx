"use client"

import { useEffect, useMemo } from "react"
import L from "leaflet"
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet"

type CoordinateMapPickerLeafletProps = {
  latitude: number
  longitude: number
  onChange: (coords: { lat: number; lng: number }) => void
  zoom?: number
}

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function ClickHandler({
  onChange,
}: {
  onChange: (coords: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(event) {
      const lat = Number(event.latlng.lat.toFixed(6))
      const lng = Number(event.latlng.lng.toFixed(6))
      onChange({ lat, lng })
    },
  })

  return null
}

function RecenterOnPinChange({
  center,
  zoom,
}: {
  center: [number, number]
  zoom: number
}) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom, { animate: false })
  }, [map, center, zoom])

  return null
}

export function CoordinateMapPickerLeaflet({
  latitude,
  longitude,
  onChange,
  zoom = 12,
}: CoordinateMapPickerLeafletProps) {
  const center = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude])
  const markerEventHandlers = useMemo(
    () => ({
      dragend(event: L.DragEndEvent) {
        const marker = event.target as L.Marker
        const next = marker.getLatLng()
        onChange({
          lat: Number(next.lat.toFixed(6)),
          lng: Number(next.lng.toFixed(6)),
        })
      },
    }),
    [onChange],
  )

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-80 w-full rounded-lg border"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterOnPinChange center={center} zoom={zoom} />
      <ClickHandler onChange={onChange} />
      <Marker
        draggable
        eventHandlers={markerEventHandlers}
        icon={markerIcon}
        position={center}
      />
    </MapContainer>
  )
}
