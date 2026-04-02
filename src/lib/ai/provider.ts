import { createGeminiProvider } from "./gemini-provider";

export type ProviderOptions = {
  googleApiKey?: string | null;
};

export function createProvider(options?: ProviderOptions) {
  return createGeminiProvider(options?.googleApiKey);
}
