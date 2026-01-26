import type { AIProvider } from "./types";
import { createOpenAIProvider } from "./openai-provider";
import { createGeminiProvider } from "./gemini-provider";

export type ProviderName = "openai" | "gemini";

export type ProviderOptions = {
  openaiApiKey?: string | null;
  googleApiKey?: string | null;
};

export function getActiveProviderName(): ProviderName {
  const envValue = process.env.AI_PROVIDER?.toLowerCase();
  if (envValue === "gemini") {
    return "gemini";
  }
  return "openai";
}

export function createProvider(name: ProviderName, options?: ProviderOptions): AIProvider {
  if (name === "gemini") {
    return createGeminiProvider(options?.googleApiKey);
  }
  return createOpenAIProvider(options?.openaiApiKey);
}
