import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a world travel expert. When given travel preferences, return a JSON array of 6 destination recommendations.
Each object must have exactly these fields:
- id: string (generate a short unique slug like "kyoto-jp")
- destination: string (city/region name)
- country: string
- tagline: string (one punchy sentence, max 10 words)
- description: string (2-3 sentences)
- bestMonths: string[] (e.g. ["March", "April"])
- estimatedDays: number (recommended trip length)
- highlights: string[] (exactly 4 items)

Return ONLY valid JSON array — no markdown, no explanation, no extra text.`;

export async function POST(req: NextRequest) {
  try {
    const { preferences } = await req.json();

    if (!preferences) {
      return Response.json({ error: "preferences is required" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.APP_ANTHROPIC_KEY });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: preferences }],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : null;

    if (!text) {
      return Response.json({ error: "Empty response from Claude" }, { status: 500 });
    }

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const recommendations = JSON.parse(cleaned);
    return Response.json({ recommendations });
  } catch (error) {
    console.error("[/api/recommendations]", error);
    if (error instanceof Error && "status" in error && (error as any).status === 429) {
      return Response.json(
        { error: "API 요청 한도 초과입니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Claude returned invalid JSON" }, { status: 500 });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
