"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Lang = "ko" | "en";

interface LangStore {
  lang: Lang;
  toggle: () => void;
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: "ko",
      toggle: () => set((s) => ({ lang: s.lang === "ko" ? "en" : "ko" })),
    }),
    { name: "travel-planner-lang" }
  )
);
