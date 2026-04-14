import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { TripPlan } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `당신은 여행 동선 최적화 전문가입니다. 주어진 여행 일정을 분석하고 다음 형식으로 한국어로 답변해주세요:

🗺️ 동선 효율성
현재 동선이 얼마나 효율적인지 1-2문장으로 평가해주세요.

💡 개선 제안
• 구체적인 개선점을 2-3개 bullet로 제안해주세요.

⚠️ 주의 사항
시간 충돌이나 이동 거리 관련 주의사항을 알려주세요.

✨ 최적화 팁
가장 중요한 최적화 팁 하나를 제시해주세요.

마크다운 헤더나 볼드 없이 이모지와 줄바꿈만 사용하세요. 총 250단어 이내로 간결하게 작성해주세요.`;

export async function POST(req: NextRequest) {
  try {
    const { trip }: { trip: TripPlan } = await req.json();

    const itinerary = trip.days
      .map((day) => {
        const acts = day.activities
          .map((a) => `  - ${a.name}${a.startTime ? ` (${a.startTime})` : ""}${a.location ? ` @ ${a.location}` : ""}`)
          .join("\n");
        return `Day ${day.dayNumber} — ${day.destination}:\n${acts}`;
      })
      .join("\n\n");

    const client = new Anthropic({ apiKey: process.env.APP_ANTHROPIC_KEY });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const claudeStream = client.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: `다음 여행 일정의 동선을 분석해주세요:\n\n${itinerary}`,
              },
            ],
          });

          for await (const event of claudeStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          console.error("[/api/route-analysis]", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "분석 실패" })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[/api/route-analysis]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
