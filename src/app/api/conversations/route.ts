import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { conversations, messages } from "@/db/schema";

export const runtime = "nodejs";

// GET /api/conversations - List all conversations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitStr = searchParams.get("limit");
    const limit = Math.max(1, Math.min(500, parseInt(limitStr ?? "100", 10) || 100));

    // Single query with message count using LEFT JOIN and GROUP BY
    const rows = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        scenarioId: conversations.scenarioId,
        summary: conversations.summary,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        messageCount: sql<number>`count(${messages.id})`.as("messageCount"),
      })
      .from(conversations)
      .leftJoin(messages, eq(conversations.id, messages.conversationId))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.updatedAt))
      .limit(limit);

    return NextResponse.json(rows);
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

    if (title !== undefined) {
      if (typeof title !== "string" || title.length > 200) {
        return NextResponse.json(
          { error: "title must be a string of at most 200 characters." },
          { status: 400 }
        );
      }
    }

    if (scenarioId !== undefined) {
      if (typeof scenarioId !== "string" || scenarioId.trim() === "") {
        return NextResponse.json(
          { error: "scenarioId must be a non-empty string." },
          { status: 400 }
        );
      }
    }

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
