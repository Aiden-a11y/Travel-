import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a travel itinerary parser. The user will provide a free-form trip description in any language (Korean, English, etc.).
Extract and structure it into a JSON object matching this exact schema:

{
  "title": string,           // Trip title. Infer from destinations/context if not given.
  "description": string,     // Brief summary (1-2 sentences)
  "startDate": string,       // ISO date "YYYY-MM-DD". If only month/day given, use current year. If unknown, use "".
  "endDate": string,         // ISO date "YYYY-MM-DD". If unknown, use "".
  "currency": string,        // ISO 4217 currency code. Infer from destinations (KRW for Korea, JPY for Japan, USD for US, etc.). Default "KRW".
  "days": [
    {
      "dayNumber": number,     // 1-indexed
      "date": string,          // ISO date "YYYY-MM-DD" or "" if unknown
      "destination": string,   // City or region for this day
      "theme": string,         // Short theme/label for the day (e.g. "시내 관광", "Beach Day")
      "activities": [
        {
          "name": string,              // Activity name
          "category": string,          // One of: food, sightseeing, transport, accommodation, adventure, culture, shopping, rest
          "startTime": string,         // "HH:MM" 24-hour or ""
          "endTime": string,           // "HH:MM" 24-hour or ""
          "location": string,          // Specific place name or ""
          "notes": string,             // Any extra detail or ""
          "estimatedCost": number | null  // Numeric cost or null
        }
      ]
    }
  ]
}

Rules:
- Extract EVERY activity, meal, transport, and accommodation mentioned.
- Infer category from context: restaurants/cafes = food, museums/landmarks = sightseeing, trains/flights = transport, hotels = accommodation, etc.
- If a day has no explicit date but has a day number (Day 1, 첫째 날, etc.), derive the date from startDate if available.
- If costs are mentioned (e.g. "3만원", "$50"), extract the numeric value.
- Keep activity names concise but descriptive.
- Return ONLY valid JSON — no markdown, no explanation outside the JSON.`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text?.trim()) {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.APP_ANTHROPIC_KEY });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    const raw = message.content[0]?.type === "text" ? message.content[0].text : null;

    if (!raw) {
      return Response.json({ error: "Empty response from Claude" }, { status: 500 });
    }

    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    return Response.json({ trip: parsed });
  } catch (error) {
    console.error("[/api/parse-trip]", error);
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Claude returned invalid JSON" }, { status: 500 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
