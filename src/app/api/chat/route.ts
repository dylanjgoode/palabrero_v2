import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import scenarios from "@/data/scenarios.json";
import { db } from "@/db";
import {
  conversations,
  corrections,
  messages,
  messageTenses,
  messageTopics,
  tenses,
  topics,
  vocabulary,
} from "@/db/schema";
import { createProvider, type ProviderName } from "@/lib/ai/provider";
import type { ChatMessage } from "@/lib/ai/types";
import { getApiKeys } from "@/lib/settings";

export const runtime = "nodejs";

const baseInstructions = `
You are a Spanish tutor for intermediate learners (A2-B1).
Reply in Spanish with a natural, short response and a follow-up question.
Return a JSON object with exactly:
- reply (string)
- corrections (array of objects with type, original, corrected, explanation)
- vocabulary (array of notable Spanish words/phrases the student used, each with: term, translation, partOfSpeech, category)
- correctedContent (the student's message rewritten with all corrections applied, or null if no corrections needed)
- tenses (array of tense IDs the student used: present, preterite, imperfect, future, conditional, present-subjunctive, imperfect-subjunctive, imperative, present-perfect, past-perfect)
- topics (array of topic IDs discussed: food, travel, work, family, health, shopping, weather, hobbies, education, technology, general)
- conversationSummary (a brief 1-sentence English summary of what the conversation is about so far, for display in conversation history)

For vocabulary, extract 1-3 interesting Spanish words the student used correctly. Include:
- term: the Spanish word/phrase
- translation: English translation
- partOfSpeech: noun, verb, adjective, adverb, phrase, etc.
- category: topic like food, travel, work, family, etc.

If there are no corrections or vocabulary, return empty arrays.
JSON only, no extra keys.
`.trim();

function resolveScenarioPrompt(scenarioId?: string) {
  const fallback = scenarios.find((scenario) => scenario.isDefault) ?? scenarios[0];
  const selected =
    scenarios.find((scenario) => scenario.id === scenarioId) ?? fallback;
  return selected?.systemPrompt ?? "";
}

function normalizeMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.content?.trim())
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .slice(-12);
}

type RequestBody = {
  messages?: ChatMessage[];
  scenarioId?: string;
  conversationId?: string;
};

type CorrectionResponse = {
  type: string;
  original: string;
  corrected: string;
  explanation?: string;
};

type VocabularyResponse = {
  term: string;
  translation: string;
  partOfSpeech: string;
  category: string;
};

export async function POST(request: Request) {
  const { openaiApiKey, googleApiKey, aiProvider } = await getApiKeys();
  const providerName: ProviderName = aiProvider;

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const chatMessages = normalizeMessages(body.messages ?? []);
  if (!chatMessages.length) {
    return NextResponse.json(
      { error: "No messages provided." },
      { status: 400 },
    );
  }

  const scenarioPrompt = resolveScenarioPrompt(body.scenarioId);
  const instructions = `${scenarioPrompt}\n\n${baseInstructions}`.trim();

  try {
    const provider = createProvider(providerName, { openaiApiKey, googleApiKey });
    const response = await provider.generate({ instructions, messages: chatMessages });

    // Persist to database within a transaction
    const now = Date.now();
    let conversationId = body.conversationId;
    const userMessageId = crypto.randomUUID();

    const persistData = () => {
      // Create new conversation if none provided
      if (!conversationId) {
        conversationId = crypto.randomUUID();
        const scenario = scenarios.find((s) => s.id === body.scenarioId);
        db.insert(conversations).values({
          id: conversationId,
          title: scenario?.name ?? "Conversation",
          scenarioId: body.scenarioId ?? null,
          createdAt: now,
          updatedAt: now,
        }).run();
      } else {
        // Update conversation timestamp
        db.update(conversations)
          .set({ updatedAt: now })
          .where(eq(conversations.id, conversationId))
          .run();
      }

      // Save user message (the last one in the array)
      const lastUserMessage = chatMessages[chatMessages.length - 1];
      db.insert(messages).values({
        id: userMessageId,
        conversationId,
        role: lastUserMessage.role,
        content: lastUserMessage.content,
        correctedContent: response.correctedContent ?? null,
        createdAt: now,
      }).run();

      // Save assistant response
      db.insert(messages).values({
        id: crypto.randomUUID(),
        conversationId,
        role: "assistant",
        content: response.reply,
        createdAt: now + 1, // Ensure ordering
      }).run();

      // Save corrections (linked to the user message they correct)
      const responseCorrections = (response.corrections ?? []) as CorrectionResponse[];
      for (const correction of responseCorrections) {
        db.insert(corrections).values({
          id: crypto.randomUUID(),
          messageId: userMessageId,
          errorType: correction.type,
          originalText: correction.original,
          correctedText: correction.corrected,
          explanation: correction.explanation ?? null,
          createdAt: now,
        }).run();
      }

      // Save vocabulary (upsert: increment count if term exists, preserve original messageId)
      const responseVocabulary = (response.vocabulary ?? []) as VocabularyResponse[];
      for (const vocab of responseVocabulary) {
        if (!vocab.term?.trim()) continue;

        const termLower = vocab.term.toLowerCase().trim();
        const existing = db
          .select()
          .from(vocabulary)
          .where(eq(vocabulary.term, termLower))
          .get();

        if (existing) {
          // Only update count and lastSeenAt, preserve original messageId
          db.update(vocabulary)
            .set({
              count: existing.count + 1,
              lastSeenAt: now,
            })
            .where(eq(vocabulary.id, existing.id))
            .run();
        } else {
          db.insert(vocabulary).values({
            id: crypto.randomUUID(),
            messageId: userMessageId,
            term: termLower,
            translation: vocab.translation ?? null,
            partOfSpeech: vocab.partOfSpeech ?? null,
            category: vocab.category ?? "general",
            count: 1,
            firstSeenAt: now,
            lastSeenAt: now,
          }).run();
        }
      }

      // Save tenses (link message to tenses used)
      const responseTenses = response.tenses ?? [];
      for (const tenseId of responseTenses) {
        // Verify tense exists before inserting
        const tenseExists = db.select().from(tenses).where(eq(tenses.id, tenseId)).get();
        if (tenseExists) {
          db.insert(messageTenses).values({
            messageId: userMessageId,
            tenseId,
          }).run();
        }
      }

      // Save topics (link message to topics discussed)
      const responseTopics = response.topics ?? [];
      for (const topicId of responseTopics) {
        // Verify topic exists before inserting
        const topicExists = db.select().from(topics).where(eq(topics.id, topicId)).get();
        if (topicExists) {
          db.insert(messageTopics).values({
            messageId: userMessageId,
            topicId,
          }).run();
        }
      }

      // Update conversation summary
      if (response.conversationSummary) {
        db.update(conversations)
          .set({ summary: response.conversationSummary, updatedAt: now })
          .where(eq(conversations.id, conversationId!))
          .run();
      }
    };

    // Execute all DB operations in a transaction
    db.transaction(persistData);

    return NextResponse.json({
      ...response,
      conversationId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error(`[${providerName}] Error:`, error);

    // Check if it's a missing API key error
    if (message.includes("not configured")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: `${providerName} request failed.` },
      { status: 500 },
    );
  }
}
