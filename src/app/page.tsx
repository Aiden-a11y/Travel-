"use client";

import Link from "next/link";
import { ArrowRight, Map, Sparkles } from "lucide-react";
import { useLangStore } from "@/store/langStore";

const T = {
  ko: {
    nav: { trips: "내 여행", ai: "AI 추천" },
    eyebrow: "당신만의 여행을 계획하세요",
    title1: "여행의 모든 순간을",
    title2: "아름답게 기록하다",
    desc: "일정을 직접 입력하거나 AI 추천을 받아\n나만의 완벽한 여행 계획을 만들어보세요.",
    cta1: "여행 계획 만들기",
    cta2: "AI 여행지 추천",
  },
  en: {
    nav: { trips: "My Trips", ai: "AI Picks" },
    eyebrow: "Plan your perfect trip",
    title1: "Every moment of your journey,",
    title2: "beautifully captured.",
    desc: "Build your itinerary manually or let AI\nrecommend the perfect destination.",
    cta1: "Plan a Trip",
    cta2: "AI Recommendations",
  },
};

export default function LandingPage() {
  const { lang, toggle } = useLangStore();
  const t = T[lang];

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-black to-purple-950/20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5">
        <span className="font-semibold text-lg tracking-tight">Travel Planner</span>
        <div className="flex items-center gap-6 text-sm text-white/60">
          <Link href="/trips" className="hover:text-white transition-colors">{t.nav.trips}</Link>
          <Link href="/recommendations" className="hover:text-white transition-colors">{t.nav.ai}</Link>
          <button
            onClick={toggle}
            className="px-3 py-1 rounded-full border border-white/15 hover:border-white/30 text-white/50 hover:text-white text-xs font-medium transition-colors tracking-wide"
          >
            {lang === "ko" ? "EN" : "한"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 text-center px-6 max-w-3xl">
        <p className="text-sm font-medium text-blue-400 tracking-widest uppercase mb-6">
          {t.eyebrow}
        </p>
        <h1 className="text-6xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
          {t.title1}
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {t.title2}
          </span>
        </h1>
        <p className="text-xl text-white/50 mb-12 leading-relaxed whitespace-pre-line">
          {t.desc}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/trips/new"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl font-semibold text-base transition-all hover:scale-105"
          >
            <Map size={18} />
            {t.cta1}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/recommendations"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-semibold text-base transition-all hover:scale-105 border border-white/10"
          >
            <Sparkles size={18} />
            {t.cta2}
          </Link>
        </div>
      </div>
    </div>
  );
}
