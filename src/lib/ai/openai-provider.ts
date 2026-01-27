import OpenAI from "openai";
import type { AIProvider, ChatResponse, GenerateOptions, ProviderConfig } from "./types";

const defaultConfig: ProviderConfig = {
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  temperature: 0.4,
  maxOutputTokens: 2048,
};

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

export function createOpenAIProvider(apiKey?: string | null): AIProvider {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OpenAI API key is not configured. Add it in Settings.");
  }

  const client = new OpenAI({ apiKey: key });

  return {
    name: "openai",

    async generate(options: GenerateOptions): Promise<ChatResponse> {
      const response = await client.responses.create({
        model: defaultConfig.model,
        instructions: options.instructions,
        input: options.messages,
        temperature: defaultConfig.temperature,
        max_output_tokens: defaultConfig.maxOutputTokens,
        text: {
          format: {
            type: "json_object",
          },
        },
      });

      const outputText = response.output_text?.trim() ?? "";
      return parseJsonResponse(outputText);
    },
  };
}
