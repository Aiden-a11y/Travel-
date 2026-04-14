"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { TripPlan, TripDay, Activity, TripStoreState } from "@/lib/types";

interface TripStoreActions {
  addTrip: (trip: TripPlan) => void;
  updateTrip: (id: string, patch: Partial<TripPlan>) => void;
  removeTrip: (id: string) => void;
  setActiveTrip: (id: string | null) => void;

  addDay: (tripId: string, day: TripDay) => void;
  updateDay: (tripId: string, dayId: string, patch: Partial<TripDay>) => void;
  removeDay: (tripId: string, dayId: string) => void;

  addActivity: (tripId: string, dayId: string, activity: Activity) => void;
  updateActivity: (tripId: string, dayId: string, activityId: string, patch: Partial<Activity>) => void;
  removeActivity: (tripId: string, dayId: string, activityId: string) => void;

  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  reset: () => void;
}

const initialState: TripStoreState = {
  trips: [],
  activeTripId: null,
  isLoading: false,
  error: null,
};

export const useTripStore = create<TripStoreState & TripStoreActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        addTrip: (trip) =>
          set((s) => ({ trips: [...s.trips, trip] }), false, "addTrip"),

        updateTrip: (id, patch) =>
          set(
            (s) => ({
              trips: s.trips.map((t) =>
                t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
              ),
            }),
            false,
            "updateTrip"
          ),

        removeTrip: (id) =>
          set(
            (s) => ({
              trips: s.trips.filter((t) => t.id !== id),
              activeTripId: s.activeTripId === id ? null : s.activeTripId,
            }),
            false,
            "removeTrip"
          ),

        setActiveTrip: (id) => set({ activeTripId: id }, false, "setActiveTrip"),

        addDay: (tripId, day) =>
          set(
            (s) => ({
              trips: s.trips.map((t) =>
                t.id === tripId
                  ? { ...t, days: [...t.days, day], updatedAt: new Date().toISOString() }
                  : t
              ),
            }),
            false,
            "addDay"
          ),

        updateDay: (tripId, dayId, patch) =>
          set(
            (s) => ({
              trips: s.trips.map((t) =>
                t.id === tripId
                  ? {
                      ...t,
                      days: t.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)),
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
            }),
            false,
            "updateDay"
          ),

        removeDay: (tripId, dayId) =>
          set(
            (s) => ({
              trips: s.trips.map((t) =>
                t.id === tripId
                  ? {
                      ...t,
                      days: t.days.filter((d) => d.id !== dayId),
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
            }),
            false,
            "removeDay"
          ),

        addActivity: (tripId, dayId, activity) =>
          set(
            (s) => ({
              trips: s.trips.map((t) =>
                t.id === tripId
                  ? {
                      ...t,
                      days: t.days.map((d) =>
                        d.id === dayId
                          ? { ...d, activities: [...d.activities, activity] }
                          : d
                      ),
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
            }),
            false,
            "addActivity"
          ),

        updateActivity: (tripId, dayId, activityId, patch) =>
          set(
            (s) => ({
              trips: s.trips.map((t) =>
                t.id === tripId
                  ? {
                      ...t,
                      days: t.days.map((d) =>
                        d.id === dayId
                          ? {
                              ...d,
                              activities: d.activities.map((a) =>
                                a.id === activityId ? { ...a, ...patch } : a
                              ),
                            }
                          : d
                      ),
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
            }),
            false,
            "updateActivity"
          ),

        removeActivity: (tripId, dayId, activityId) =>
          set(
            (s) => ({
              trips: s.trips.map((t) =>
                t.id === tripId
                  ? {
                      ...t,
                      days: t.days.map((d) =>
                        d.id === dayId
                          ? {
                              ...d,
                              activities: d.activities.filter((a) => a.id !== activityId),
                            }
                          : d
                      ),
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
            }),
            false,
            "removeActivity"
          ),

        setLoading: (isLoading) => set({ isLoading }, false, "setLoading"),
        setError: (error) => set({ error }, false, "setError"),
        reset: () => set(initialState, false, "reset"),
      }),
      {
        name: "travel-planner-store",
        partialize: (state) => ({
          trips: state.trips,
          activeTripId: state.activeTripId,
        }),
      }
    ),
    { name: "TripStore" }
  )
);

export const selectActiveTrip = (state: TripStoreState & TripStoreActions) =>
  state.trips.find((t) => t.id === state.activeTripId) ?? null;
