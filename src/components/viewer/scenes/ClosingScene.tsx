"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";
import type { TripPlan } from "@/lib/types";
import Link from "next/link";
import { Pencil, ListChecks } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function ClosingScene({ trip }: { trip: TripPlan }) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(contentRef.current, {
      opacity: 0,
      y: 50,
      filter: "blur(8px)",
      duration: 0.8,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 70%",
        end: "top 30%",
        scrub: 1,
      },
    });
  }, { scope: sectionRef });

  const totalActivities = trip.days.reduce((s, d) => s + d.activities.length, 0);

  return (
    <section
      ref={sectionRef}
      className="viewer-scene relative w-full min-h-screen flex items-center justify-center bg-black overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

      <div ref={contentRef} className="relative z-10 text-center px-8 max-w-3xl">
        <p className="text-sm text-blue-400 tracking-widest uppercase mb-6">여행 요약</p>

        <h2 className="text-6xl md:text-7xl font-bold text-white mb-4 leading-tight">
          {trip.title}
        </h2>

        <p className="text-white/40 text-xl mb-16">
          {trip.startDate} ~ {trip.endDate}
        </p>

        {/* Summary stats */}
        <div className="flex items-center justify-center gap-12 mb-16">
          <div className="text-center">
            <div className="text-5xl font-bold text-white">{trip.days.length}</div>
            <div className="text-white/30 text-sm mt-2">박</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-white">{trip.destinations.length}</div>
            <div className="text-white/30 text-sm mt-2">도시</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-white">{totalActivities}</div>
            <div className="text-white/30 text-sm mt-2">활동</div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href={`/trips/${trip.id}`}
            className="flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-medium transition-colors border border-white/10"
          >
            <Pencil size={16} />
            편집하기
          </Link>
          <Link
            href="/trips"
            className="flex items-center gap-2 px-7 py-3.5 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl font-medium transition-colors"
          >
            <ListChecks size={16} />
            목록으로
          </Link>
        </div>
      </div>
    </section>
  );
}
