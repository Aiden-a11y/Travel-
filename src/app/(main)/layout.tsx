"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { useLangStore } from "@/store/langStore";

const T = {
  ko: { trips: "내 여행", ai: "AI 추천", newTrip: "+ 새 여행" },
  en: { trips: "My Trips", ai: "AI Picks", newTrip: "+ New Trip" },
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { lang, toggle } = useLangStore();
  const t = T[lang];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/70 backdrop-blur-xl border-b border-white/8">
        <Link href="/" className="flex items-center gap-2 text-white font-semibold text-lg">
          <Compass size={20} className="text-blue-400" />
          <span>Travel Planner</span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-white/70">
          <Link href="/trips" className="hover:text-white transition-colors">
            {t.trips}
          </Link>
          <Link href="/recommendations" className="hover:text-white transition-colors">
            {t.ai}
          </Link>
          <Link
            href="/trips/new"
            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-full transition-colors font-medium"
          >
            {t.newTrip}
          </Link>
          <button
            onClick={toggle}
            className="px-3 py-1 rounded-full border border-white/15 hover:border-white/30 text-white/50 hover:text-white text-xs font-medium transition-colors tracking-wide"
          >
            {lang === "ko" ? "EN" : "한"}
          </button>
        </div>
      </nav>
      <main className="pt-16">{children}</main>
    </div>
  );
}
