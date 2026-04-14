"use client";

import type { Activity, ActivityCategory } from "@/lib/types";
import { Clock, MapPin, DollarSign } from "lucide-react";

const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { label: string; icon: string; color: string }
> = {
  food: { label: "식사", icon: "🍜", color: "from-orange-500/20 to-amber-500/20" },
  sightseeing: { label: "관광", icon: "🏛️", color: "from-blue-500/20 to-cyan-500/20" },
  transport: { label: "이동", icon: "🚄", color: "from-slate-500/20 to-gray-500/20" },
  accommodation: { label: "숙소", icon: "🏨", color: "from-purple-500/20 to-violet-500/20" },
  adventure: { label: "액티비티", icon: "🧗", color: "from-green-500/20 to-emerald-500/20" },
  culture: { label: "문화", icon: "🎭", color: "from-pink-500/20 to-rose-500/20" },
  shopping: { label: "쇼핑", icon: "🛍️", color: "from-yellow-500/20 to-lime-500/20" },
  rest: { label: "휴식", icon: "☕", color: "from-teal-500/20 to-cyan-500/20" },
};

interface ActivityCardProps {
  activity: Activity;
  className?: string;
}

export default function ActivityCard({ activity, className = "" }: ActivityCardProps) {
  const config = CATEGORY_CONFIG[activity.category];

  return (
    <div
      className={`activity-card flex-shrink-0 w-72 rounded-2xl bg-gradient-to-br ${config.color} border border-white/10 backdrop-blur-sm p-5 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{config.icon}</span>
        <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
          {config.label}
        </span>
      </div>

      <h4 className="text-white font-semibold text-base leading-tight mb-3">
        {activity.name || "이름 없음"}
      </h4>

      <div className="space-y-1.5">
        {(activity.startTime || activity.endTime) && (
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <Clock size={11} />
            <span>
              {activity.startTime}
              {activity.endTime && ` ~ ${activity.endTime}`}
            </span>
          </div>
        )}
        {activity.location && (
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <MapPin size={11} />
            <span className="truncate">{activity.location}</span>
          </div>
        )}
        {activity.estimatedCost != null && (
          <div className="flex items-center gap-1.5 text-white/50 text-xs">
            <DollarSign size={11} />
            <span>{activity.estimatedCost.toLocaleString()} {activity.currency ?? "원"}</span>
          </div>
        )}
        {activity.notes && (
          <p className="text-white/35 text-xs mt-2 leading-relaxed line-clamp-2">
            {activity.notes}
          </p>
        )}
      </div>
    </div>
  );
}
