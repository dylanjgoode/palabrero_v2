import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const dbFile = process.env.DATABASE_URL ?? "palabrero.db";

const sqlite = new Database(dbFile);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle({ client: sqlite, schema });
