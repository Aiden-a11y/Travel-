"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";
import type { TripPlan } from "@/lib/types";
import { Route, Sparkles, Loader2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Load map only on client (Leaflet requires window)
const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

export default function RouteMapScene({ trip }: { trip: TripPlan }) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const [analysis, setAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [started, setStarted] = useState(false);

  const startAnalysis = useCallback(async () => {
    if (started) return;
    setStarted(true);
    setAnalyzing(true);

    try {
      const res = await fetch("/api/route-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip }),
      });
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const { delta } = JSON.parse(payload);
            if (delta) setAnalysis((prev) => prev + delta);
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
      setAnalysis("분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }, [started, trip]);

  // Trigger AI analysis when scene scrolls into view
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startAnalysis();
      },
      { threshold: 0.25 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [startAnalysis]);

  // Fade-in animation on scroll
  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          once: true,
        },
      });
      tl.from(titleRef.current, { opacity: 0, y: 24, duration: 0.6, ease: "power2.out" })
        .from(mapRef.current, { opacity: 0, x: -24, duration: 0.6, ease: "power2.out" }, "-=0.3")
        .from(analysisRef.current, { opacity: 0, x: 24, duration: 0.6, ease: "power2.out" }, "-=0.4");
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="viewer-scene relative w-full min-h-screen bg-black flex flex-col px-6 md:px-12 py-16"
    >
      {/* Header */}
      <div ref={titleRef} className="flex items-center gap-3 mb-8">
        <Route size={18} className="text-blue-400" />
        <h2 className="text-white/70 text-sm font-medium tracking-[0.2em] uppercase">
          Route Analysis
        </h2>
      </div>

      {/* Map + Analysis grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ minHeight: 480 }}>
        {/* Map */}
        <div
          ref={mapRef}
          className="rounded-2xl overflow-hidden border border-white/10"
          style={{ minHeight: 400 }}
        >
          <RouteMap trip={trip} />
        </div>

        {/* AI Analysis */}
        <div ref={analysisRef} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-white/50 text-xs tracking-widest uppercase">AI 경로 분석</span>
            {analyzing && (
              <Loader2 size={12} className="text-amber-400 animate-spin ml-1" />
            )}
          </div>

          <div className="flex-1 bg-white/[0.03] rounded-2xl border border-white/10 p-5 overflow-y-auto">
            {!started && (
              <p className="text-white/25 text-sm">스크롤하면 AI 분석이 시작됩니다</p>
            )}
            {started && !analysis && analyzing && (
              <p className="text-white/30 text-sm animate-pulse">분석 중…</p>
            )}
            {analysis && (
              <p className="text-white/65 text-sm leading-7 whitespace-pre-wrap">
                {analysis}
                {analyzing && (
                  <span className="inline-block w-[2px] h-[1em] bg-white/40 ml-0.5 align-middle animate-pulse" />
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
