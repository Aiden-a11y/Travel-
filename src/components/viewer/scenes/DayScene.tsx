"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";
import type { TripDay } from "@/lib/types";
import ParallaxImage from "../elements/ParallaxImage";
import ActivityCard from "../elements/ActivityCard";

gsap.registerPlugin(ScrollTrigger);

// Background gradients per day (cycles)
const DAY_GRADIENTS = [
  "from-blue-950 via-indigo-950 to-slate-900",
  "from-purple-950 via-violet-950 to-slate-900",
  "from-teal-950 via-cyan-950 to-slate-900",
  "from-rose-950 via-pink-950 to-slate-900",
  "from-amber-950 via-orange-950 to-slate-900",
  "from-green-950 via-emerald-950 to-slate-900",
];

interface DaySceneProps {
  day: TripDay;
  index: number;
  totalDays: number;
}

async function fetchPhoto(destination: string): Promise<string | undefined> {
  // Try exact name, then first word only (e.g. "Denver Downtown" → "Denver")
  for (const query of [destination, destination.split(/[\s,]/)[0]]) {
    if (!query) continue;
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();
        const url = data?.originalimage?.source ?? data?.thumbnail?.source;
        if (url) return url;
      }
    } catch {}
  }
  return undefined;
}

export default function DayScene({ day, index }: DaySceneProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsWrapRef = useRef<HTMLDivElement>(null);
  const gradientBg = DAY_GRADIENTS[index % DAY_GRADIENTS.length];

  const [bgImage, setBgImage] = useState(day.coverImageUrl);

  // Fetch photo for destinations that don't have one yet
  useEffect(() => {
    if (day.coverImageUrl || !day.destination) return;
    fetchPhoto(day.destination).then((url) => {
      if (url) setBgImage(url);
    });
  }, [day.coverImageUrl, day.destination]);

  const hasActivities = day.activities.length > 0;
  // Pin duration: 400px for header reveal + 350px per activity card
  const pinDuration = 400 + day.activities.length * 350;

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: `+=${pinDuration}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });

    // Phase 1: Day header fades in
    tl.from(
      headerRef.current,
      { opacity: 0, y: 60, filter: "blur(12px)", duration: 0.4 },
      0
    );

    if (hasActivities) {
      const cards = gsap.utils.toArray<HTMLElement>(".activity-card", cardsWrapRef.current!);

      // Phase 2: Cards enter from below, previous cards compress
      cards.forEach((card, i) => {
        const enterAt = 0.35 + i * 0.25;
        tl.from(
          card,
          { y: "100vh", opacity: 0, duration: 0.5, ease: "power2.out" },
          enterAt
        );
        // Compress previous card
        if (i > 0) {
          tl.to(
            cards[i - 1],
            { scale: 0.93, y: `-${i * 10}px`, opacity: 0.6, duration: 0.3 },
            enterAt
          );
        }
      });

      // Phase 3: Everything exits
      const exitAt = 0.35 + cards.length * 0.25 + 0.2;
      tl.to(
        [headerRef.current, cardsWrapRef.current],
        { opacity: 0, y: -50, filter: "blur(10px)", duration: 0.35 },
        exitAt
      );
    } else {
      // No activities — just header show/hide
      tl.to(
        headerRef.current,
        { opacity: 0, y: -50, filter: "blur(10px)", duration: 0.35 },
        0.7
      );
    }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="viewer-scene relative w-full h-screen overflow-hidden"
      style={{ overflow: "visible" }}
    >
      {/* Background */}
      {bgImage ? (
        <ParallaxImage
          src={bgImage}
          speed={0.25}
          gradient="from-black/60 via-black/20 to-black/70"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientBg}`} />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Day header */}
      <div
        ref={headerRef}
        className="absolute top-1/3 left-0 right-0 text-center px-8 z-10"
        style={{ transform: "translateY(-50%)" }}
      >
        <p className="text-sm text-white/40 tracking-widest uppercase mb-3">
          DAY {day.dayNumber} · {day.date}
        </p>
        <h2 className="text-7xl md:text-8xl font-bold text-white leading-none mb-4">
          {day.destination || "–"}
        </h2>
        {day.theme && (
          <p className="text-xl text-white/50">{day.theme}</p>
        )}
        {!hasActivities && (
          <p className="text-white/25 text-sm mt-4">활동이 없습니다</p>
        )}
      </div>

      {/* Activity cards — positioned in lower half */}
      {hasActivities && (
        <div
          ref={cardsWrapRef}
          className="absolute bottom-12 left-0 right-0 z-10 flex gap-4 px-8 overflow-visible"
          style={{ justifyContent: "center" }}
        >
          {day.activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {/* Day number indicator (bottom right) */}
      <div className="absolute bottom-6 right-8 z-20 text-white/20 text-sm font-mono">
        {day.dayNumber}
      </div>
    </section>
  );
}
