// ─── Geo/time primitives ───────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

// ─── Activity ─────────────────────────────────────────────────────────────

export type ActivityCategory =
  | "food"
  | "sightseeing"
  | "transport"
  | "accommodation"
  | "adventure"
  | "culture"
  | "shopping"
  | "rest";

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  startTime?: string;
  endTime?: string;
  location?: string;
  coordinates?: Coordinates;
  notes?: string;
  imageUrl?: string;
  estimatedCost?: number;
  currency?: string;
}

// ─── Day ──────────────────────────────────────────────────────────────────

export interface TripDay {
  id: string;
  dayNumber: number;
  date: string;
  destination: string;
  coverImageUrl?: string;
  theme?: string;
  activities: Activity[];
}

// ─── Trip Plan ────────────────────────────────────────────────────────────

export type TripStatus = "draft" | "confirmed" | "completed";

export interface TripPlan {
  id: string;
  title: string;
  description?: string;
  status: TripStatus;
  coverImageUrl?: string;
  startDate: string;
  endDate: string;
  destinations: string[];
  days: TripDay[];
  totalBudget?: number;
  currency: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── AI Recommendation ────────────────────────────────────────────────────

export interface DestinationRecommendation {
  id: string;
  destination: string;
  country: string;
  tagline: string;
  description: string;
  bestMonths: string[];
  estimatedDays: number;
  highlights: string[];
}

// ─── AI API shapes ────────────────────────────────────────────────────────

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  systemInstruction?: string;
}

// ─── Store shapes ─────────────────────────────────────────────────────────

export interface TripStoreState {
  trips: TripPlan[];
  activeTripId: string | null;
  isLoading: boolean;
  error: string | null;
}
