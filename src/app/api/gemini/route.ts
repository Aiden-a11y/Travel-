import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AIRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body: AIRequest = await req.json();
    const { messages, model, systemInstruction } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const claudeMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const client = new Anthropic({ apiKey: process.env.APP_ANTHROPIC_KEY });
          const claudeStream = client.messages.stream({
            model: model ?? "claude-haiku-4-5-20251001",
            max_tokens: 8096,
            ...(systemInstruction ? { system: systemInstruction } : {}),
            messages: claudeMessages,
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
          console.error("[/api/gemini] Claude stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`)
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
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[/api/gemini]", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
