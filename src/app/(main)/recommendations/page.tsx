"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDraftTripStore } from "@/store/draftTripStore";
import type { DestinationRecommendation } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, Calendar, Clock, ArrowRight, RotateCcw } from "lucide-react";

const MONTH_OPTIONS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

const STYLE_OPTIONS = [
  { id: "culture", label: "문화·역사", icon: "🏛️" },
  { id: "nature", label: "자연·트레킹", icon: "🏔️" },
  { id: "food", label: "미식 여행", icon: "🍜" },
  { id: "city", label: "도시·쇼핑", icon: "🏙️" },
  { id: "beach", label: "해변·휴양", icon: "🏖️" },
  { id: "adventure", label: "액티비티", icon: "🧗" },
];

function RecommendationCard({
  rec,
  index,
  onSelect,
}: {
  rec: DestinationRecommendation;
  index: number;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="rounded-2xl bg-white/5 border border-white/8 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white">{rec.destination}</h3>
            <p className="text-white/40 text-sm mt-0.5">{rec.country}</p>
          </div>
          <div className="flex items-center gap-1 text-white/30 text-sm">
            <Clock size={13} />
            <span>{rec.estimatedDays}일 추천</span>
          </div>
        </div>

        <p className="text-blue-400 text-sm font-medium mb-3 italic">
          &ldquo;{rec.tagline}&rdquo;
        </p>

        <p className="text-white/60 text-sm leading-relaxed mb-4">
          {rec.description}
        </p>

        {/* Best months */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Calendar size={13} className="text-white/30 shrink-0" />
          {rec.bestMonths.map((month) => (
            <span
              key={month}
              className="px-2 py-0.5 bg-white/8 rounded-full text-white/50 text-xs"
            >
              {month}
            </span>
          ))}
        </div>

        {/* Highlights */}
        <ul className="space-y-1.5 mb-6">
          {rec.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-white/60 text-sm">
              <span className="text-blue-400/60 mt-0.5">·</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-xl text-sm font-medium transition-colors border border-blue-500/20"
        >
          <MapPin size={14} />
          이 여행지로 계획 시작
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export default function RecommendationsPage() {
  const router = useRouter();
  const { setField, setDays } = useDraftTripStore();

  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [duration, setDuration] = useState("5");
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<DestinationRecommendation[]>([]);
  const [error, setError] = useState("");

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleMonth = (m: string) => {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setRecs([]);

    const preferences = [
      selectedStyles.length > 0 && `여행 스타일: ${selectedStyles.join(", ")}`,
      selectedMonths.length > 0 && `여행 시기: ${selectedMonths.join(", ")}`,
      duration && `여행 기간: ${duration}일`,
      freeText && `추가 요구사항: ${freeText}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: preferences || "일반적인 여행지 추천" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "추천을 가져오지 못했습니다");
      setRecs(data.recommendations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (rec: DestinationRecommendation) => {
    setField("title", `${rec.destination} 여행`);
    setField("description", rec.description);
    setDays([]);
    router.push("/trips/new");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">AI 여행지 추천</h1>
        <p className="text-white/40 mt-1">선호도를 입력하면 맞춤 여행지를 추천해드립니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-8">
        {/* Input panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/8 space-y-5">
            {/* Travel style */}
            <div>
              <label className="block text-sm text-white/60 mb-3">여행 스타일</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleStyle(s.id)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                      selectedStyles.includes(s.id)
                        ? "bg-blue-500 text-white"
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Best months */}
            <div>
              <label className="block text-sm text-white/60 mb-3">여행 시기</label>
              <div className="grid grid-cols-4 gap-1.5">
                {MONTH_OPTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => toggleMonth(m)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedMonths.includes(m)
                        ? "bg-blue-500 text-white"
                        : "bg-white/5 text-white/30 hover:bg-white/10"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm text-white/60 mb-2">여행 기간 (일)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="30"
                className="w-full px-4 py-2.5 bg-white/8 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Free text */}
            <div>
              <label className="block text-sm text-white/60 mb-2">기타 요구사항 (선택)</label>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="예: 혼자 여행, 예산 100만원, 동남아 선호..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white/8 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI가 추천 중...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  추천받기
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results panel */}
        <div>
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {recs.length === 0 && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Sparkles size={36} className="text-white/15 mb-4" />
              <p className="text-white/30 text-sm">
                선호도를 입력하고 추천받기를 눌러보세요
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-white/30 text-sm">맞춤 여행지를 찾고 있습니다...</p>
            </div>
          )}

          <AnimatePresence>
            {recs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-white/40 text-sm">{recs.length}개 추천 결과</p>
                  <button
                    onClick={() => setRecs([])}
                    className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm transition-colors"
                  >
                    <RotateCcw size={13} />
                    초기화
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recs.map((rec, i) => (
                    <RecommendationCard
                      key={rec.id}
                      rec={rec}
                      index={i}
                      onSelect={() => handleSelect(rec)}
                    />
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
