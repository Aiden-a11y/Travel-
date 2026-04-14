"use client";

import Link from "next/link";
import { useTripStore } from "@/store/tripStore";
import { MapPin, Calendar, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_COLORS: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  confirmed: "확정",
  completed: "완료",
};

export default function TripsPage() {
  const { trips, removeTrip } = useTripStore();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white">내 여행</h1>
          <p className="text-white/40 mt-1">{trips.length}개의 여행 계획</p>
        </div>
        <Link
          href="/trips/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-medium transition-colors"
        >
          <Plus size={16} />새 여행 만들기
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <MapPin size={32} className="text-white/20" />
          </div>
          <p className="text-white/40 text-lg mb-2">아직 여행 계획이 없어요</p>
          <p className="text-white/20 text-sm mb-8">첫 번째 여행을 계획해볼까요?</p>
          <Link
            href="/trips/new"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-medium transition-colors"
          >
            여행 계획 만들기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {trips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl bg-white/5 border border-white/8 overflow-hidden cursor-pointer"
              >
                {/* Cover image / gradient */}
                <div className="h-44 bg-gradient-to-br from-blue-900/40 to-purple-900/40 relative">
                  {trip.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={trip.coverImageUrl}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin size={36} className="text-white/20" />
                    </div>
                  )}
                  {/* Status badge */}
                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[trip.status]}`}>
                    {STATUS_LABEL[trip.status]}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-white truncate">{trip.title}</h2>

                  <div className="flex items-center gap-1 text-white/40 text-sm mt-1.5">
                    <Calendar size={13} />
                    <span>{trip.startDate} ~ {trip.endDate}</span>
                  </div>

                  <div className="flex items-center gap-1 text-white/40 text-sm mt-1">
                    <MapPin size={13} />
                    <span>{trip.destinations.join(" → ")}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-5">
                    <Link
                      href={`/trips/${trip.id}/view`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/8 hover:bg-white/15 rounded-lg text-sm text-white transition-colors"
                    >
                      <Eye size={14} />
                      뷰어
                    </Link>
                    <Link
                      href={`/trips/${trip.id}`}
                      className="flex items-center justify-center p-2 bg-white/8 hover:bg-white/15 rounded-lg text-sm text-white transition-colors"
                    >
                      <Pencil size={14} />
                    </Link>
                    <button
                      onClick={() => removeTrip(trip.id)}
                      className="flex items-center justify-center p-2 bg-white/8 hover:bg-red-500/30 hover:text-red-400 rounded-lg text-sm text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
