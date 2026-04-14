"use client";

import { useState, useCallback } from "react";
import type { AIMessage } from "@/lib/types";

export function useGeminiStream() {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const stream = useCallback(
    async (messages: AIMessage[], systemInstruction?: string) => {
      setContent("");
      setIsStreaming(true);

      try {
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, systemInstruction }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          for (const line of decoder.decode(value, { stream: true }).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;
            try {
              const { delta } = JSON.parse(payload);
              if (delta) setContent((prev) => prev + delta);
            } catch {
              // skip malformed chunk
            }
          }
        }
      } catch (err) {
        console.error("[useGeminiStream]", err);
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const reset = useCallback(() => setContent(""), []);

  return { content, isStreaming, stream, reset };
}
