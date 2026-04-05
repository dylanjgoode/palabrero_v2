export type Role = "user" | "assistant";

export type Correction = {
  type: string;
  original: string;
  corrected: string;
  explanation?: string;
};

export type ChatMessage = {
  id?: string;
  role: Role;
  content: string;
  corrections?: Correction[];
  correctedContent?: string | null;
};

export type Vocabulary = {
  term: string;
  translation: string;
  partOfSpeech?: string;
  category: string;
};

export type TopicItem = {
  id: string;
  label: string;
};

export type TenseItem = {
  id: string;
  label: string;
};

export type ChatResponse = {
  reply: string;
  corrections: Correction[];
  conversationId?: string;
  vocabulary?: Vocabulary[];
  correctedContent?: string | null;
  tenses?: string[];
  topics?: string[];
  conversationSummary?: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  scenarioId: string | null;
  messageCount: number;
  updatedAt: number;
  summary: string | null;
};

export type ConversationDetail = {
  id: string;
  title: string;
  scenarioId: string | null;
  messages: ChatMessage[];
  topics?: TopicItem[];
  tenses?: TenseItem[];
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
