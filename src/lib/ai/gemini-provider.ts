import { GoogleGenAI } from "@google/genai";
import type { AIProvider, ChatMessage, ChatResponse, GenerateOptions, ProviderConfig } from "./types";

const defaultConfig: ProviderConfig = {
  model: process.env.GEMINI_MODEL ?? "gemini-3-flash-preview",
  temperature: 0.4,
  maxOutputTokens: 2048,
};

type GeminiRole = "user" | "model";

type GeminiContent = {
  role: GeminiRole;
  parts: { text: string }[];
};

function mapRoleToGemini(role: ChatMessage["role"]): GeminiRole {
  return role === "assistant" ? "model" : "user";
}

function convertToGeminiContents(
  instructions: string,
  messages: ChatMessage[]
): GeminiContent[] {
  const contents: GeminiContent[] = [];

  // Add system instructions as initial user message + model acknowledgment
  contents.push({
    role: "user",
    parts: [{ text: `System instructions:\n${instructions}` }],
  });
  contents.push({
    role: "model",
    parts: [{ text: "Understood. I will follow these instructions." }],
  });

  // Add conversation messages
  for (const message of messages) {
    contents.push({
      role: mapRoleToGemini(message.role),
      parts: [{ text: message.content }],
    });
  }

  return contents;
}

function parseJsonResponse(outputText: string): ChatResponse {
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

export function createGeminiProvider(apiKey?: string | null): AIProvider {
  const key = apiKey || process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error("Google API key is not configured. Add it in Settings.");
  }

  const client = new GoogleGenAI({ apiKey: key });

  return {
    name: "gemini",

    async generate(options: GenerateOptions): Promise<ChatResponse> {
      const contents = convertToGeminiContents(options.instructions, options.messages);

      const response = await client.models.generateContent({
        model: defaultConfig.model,
        contents,
        config: {
          temperature: defaultConfig.temperature,
          maxOutputTokens: defaultConfig.maxOutputTokens,
          responseMimeType: "application/json",
        },
      });

      const outputText = response.text?.trim() ?? "";
      return parseJsonResponse(outputText);
    },
  };
}
