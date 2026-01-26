import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { settings } from "@/db/schema";

export const runtime = "nodejs";

const ALLOWED_KEYS = ["openai_api_key", "google_api_key", "ai_provider"];

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.key, settings.key));

    const result: Record<string, string> = {};
    for (const row of rows) {
      if (ALLOWED_KEYS.includes(row.key)) {
        // Mask API keys for security
        if (row.key.endsWith("_api_key") && row.value) {
          result[row.key] = row.value.slice(0, 8) + "..." + row.value.slice(-4);
        } else {
          result[row.key] = row.value;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body as { key?: string; value?: string };

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing key." }, { status: 400 });
    }

    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: "Invalid key." }, { status: 400 });
    }

    const now = Date.now();

    await db
      .insert(settings)
      .values({ key, value: value ?? "", updatedAt: now })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: value ?? "", updatedAt: now },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save setting:", error);
    return NextResponse.json({ error: "Failed to save setting." }, { status: 500 });
  }
}
