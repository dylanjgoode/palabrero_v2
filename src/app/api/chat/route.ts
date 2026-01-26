import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import scenarios from "@/data/scenarios.json";
import { db } from "@/db";
import { conversations, corrections, messages } from "@/db/schema";
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
If there are no corrections, return an empty corrections array.
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

    // Persist to database
    const now = Date.now();
    let conversationId = body.conversationId;

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
    const userMessageId = crypto.randomUUID();
    db.insert(messages).values({
      id: userMessageId,
      conversationId,
      role: lastUserMessage.role,
      content: lastUserMessage.content,
      createdAt: now,
    }).run();

    // Save assistant response
    const assistantMessageId = crypto.randomUUID();
    db.insert(messages).values({
      id: assistantMessageId,
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
