import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { conversations, corrections, messages } from "@/db/schema";

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

    // Get corrections for each message
    const messagesWithCorrections = await Promise.all(
      messageRows.map(async (msg) => {
        const correctionRows = await db
          .select()
          .from(corrections)
          .where(eq(corrections.messageId, msg.id));

        return {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          correctedContent: msg.correctedContent,
          createdAt: msg.createdAt,
          corrections: correctionRows.map((c) => ({
            id: c.id,
            type: c.errorType,
            original: c.originalText,
            corrected: c.correctedText,
            explanation: c.explanation,
          })),
        };
      })
    );

    return NextResponse.json({
      ...conversation,
      messages: messagesWithCorrections,
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

    // Get all message IDs for this conversation
    const messageIds = await db
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.conversationId, id));

    // Delete corrections for all messages
    for (const msg of messageIds) {
      await db.delete(corrections).where(eq(corrections.messageId, msg.id));
    }

    // Delete messages
    await db.delete(messages).where(eq(messages.conversationId, id));

    // Delete conversation
    await db.delete(conversations).where(eq(conversations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation." },
      { status: 500 }
    );
  }
}
