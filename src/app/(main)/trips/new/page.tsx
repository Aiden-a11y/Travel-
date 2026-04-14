"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import { useTripStore } from "@/store/tripStore";
import { useDraftTripStore } from "@/store/draftTripStore";
import type { TripDay, Activity, ActivityCategory } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  Sparkles,
  PenLine,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  food: "식사",
  sightseeing: "관광",
  transport: "이동",
  accommodation: "숙소",
  adventure: "액티비티",
  culture: "문화",
  shopping: "쇼핑",
  rest: "휴식",
};

const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  food: "🍜",
  sightseeing: "🏛️",
  transport: "🚄",
  accommodation: "🏨",
  adventure: "🧗",
  culture: "🎭",
  shopping: "🛍️",
  rest: "☕",
};

async function fetchDestinationPhoto(destination: string): Promise<string | undefined> {
  // Try exact name, then first significant word (e.g. "Denver Downtown" → "Denver")
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

// ─── AI Import (줄글 → 구조화) ───────────────────────────────────────────────

function AIImportPanel({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    title: string;
    days: number;
    activities: number;
    destinations: string[];
  } | null>(null);

  const { setField, setDays } = useDraftTripStore();

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setPreview(null);

    try {
      const res = await fetch("/api/parse-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "파싱 실패");

      const trip = data.trip;

      // Assign UUIDs to days and activities
      const days: TripDay[] = (trip.days ?? []).map((d: TripDay & { activities: (Activity & { id?: string })[] }, i: number) => ({
        ...d,
        id: uuid(),
        dayNumber: i + 1,
        activities: (d.activities ?? []).map((a) => ({
          ...a,
          id: uuid(),
          category: a.category as ActivityCategory,
        })),
      }));

      // Fetch destination photos in parallel (deduplicated)
      const uniqueDestinations = [...new Set(days.map((d: TripDay) => d.destination).filter(Boolean))] as string[];
      const photoMap: Record<string, string | undefined> = {};
      await Promise.all(
        uniqueDestinations.map(async (dest) => {
          photoMap[dest] = await fetchDestinationPhoto(dest);
        })
      );
      const daysWithPhotos = days.map((d: TripDay) => ({
        ...d,
        coverImageUrl: d.coverImageUrl || photoMap[d.destination] || undefined,
      }));

      // Populate draft
      setField("title", trip.title ?? "");
      setField("description", trip.description ?? "");
      setField("startDate", trip.startDate ?? "");
      setField("endDate", trip.endDate ?? "");
      setField("currency", trip.currency ?? "KRW");
      setDays(daysWithPhotos);

      setPreview({
        title: trip.title,
        days: days.length,
        activities: days.reduce((s: number, d: TripDay) => s + d.activities.length, 0),
        destinations: [...new Set(days.map((d: TripDay) => d.destination).filter(Boolean))] as string[],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
        <p className="text-blue-300 text-sm leading-relaxed">
          여행 일정을 자유롭게 적어주세요. 날짜, 도시, 활동, 식사, 이동 수단 등
          생각나는 대로 입력하면 AI가 자동으로 분류합니다.
        </p>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">여행 일정 (줄글)</label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPreview(null);
          }}
          placeholder={`예시:\n3월 15일 도쿄 도착. 신주쿠 호텔 체크인.\n저녁은 라멘 먹고 가부키초 구경.\n\n3월 16일 아사쿠사 센소지 관람, 점심 텐동,\n오후 시부야 스크램블 교차로 구경,\n저녁 스시 오마카세 (약 3만엔).`}
          rows={10}
          className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm leading-relaxed"
        />
        <p className="text-white/20 text-xs mt-1.5">한국어, 영어 모두 인식 가능합니다</p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/8 border border-green-500/20 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-green-400 text-sm font-medium">파싱 완료</span>
          </div>
          <p className="text-white font-semibold mb-1">{preview.title}</p>
          <p className="text-white/50 text-sm">
            {preview.destinations.join(" → ")}
          </p>
          <p className="text-white/40 text-sm mt-1">
            {preview.days}일 · 활동 {preview.activities}개
          </p>
          <p className="text-white/25 text-xs mt-2">
            다음 단계에서 내용을 수정할 수 있습니다.
          </p>
        </motion.div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleParse}
          disabled={loading || !text.trim()}
          className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI가 분석 중...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              AI로 파싱하기
            </>
          )}
        </button>
        {preview && (
          <button
            onClick={onDone}
            className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-colors border border-white/10 flex items-center gap-2"
          >
            수정하러 가기
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Basic info ──────────────────────────────────────────────────────

function StepBasicInfo() {
  const { draft, setField } = useDraftTripStore();

  const handleDatesChange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return;

    const days: TripDay[] = [];
    const current = new Date(start);
    let dayNumber = 1;
    while (current <= end) {
      const existingDay = draft.days.find((d) => d.date === current.toISOString().split("T")[0]);
      days.push(
        existingDay ?? {
          id: uuid(),
          dayNumber,
          date: current.toISOString().split("T")[0],
          destination: "",
          activities: [],
        }
      );
      current.setDate(current.getDate() + 1);
      dayNumber++;
    }
    setField("days", days);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-white/60 mb-2">여행 제목 *</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="예: 도쿄 벚꽃 여행"
          className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-2">출발일 *</label>
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => {
              setField("startDate", e.target.value);
              handleDatesChange(e.target.value, draft.endDate);
            }}
            className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-2">귀국일 *</label>
          <input
            type="date"
            value={draft.endDate}
            onChange={(e) => {
              setField("endDate", e.target.value);
              handleDatesChange(draft.startDate, e.target.value);
            }}
            className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">설명 (선택)</label>
        <textarea
          value={draft.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="여행에 대한 간단한 메모"
          rows={3}
          className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">커버 이미지 URL (선택)</label>
        <input
          type="text"
          value={draft.coverImageUrl}
          onChange={(e) => setField("coverImageUrl", e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {draft.days.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <span className="text-blue-400 text-sm">
            ✓ {draft.days.length}일 일정이 준비됐습니다. 다음 단계에서 활동을 확인·수정하세요.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Days & activities ───────────────────────────────────────────────

function ActivityForm({
  activity,
  onChange,
  onRemove,
}: {
  activity: Activity;
  onChange: (patch: Partial<Activity>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-4 bg-white/5 border border-white/8 rounded-xl space-y-3">
      <div className="flex items-start justify-between gap-3">
        <input
          type="text"
          value={activity.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="활동 이름 *"
          className="flex-1 px-3 py-2 bg-white/8 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm transition-colors"
        />
        <button onClick={onRemove} className="p-2 hover:text-red-400 text-white/40 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(CATEGORY_LABELS) as ActivityCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => onChange({ category: cat })}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
              activity.category === cat
                ? "bg-blue-500 text-white"
                : "bg-white/5 text-white/40 hover:bg-white/10"
            }`}
          >
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-white/30" />
          <input
            type="time"
            value={activity.startTime ?? ""}
            onChange={(e) => onChange({ startTime: e.target.value })}
            className="flex-1 px-2 py-1.5 bg-white/8 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <span className="text-white/20 text-xs">~</span>
          <input
            type="time"
            value={activity.endTime ?? ""}
            onChange={(e) => onChange({ endTime: e.target.value })}
            className="flex-1 px-2 py-1.5 bg-white/8 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={13} className="text-white/30" />
          <input
            type="number"
            value={activity.estimatedCost ?? ""}
            onChange={(e) => onChange({ estimatedCost: Number(e.target.value) })}
            placeholder="예상 비용"
            className="flex-1 px-2 py-1.5 bg-white/8 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <MapPin size={13} className="text-white/30 shrink-0" />
        <input
          type="text"
          value={activity.location ?? ""}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder="장소 (선택)"
          className="flex-1 px-2 py-1.5 bg-white/8 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="flex items-start gap-2">
        <FileText size={13} className="text-white/30 mt-2 shrink-0" />
        <textarea
          value={activity.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="메모 (선택)"
          rows={2}
          className="flex-1 px-2 py-1.5 bg-white/8 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
      </div>
    </div>
  );
}

function DayCard({ day, dayIndex }: { day: TripDay; dayIndex: number }) {
  const { draft, setDays } = useDraftTripStore();

  const updateDay = (patch: Partial<TripDay>) => {
    const newDays = [...draft.days];
    newDays[dayIndex] = { ...newDays[dayIndex], ...patch };
    setDays(newDays);
  };

  const addActivity = () => {
    const newActivity: Activity = { id: uuid(), name: "", category: "sightseeing" };
    updateDay({ activities: [...day.activities, newActivity] });
  };

  const updateActivity = (activityId: string, patch: Partial<Activity>) => {
    updateDay({ activities: day.activities.map((a) => (a.id === activityId ? { ...a, ...patch } : a)) });
  };

  const removeActivity = (activityId: string) => {
    updateDay({ activities: day.activities.filter((a) => a.id !== activityId) });
  };

  return (
    <div className="border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
          {day.dayNumber}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/40 mb-1">{day.date} — 목적지</label>
            <input
              type="text"
              value={day.destination}
              onChange={(e) => updateDay({ destination: e.target.value })}
              placeholder="예: 도쿄"
              className="w-full px-3 py-2 bg-white/8 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">테마 (선택)</label>
            <input
              type="text"
              value={day.theme ?? ""}
              onChange={(e) => updateDay({ theme: e.target.value })}
              placeholder="예: 시내 관광일"
              className="w-full px-3 py-2 bg-white/8 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="ml-14 space-y-3">
        {day.activities.map((activity) => (
          <ActivityForm
            key={activity.id}
            activity={activity}
            onChange={(patch) => updateActivity(activity.id, patch)}
            onRemove={() => removeActivity(activity.id)}
          />
        ))}
        <button
          onClick={addActivity}
          className="w-full py-2.5 border border-dashed border-white/15 rounded-xl text-white/30 hover:text-white/60 hover:border-white/25 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={14} />
          활동 추가
        </button>
      </div>
    </div>
  );
}

function StepDays() {
  const { draft } = useDraftTripStore();

  if (draft.days.length === 0) {
    return (
      <div className="text-center py-12 text-white/40">
        먼저 이전 단계에서 날짜를 설정해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {draft.days.map((day, index) => (
        <DayCard key={day.id} day={day} dayIndex={index} />
      ))}
    </div>
  );
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

type Mode = "choose" | "ai" | "manual";
const STEPS = ["기본 정보", "일정 입력", "확인"];

export default function NewTripPage() {
  const router = useRouter();
  const { draft, currentStep, setStep, reset } = useDraftTripStore();
  const { addTrip } = useTripStore();
  const [mode, setMode] = useState<Mode>("choose");
  const [saving, setSaving] = useState(false);

  const canProceed = () => {
    if (currentStep === 0) return !!draft.title && !!draft.startDate && !!draft.endDate;
    return true;
  };

  const handleSave = () => {
    setSaving(true);
    const now = new Date().toISOString();
    const tripId = uuid();
    const destinations = [...new Set(draft.days.map((d) => d.destination).filter(Boolean))];

    addTrip({
      id: tripId,
      title: draft.title,
      description: draft.description || undefined,
      status: "draft",
      coverImageUrl: draft.coverImageUrl || undefined,
      startDate: draft.startDate,
      endDate: draft.endDate,
      destinations,
      days: draft.days,
      currency: draft.currency,
      tags: draft.tags,
      createdAt: now,
      updatedAt: now,
    });

    reset();
    setSaving(false);
    router.push(`/trips/${tripId}/view`);
  };

  // ── Mode selection screen ────────────────────────────────────────────────
  if (mode === "choose") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/8 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} className="text-white/60" />
          </button>
          <h1 className="text-2xl font-bold text-white">새 여행 만들기</h1>
        </div>

        <p className="text-white/40 text-sm mb-6">입력 방식을 선택하세요</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ y: -4 }}
            onClick={() => setMode("ai")}
            className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/25 hover:border-blue-500/50 text-left transition-colors group"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
              <Sparkles size={22} className="text-blue-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">AI로 가져오기</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              여행 일정을 자유롭게 텍스트로 입력하면 AI가 자동으로 날짜·활동·카테고리로 분류해드립니다.
            </p>
          </motion.button>

          <motion.button
            whileHover={{ y: -4 }}
            onClick={() => setMode("manual")}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-left transition-colors group"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/8 flex items-center justify-center mb-4 group-hover:bg-white/12 transition-colors">
              <PenLine size={22} className="text-white/60" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">직접 입력</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              날짜, 목적지, 활동을 단계별로 직접 입력해서 여행 계획을 만들어보세요.
            </p>
          </motion.button>
        </div>
      </div>
    );
  }

  // ── AI import screen ─────────────────────────────────────────────────────
  if (mode === "ai") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => { reset(); setMode("choose"); }}
            className="p-2 hover:bg-white/8 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} className="text-white/60" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">AI로 가져오기</h1>
            <p className="text-white/40 text-sm mt-0.5">줄글을 붙여넣으면 자동 분류</p>
          </div>
        </div>

        <AIImportPanel
          onDone={() => setMode("manual")}
        />
      </div>
    );
  }

  // ── Manual wizard ────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={() => { if (currentStep === 0) { reset(); setMode("choose"); } else setStep(currentStep - 1); }}
          className="p-2 hover:bg-white/8 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">새 여행 만들기</h1>
          <p className="text-white/40 text-sm mt-0.5">{STEPS[currentStep]}</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < currentStep
                  ? "bg-blue-500 text-white"
                  : i === currentStep
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                  : "bg-white/5 text-white/20"
              }`}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span className={`text-sm ${i === currentStep ? "text-white" : "text-white/30"}`}>
              {step}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px mx-1 ${i < currentStep ? "bg-blue-500" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 0 && <StepBasicInfo />}
          {currentStep === 1 && <StepDays />}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/8">
                <h3 className="text-lg font-semibold text-white mb-3">{draft.title}</h3>
                <p className="text-white/40 text-sm">{draft.startDate} ~ {draft.endDate}</p>
                <p className="text-white/40 text-sm mt-1">{draft.days.length}일 일정</p>
                {draft.days.map((day) => (
                  <div key={day.id} className="mt-3 text-sm">
                    <span className="text-white/60">Day {day.dayNumber}</span>
                    <span className="text-white/40 ml-2">{day.destination}</span>
                    <span className="text-white/20 ml-2">활동 {day.activities.length}개</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/8">
        <button
          onClick={() => currentStep === 0 ? setMode("choose") : setStep(currentStep - 1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-colors"
        >
          <ArrowLeft size={16} />
          이전
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(currentStep + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            다음
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장하고 뷰어 열기"}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
