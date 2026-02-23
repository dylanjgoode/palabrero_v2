import type { ChatResponse } from "./types";

export function parseJsonResponse(outputText: string): ChatResponse {
  const fallback: ChatResponse = {
    reply: outputText,
    corrections: [],
  };

  if (!outputText) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(outputText) as Partial<ChatResponse>;
    return {
      reply: typeof parsed.reply === "string" ? parsed.reply : fallback.reply,
      corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
      vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
      correctedContent: typeof parsed.correctedContent === "string" ? parsed.correctedContent : undefined,
      tenses: Array.isArray(parsed.tenses) ? parsed.tenses : undefined,
      topics: Array.isArray(parsed.topics) ? parsed.topics : undefined,
      conversationSummary: typeof parsed.conversationSummary === "string" ? parsed.conversationSummary : undefined,
    };
  } catch {
    return fallback;
  }
}
