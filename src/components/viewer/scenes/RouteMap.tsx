"use client";

import { useEffect, useRef, useState } from "react";
import type { TripPlan } from "@/lib/types";

interface DayCoord {
  dayNumber: number;
  destination: string;
  lat: number;
  lng: number;
}

async function getCoords(destination: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(destination)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.lat) return { lat: data.lat, lng: data.lng };
    }
  } catch {}
  return null;
}

export default function RouteMap({ trip }: { trip: TripPlan }) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [dayCoords, setDayCoords] = useState<DayCoord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch coordinates for all unique destinations in parallel
  useEffect(() => {
    const uniqueDestinations = [
      ...new Set(trip.days.map((d) => d.destination).filter(Boolean)),
    ] as string[];

    Promise.all(
      uniqueDestinations.map(async (dest) => ({ dest, coords: await getCoords(dest) }))
    ).then((results) => {
      const coordMap: Record<string, { lat: number; lng: number }> = {};
      results.forEach(({ dest, coords }) => {
        if (coords) coordMap[dest] = coords;
      });

      const coords: DayCoord[] = trip.days
        .filter((d) => d.destination && coordMap[d.destination])
        .map((d) => ({
          dayNumber: d.dayNumber,
          destination: d.destination,
          ...coordMap[d.destination],
        }));

      setDayCoords(coords);
      setLoading(false);
    });
  }, [trip]);

  // Initialize Leaflet map after coords are ready
  useEffect(() => {
    if (loading || dayCoords.length === 0 || !mapDivRef.current) return;

    let map: import("leaflet").Map | null = null;

    import("leaflet").then((L) => {
      // CSS is imported via globals
      if (!mapDivRef.current) return;

      // Destroy any previous map instance
      if ((mapDivRef.current as any)._leaflet_id) {
        (mapDivRef.current as any)._leaflet_id = null;
        mapDivRef.current.innerHTML = "";
      }

      const centerLat = dayCoords.reduce((s, d) => s + d.lat, 0) / dayCoords.length;
      const centerLng = dayCoords.reduce((s, d) => s + d.lng, 0) / dayCoords.length;

      map = L.map(mapDivRef.current, {
        center: [centerLat, centerLng],
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      });

      // Light tile layer (CARTO Positron — free, no API key)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // Route polyline
      const points: [number, number][] = dayCoords.map((d) => [d.lat, d.lng]);
      L.polyline(points, {
        color: "#2563eb",
        weight: 3,
        dashArray: "8 10",
        opacity: 0.9,
      }).addTo(map);

      // Numbered markers for each day
      dayCoords.forEach((d) => {
        const icon = L.divIcon({
          html: `<div style="
            background: #3b82f6;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            border: 2px solid rgba(255,255,255,0.9);
            box-shadow: 0 2px 12px rgba(0,0,0,0.6);
            font-family: sans-serif;
          ">${d.dayNumber}</div>`,
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16],
        });

        L.marker([d.lat, d.lng], { icon })
          .addTo(map!)
          .bindPopup(
            `<div style="font-family:sans-serif;font-size:12px;line-height:1.4">
              <strong>Day ${d.dayNumber}</strong><br/>${d.destination}
            </div>`
          );
      });

      // Fit all markers in view
      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
      }
    });

    return () => {
      map?.remove();
    };
  }, [dayCoords, loading]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white/30 text-sm">지도 좌표 로딩 중…</p>
      </div>
    );
  }

  if (dayCoords.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white/30 text-sm">위치 정보를 찾을 수 없습니다</p>
      </div>
    );
  }

  return <div ref={mapDivRef} className="w-full h-full" />;
}
