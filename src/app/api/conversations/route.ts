import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { conversations, messages } from "@/db/schema";

export const runtime = "nodejs";

// GET /api/conversations - List all conversations
export async function GET() {
  try {
    const rows = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        scenarioId: conversations.scenarioId,
        summary: conversations.summary,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));

    // Get message counts for each conversation
    const conversationsWithCounts = await Promise.all(
      rows.map(async (conv) => {
        const messageCount = await db
          .select({ id: messages.id })
          .from(messages)
          .where(eq(messages.conversationId, conv.id));

        return {
          ...conv,
          messageCount: messageCount.length,
        };
      })
    );

    return NextResponse.json(conversationsWithCounts);
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations." },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, scenarioId } = body as {
      title?: string;
      scenarioId?: string;
    };

    const now = Date.now();
    const id = crypto.randomUUID();

    await db.insert(conversations).values({
      id,
      title: title ?? "New Conversation",
      scenarioId: scenarioId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      id,
      title: title ?? "New Conversation",
      scenarioId: scenarioId ?? null,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    });
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation." },
      { status: 500 }
    );
  }
}
