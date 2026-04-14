"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTripStore } from "@/store/tripStore";
import { useDraftTripStore } from "@/store/draftTripStore";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { trips, updateTrip } = useTripStore();
  const trip = trips.find((t) => t.id === id);

  const { draft, setField, setDays, reset } = useDraftTripStore();

  useEffect(() => {
    if (trip) {
      setField("title", trip.title);
      setField("description", trip.description ?? "");
      setField("startDate", trip.startDate);
      setField("endDate", trip.endDate);
      setField("coverImageUrl", trip.coverImageUrl ?? "");
      setField("currency", trip.currency);
      setField("tags", trip.tags);
      setDays(trip.days);
    }
    return () => reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-white/40">여행을 찾을 수 없습니다.</p>
        <Link href="/trips" className="mt-4 text-blue-400 hover:underline text-sm">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    const destinations = [...new Set(draft.days.map((d) => d.destination).filter(Boolean))];
    updateTrip(id, {
      title: draft.title,
      description: draft.description || undefined,
      startDate: draft.startDate,
      endDate: draft.endDate,
      coverImageUrl: draft.coverImageUrl || undefined,
      currency: draft.currency,
      tags: draft.tags,
      days: draft.days,
      destinations,
    });
    reset();
    router.push(`/trips/${id}/view`);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/trips" className="p-2 hover:bg-white/8 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-white/60" />
        </Link>
        <h1 className="text-2xl font-bold text-white">여행 수정</h1>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-white/60 mb-2">여행 제목</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setField("title", e.target.value)}
            className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">출발일</label>
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
              className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">귀국일</label>
            <input
              type="date"
              value={draft.endDate}
              onChange={(e) => setField("endDate", e.target.value)}
              className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">커버 이미지 URL</label>
          <input
            type="text"
            value={draft.coverImageUrl}
            onChange={(e) => setField("coverImageUrl", e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-white/8 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-medium transition-colors"
        >
          저장하고 뷰어 열기
        </button>
      </div>
    </div>
  );
}
