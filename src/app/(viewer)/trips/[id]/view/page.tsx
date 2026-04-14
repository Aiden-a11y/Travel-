"use client";

import { use } from "react";
import { useTripStore } from "@/store/tripStore";
import PlanViewer from "@/components/viewer/PlanViewer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TripViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { trips } = useTripStore();
  const trip = trips.find((t) => t.id === id);

  if (!trip) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center">
        <p className="text-white/40 text-lg mb-4">여행을 찾을 수 없습니다.</p>
        <Link href="/trips" className="flex items-center gap-2 text-blue-400 hover:underline text-sm">
          <ArrowLeft size={14} />
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return <PlanViewer trip={trip} />;
}
