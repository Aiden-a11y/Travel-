"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";
import type { TripPlan } from "@/lib/types";
import ParallaxImage from "../elements/ParallaxImage";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface HeroSceneProps {
  trip: TripPlan;
}

export default function HeroScene({ trip }: HeroSceneProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  const totalDays = trip.days.length;
  const totalActivities = trip.days.reduce((sum, d) => sum + d.activities.length, 0);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "20% top",
        end: "90% top",
        scrub: true,
      },
    });

    // Title exits with blur as hero scrolls out
    tl.to(
      titleRef.current,
      { opacity: 0, y: -60, filter: "blur(12px)", ease: "none" },
      0
    );
    tl.to(
      subtitleRef.current,
      { opacity: 0, y: -40, filter: "blur(8px)", ease: "none" },
      0.1
    );
    tl.to(
      badgesRef.current,
      { opacity: 0, y: -30, ease: "none" },
      0.15
    );

    // Chevron pulses and fades
    gsap.to(chevronRef.current, {
      y: 8,
      repeat: -1,
      yoyo: true,
      duration: 1.2,
      ease: "sine.inOut",
    });
  }, { scope: sectionRef });

  // Entrance animation
  useGSAP(() => {
    gsap.from(titleRef.current, {
      opacity: 0,
      y: 40,
      filter: "blur(12px)",
      duration: 1.2,
      delay: 0.3,
      ease: "power3.out",
    });
    gsap.from(subtitleRef.current, {
      opacity: 0,
      y: 30,
      filter: "blur(8px)",
      duration: 1,
      delay: 0.6,
      ease: "power3.out",
    });
    gsap.from(badgesRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.8,
      delay: 0.9,
      ease: "power2.out",
    });
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="viewer-scene relative w-full h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      <ParallaxImage
        src={trip.coverImageUrl}
        speed={0.25}
        gradient="from-black/70 via-black/30 to-black/80"
      />

      {/* Back button */}
      <Link
        href="/trips"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        목록
      </Link>

      {/* Edit button */}
      <Link
        href={`/trips/${trip.id}`}
        className="absolute top-6 right-6 z-20 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors border border-white/10"
      >
        편집
      </Link>

      {/* Main content */}
      <div className="relative z-10 text-center px-8 max-w-4xl">
        <div ref={subtitleRef} className="mb-4">
          <span className="text-sm text-white/50 tracking-widest uppercase">
            {trip.startDate} ~ {trip.endDate}
          </span>
        </div>

        <div ref={titleRef}>
          <h1 className="text-7xl md:text-8xl font-bold text-white leading-none tracking-tight mb-6">
            {trip.title}
          </h1>
          {trip.description && (
            <p className="text-xl text-white/50 leading-relaxed max-w-2xl mx-auto">
              {trip.description}
            </p>
          )}
        </div>

        <div ref={badgesRef} className="flex items-center justify-center gap-6 mt-8">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-white">{totalDays}</span>
            <span className="text-sm text-white/40 mt-1">일</span>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-white">
              {trip.destinations.length}
            </span>
            <span className="text-sm text-white/40 mt-1">도시</span>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-white">{totalActivities}</span>
            <span className="text-sm text-white/40 mt-1">활동</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={chevronRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/30"
      >
        <ChevronDown size={28} />
      </div>
    </section>
  );
}
