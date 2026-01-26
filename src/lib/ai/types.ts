export type Role = "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
};

export type Correction = {
  type: string;
  original: string;
  corrected: string;
  explanation?: string;
};

export type ChatResponse = {
  reply: string;
  corrections: Correction[];
};

export type ProviderConfig = {
  model: string;
  temperature: number;
  maxOutputTokens: number;
};

export type GenerateOptions = {
  instructions: string;
  messages: ChatMessage[];
};

export interface AIProvider {
  name: string;
  generate(options: GenerateOptions): Promise<ChatResponse>;
}
