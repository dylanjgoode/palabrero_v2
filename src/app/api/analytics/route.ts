import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import {
  corrections,
  conversations,
  messages,
  messageTenses,
  messageTopics,
  tenses,
  topics,
  vocabulary,
} from "@/db/schema";

export const runtime = "nodejs";

type WeeklyProgress = {
  week: string;
  weekStart: number;
  userMessages: number;
  corrections: number;
  newVocabulary: number;
};

// GET /api/analytics - Aggregated analytics for the dashboard
export async function GET() {
  try {
    const [
      tenseCounts,
      topicCounts,
      correctionTypes,
      weeklyProgress,
      totals,
    ] = await Promise.all([
      // Tense usage distribution: count how many messages used each tense
      db
        .select({
          id: tenses.id,
          label: tenses.label,
          count: sql<number>`count(${messageTenses.messageId})`,
        })
        .from(tenses)
        .leftJoin(messageTenses, sql`${messageTenses.tenseId} = ${tenses.id}`)
        .groupBy(tenses.id)
        .orderBy(sql`count(${messageTenses.messageId}) desc`),

      // Topic coverage distribution: count how many messages covered each topic
      db
        .select({
          id: topics.id,
          label: topics.label,
          count: sql<number>`count(${messageTopics.messageId})`,
        })
        .from(topics)
        .leftJoin(messageTopics, sql`${messageTopics.topicId} = ${topics.id}`)
        .groupBy(topics.id)
        .orderBy(sql`count(${messageTopics.messageId}) desc`),

      // Correction types breakdown: count by error type
      db
        .select({
          type: corrections.errorType,
          count: sql<number>`count(*)`,
        })
        .from(corrections)
        .groupBy(corrections.errorType)
        .orderBy(sql`count(*) desc`),

      // Weekly progress: messages, corrections, and vocab per week
      // Uses raw column names in subqueries (aliases prevent Drizzle refs)
      db.all<WeeklyProgress>(sql`
        WITH weeks AS (
          SELECT DISTINCT
            strftime('%Y-%W', created_at / 1000, 'unixepoch') as week,
            min(created_at) as week_start
          FROM ${messages}
          GROUP BY strftime('%Y-%W', created_at / 1000, 'unixepoch')
          ORDER BY week DESC
          LIMIT 12
        )
        SELECT
          w.week,
          w.week_start as "weekStart",
          (SELECT count(*) FROM ${messages} m
           WHERE strftime('%Y-%W', m.created_at / 1000, 'unixepoch') = w.week
             AND m.role = 'user') as "userMessages",
          (SELECT count(*) FROM ${corrections} c
           JOIN ${messages} m ON c.message_id = m.id
           WHERE strftime('%Y-%W', m.created_at / 1000, 'unixepoch') = w.week) as "corrections",
          (SELECT count(DISTINCT v.id) FROM ${vocabulary} v
           WHERE strftime('%Y-%W', v.first_seen_at / 1000, 'unixepoch') = w.week) as "newVocabulary"
        FROM weeks w
        ORDER BY w.week ASC
      `),

      // Summary totals
      Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(conversations),
        db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(sql`${messages.role} = 'user'`),
        db.select({ count: sql<number>`count(*)` }).from(corrections),
        db.select({ count: sql<number>`count(*)` }).from(vocabulary),
      ]),
    ]);

    const [[convCount], [msgCount], [corrCount], [vocabCount]] = totals;

    return NextResponse.json({
      tenses: tenseCounts,
      topics: topicCounts,
      corrections: correctionTypes,
      progress: weeklyProgress,
      totals: {
        conversations: convCount.count,
        userMessages: msgCount.count,
        corrections: corrCount.count,
        vocabulary: vocabCount.count,
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics." },
      { status: 500 },
    );
  }
}
