import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { vocabulary } from "@/db/schema";

export const runtime = "nodejs";

// GET /api/vocabulary - List all vocabulary with stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const orderBy = searchParams.get("orderBy") ?? "lastSeenAt"; // lastSeenAt, count, term, firstSeenAt

    // Base query with optional category filter
    const baseCondition = category ? eq(vocabulary.category, category) : undefined;

    // Get total count (respects category filter)
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(vocabulary)
      .where(baseCondition);

    // Build main query
    let query = db
      .select({
        id: vocabulary.id,
        term: vocabulary.term,
        translation: vocabulary.translation,
        partOfSpeech: vocabulary.partOfSpeech,
        category: vocabulary.category,
        count: vocabulary.count,
        firstSeenAt: vocabulary.firstSeenAt,
        lastSeenAt: vocabulary.lastSeenAt,
      })
      .from(vocabulary)
      .where(baseCondition);

    // Order by specified field
    let orderedQuery;
    switch (orderBy) {
      case "count":
        orderedQuery = query.orderBy(desc(vocabulary.count));
        break;
      case "term":
        orderedQuery = query.orderBy(vocabulary.term);
        break;
      case "firstSeenAt":
        orderedQuery = query.orderBy(desc(vocabulary.firstSeenAt));
        break;
      default:
        orderedQuery = query.orderBy(desc(vocabulary.lastSeenAt));
    }

    const rows = await orderedQuery.limit(limit);

    // Get category summary (always returns all categories for overview)
    const categorySummary = await db
      .select({
        category: vocabulary.category,
        termCount: sql<number>`count(*)`.as("termCount"),
        totalUses: sql<number>`sum(${vocabulary.count})`.as("totalUses"),
      })
      .from(vocabulary)
      .groupBy(vocabulary.category)
      .orderBy(desc(sql`count(*)`));

    return NextResponse.json({
      vocabulary: rows,
      summary: {
        totalTerms: total,
        returnedTerms: rows.length,
        categories: categorySummary,
      },
    });
  } catch (error) {
    console.error("Failed to fetch vocabulary:", error);
    return NextResponse.json(
      { error: "Failed to fetch vocabulary." },
      { status: 500 }
    );
  }
}
