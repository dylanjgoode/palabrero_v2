import { asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

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

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/conversations/:id - Get conversation with messages and corrections
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    // Get messages ordered by creation time
    const messageRows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    // Get all corrections for all messages in one query
    const messageIds = messageRows.map((m) => m.id);
    const allCorrections = messageIds.length
      ? await db
          .select()
          .from(corrections)
          .where(inArray(corrections.messageId, messageIds))
      : [];

    // Group corrections by messageId
    const correctionsByMessage = new Map<string, typeof allCorrections>();
    for (const correction of allCorrections) {
      const existing = correctionsByMessage.get(correction.messageId) ?? [];
      existing.push(correction);
      correctionsByMessage.set(correction.messageId, existing);
    }

    // Get all topics and tenses for the conversation's messages
    const allTopics = messageIds.length
      ? await db
          .select({
            id: topics.id,
            label: topics.label,
          })
          .from(messageTopics)
          .innerJoin(topics, eq(messageTopics.topicId, topics.id))
          .where(inArray(messageTopics.messageId, messageIds))
      : [];

    const allTenses = messageIds.length
      ? await db
          .select({
            id: tenses.id,
            label: tenses.label,
          })
          .from(messageTenses)
          .innerJoin(tenses, eq(messageTenses.tenseId, tenses.id))
          .where(inArray(messageTenses.messageId, messageIds))
      : [];

    // Deduplicate topics and tenses
    const uniqueTopics = [...new Map(allTopics.map((t) => [t.id, t])).values()];
    const uniqueTenses = [...new Map(allTenses.map((t) => [t.id, t])).values()];

    // Build response with corrections mapped to messages
    const messagesWithCorrections = messageRows.map((msg) => {
      const msgCorrections = correctionsByMessage.get(msg.id) ?? [];
      return {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        correctedContent: msg.correctedContent,
        createdAt: msg.createdAt,
        corrections: msgCorrections.map((c) => ({
          id: c.id,
          type: c.errorType,
          original: c.originalText,
          corrected: c.correctedText,
          explanation: c.explanation,
        })),
      };
    });

    return NextResponse.json({
      ...conversation,
      messages: messagesWithCorrections,
      topics: uniqueTopics,
      tenses: uniqueTenses,
    });
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation." },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/:id - Delete a conversation
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if conversation exists
    const [conversation] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.id, id));

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    await db.transaction(async (tx) => {
      // Get all message IDs for this conversation
      const messageIdRows = await tx
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.conversationId, id));

      const messageIds = messageIdRows.map((m) => m.id);

      if (messageIds.length > 0) {
        // Delete corrections for all messages (single query)
        await tx.delete(corrections).where(inArray(corrections.messageId, messageIds));

        // Delete junction table entries for topics and tenses
        await tx.delete(messageTopics).where(inArray(messageTopics.messageId, messageIds));
        await tx.delete(messageTenses).where(inArray(messageTenses.messageId, messageIds));

        // Nullify vocabulary messageId references (preserve vocabulary but unlink)
        await tx
          .update(vocabulary)
          .set({ messageId: null })
          .where(inArray(vocabulary.messageId, messageIds));

        // Delete messages
        await tx.delete(messages).where(eq(messages.conversationId, id));
      }

      // Delete conversation
      await tx.delete(conversations).where(eq(conversations.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation." },
      { status: 500 }
    );
  }
}
