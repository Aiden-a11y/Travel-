"use client";

import { create } from "zustand";
import type { TripDay } from "@/lib/types";

interface DraftTrip {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string;
  currency: string;
  tags: string[];
  days: TripDay[];
}

interface DraftTripStore {
  draft: DraftTrip;
  currentStep: number;
  setField: <K extends keyof DraftTrip>(key: K, value: DraftTrip[K]) => void;
  setDays: (days: TripDay[]) => void;
  setStep: (step: number) => void;
  reset: () => void;
}

const initialDraft: DraftTrip = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  coverImageUrl: "",
  currency: "KRW",
  tags: [],
  days: [],
};

export const useDraftTripStore = create<DraftTripStore>()((set) => ({
  draft: initialDraft,
  currentStep: 0,

  setField: (key, value) =>
    set((s) => ({ draft: { ...s.draft, [key]: value } })),

  setDays: (days) =>
    set((s) => ({ draft: { ...s.draft, days } })),

  setStep: (step) => set({ currentStep: step }),

  reset: () => set({ draft: initialDraft, currentStep: 0 }),
}));
