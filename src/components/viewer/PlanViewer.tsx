"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";
import type { TripPlan } from "@/lib/types";
import HeroScene from "./scenes/HeroScene";
import OverviewScene from "./scenes/OverviewScene";
import DayScene from "./scenes/DayScene";
import ClosingScene from "./scenes/ClosingScene";
import RouteMapScene from "./scenes/RouteMapScene";

gsap.registerPlugin(ScrollTrigger);

interface PlanViewerProps {
  trip: TripPlan;
}

export default function PlanViewer({ trip }: PlanViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Refresh ScrollTrigger on mount to ensure correct position calculations
  useGSAP(() => {
    ScrollTrigger.refresh();
  }, { scope: containerRef, dependencies: [trip.id] });

  return (
    <div ref={containerRef} className="bg-black text-white">
      <HeroScene trip={trip} />
      <OverviewScene trip={trip} />
      {trip.days.map((day, i) => (
        <DayScene
          key={day.id}
          day={day}
          index={i}
          totalDays={trip.days.length}
        />
      ))}
      <RouteMapScene trip={trip} />
      <ClosingScene trip={trip} />
    </div>
  );
}
