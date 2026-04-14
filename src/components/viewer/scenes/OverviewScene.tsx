"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";
import type { TripPlan } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger);

export default function OverviewScene({ trip }: { trip: TripPlan }) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    // Content fades in on enter, fades out on leave
    gsap.from(contentRef.current, {
      opacity: 0,
      y: 60,
      filter: "blur(8px)",
      duration: 0.6,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 75%",
        end: "top 30%",
        scrub: 1,
      },
    });

    // Individual items stagger
    itemsRef.current.forEach((el, i) => {
      if (!el) return;
      gsap.from(el, {
        opacity: 0,
        y: 40,
        filter: "blur(6px)",
        duration: 0.5,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: `top ${70 - i * 5}%`,
          end: `top ${30 - i * 5}%`,
          scrub: 1,
        },
      });
    });
  }, { scope: sectionRef });

  const destinations = trip.destinations.filter(Boolean);

  return (
    <section
      ref={sectionRef}
      className="viewer-scene relative w-full min-h-screen flex flex-col items-center justify-center px-8 bg-black"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black pointer-events-none" />

      <div ref={contentRef} className="relative z-10 text-center max-w-4xl">
        <p className="text-sm text-blue-400 tracking-widest uppercase mb-8">여행 개요</p>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-16 leading-tight">
          {trip.days.length}일간의 여정,
          <br />
          <span className="text-white/40">{destinations.join(" · ")}</span>
        </h2>

        {/* Destination timeline */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          {destinations.map((dest, i) => (
            <div key={dest} className="flex items-center gap-4">
              <div
                ref={(el) => { itemsRef.current[i] = el; }}
                className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-medium"
              >
                {dest}
              </div>
              {i < destinations.length - 1 && (
                <div className="text-white/20 text-xl">→</div>
              )}
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-8">
          {[
            { value: trip.days.length, label: "일" },
            {
              value: trip.days.reduce((s, d) => s + d.activities.length, 0),
              label: "가지 활동",
            },
            {
              value: trip.totalBudget
                ? `${trip.totalBudget.toLocaleString()} ${trip.currency}`
                : "–",
              label: "예산",
            },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-5xl font-bold text-white mb-2">{value}</div>
              <div className="text-white/40 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
