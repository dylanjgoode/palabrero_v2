import { eq } from "drizzle-orm";

import { db } from "@/db";
import { settings } from "@/db/schema";

export async function getSetting(key: string): Promise<string | null> {
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

export async function getApiKeys() {
  const googleKey = await getSetting("google_api_key");

  return {
    googleApiKey: googleKey || process.env.GOOGLE_API_KEY || null,
  };
}
