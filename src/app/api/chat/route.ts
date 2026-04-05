import { eq, inArray } from "drizzle-orm";
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
import { createProvider } from "@/lib/ai/provider";
import type { ChatMessage, Correction, Vocabulary } from "@/lib/ai/types";

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

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Input validation
  const lastMessage = (body.messages ?? []).at(-1);
  if (lastMessage) {
    if (typeof lastMessage.content !== "string" || !lastMessage.content.trim()) {
      return NextResponse.json(
        { error: "Message must be a non-empty string." },
        { status: 400 },
      );
    }
    if (lastMessage.content.length > 2000) {
      return NextResponse.json(
        { error: "Message must not exceed 2000 characters." },
        { status: 400 },
      );
    }
  }
  if (body.scenarioId !== undefined && body.scenarioId !== null && typeof body.scenarioId !== "string") {
    return NextResponse.json(
      { error: "scenarioId must be a string." },
      { status: 400 },
    );
  }
  if (body.conversationId !== undefined && body.conversationId !== null && typeof body.conversationId !== "string") {
    return NextResponse.json(
      { error: "conversationId must be a string." },
      { status: 400 },
    );
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
    const provider = createProvider();
    const response = await provider.generate({ instructions, messages: chatMessages });

    // Persist to database within a transaction
    const now = Date.now();
    let conversationId = body.conversationId;
    const userMessageId = crypto.randomUUID();

    const persistData = (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => {
      // Create new conversation if none provided
      if (!conversationId) {
        conversationId = crypto.randomUUID();
        const scenario = scenarios.find((s) => s.id === body.scenarioId);
        tx.insert(conversations).values({
          id: conversationId,
          title: scenario?.name ?? "Conversation",
          scenarioId: body.scenarioId ?? null,
          createdAt: now,
          updatedAt: now,
        }).run();
      } else {
        // Update conversation timestamp
        tx.update(conversations)
          .set({ updatedAt: now })
          .where(eq(conversations.id, conversationId))
          .run();
      }

      // Save user message (the last one in the array)
      const lastUserMessage = chatMessages[chatMessages.length - 1];
      tx.insert(messages).values({
        id: userMessageId,
        conversationId,
        role: lastUserMessage.role,
        content: lastUserMessage.content,
        correctedContent: response.correctedContent ?? null,
        createdAt: now,
      }).run();

      // Save assistant response
      tx.insert(messages).values({
        id: crypto.randomUUID(),
        conversationId,
        role: "assistant",
        content: response.reply,
        createdAt: now + 1, // Ensure ordering
      }).run();

      // Save corrections (linked to the user message they correct)
      const responseCorrections = (response.corrections ?? []) as Correction[];
      for (const correction of responseCorrections) {
        tx.insert(corrections).values({
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
      const responseVocabulary = (response.vocabulary ?? []) as Vocabulary[];
      const vocabTerms = responseVocabulary
        .filter((v) => v.term?.trim())
        .map((v) => ({ ...v, termLower: v.term.toLowerCase().trim() }));

      if (vocabTerms.length > 0) {
        const existingVocab = tx
          .select()
          .from(vocabulary)
          .where(inArray(vocabulary.term, vocabTerms.map((v) => v.termLower)))
          .all();
        const existingByTerm = new Map(existingVocab.map((v) => [v.term, v]));

        for (const vocab of vocabTerms) {
          const existing = existingByTerm.get(vocab.termLower);
          if (existing) {
            // Only update count and lastSeenAt, preserve original messageId
            tx.update(vocabulary)
              .set({
                count: existing.count + 1,
                lastSeenAt: now,
              })
              .where(eq(vocabulary.id, existing.id))
              .run();
          } else {
            tx.insert(vocabulary).values({
              id: crypto.randomUUID(),
              messageId: userMessageId,
              term: vocab.termLower,
              translation: vocab.translation ?? null,
              partOfSpeech: vocab.partOfSpeech ?? null,
              category: vocab.category ?? "general",
              count: 1,
              firstSeenAt: now,
              lastSeenAt: now,
            }).run();
          }
        }
      }

      // Save tenses (link message to tenses used) — batch validate
      const responseTenses = (response.tenses ?? []) as string[];
      if (responseTenses.length > 0) {
        const existingTenses = tx.select().from(tenses).where(inArray(tenses.id, responseTenses)).all();
        const validTenseIds = new Set(existingTenses.map((t) => t.id));
        for (const tenseId of responseTenses.filter((id) => validTenseIds.has(id))) {
          tx.insert(messageTenses).values({
            messageId: userMessageId,
            tenseId,
          }).run();
        }
      }

      // Save topics (link message to topics discussed) — batch validate
      const responseTopics = (response.topics ?? []) as string[];
      if (responseTopics.length > 0) {
        const existingTopics = tx.select().from(topics).where(inArray(topics.id, responseTopics)).all();
        const validTopicIds = new Set(existingTopics.map((t) => t.id));
        for (const topicId of responseTopics.filter((id) => validTopicIds.has(id))) {
          tx.insert(messageTopics).values({
            messageId: userMessageId,
            topicId,
          }).run();
        }
      }

      // Update conversation summary
      if (response.conversationSummary) {
        tx.update(conversations)
          .set({ summary: response.conversationSummary, updatedAt: now })
          .where(eq(conversations.id, conversationId!))
          .run();
      }
    };

    // Execute all DB operations in a transaction
    await db.transaction(persistData);

    return NextResponse.json({
      ...response,
      conversationId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("[gemini] Error:", error);

    // Check if it's a missing API key error
    if (message.includes("not configured")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Gemini request failed." },
      { status: 500 },
    );
  }
}
