import fs from "node:fs/promises";
import Database from "better-sqlite3";

const dbFile = process.env.DATABASE_URL ?? "palabrero.db";
const sqlite = new Database(dbFile);

const scenariosPath = new URL("../src/data/scenarios.json", import.meta.url);
const scenarios = JSON.parse(await fs.readFile(scenariosPath, "utf8"));
const now = Date.now();

const insertScenario = sqlite.prepare(
  `INSERT INTO scenarios (id, name, description, system_prompt, is_default, created_at, updated_at)
   VALUES (@id, @name, @description, @systemPrompt, @isDefault, @createdAt, @updatedAt)
   ON CONFLICT(id) DO UPDATE SET
     name=excluded.name,
     description=excluded.description,
     system_prompt=excluded.system_prompt,
     is_default=excluded.is_default,
     updated_at=excluded.updated_at`,
);

const insertSetting = sqlite.prepare(
  `INSERT INTO settings (key, value, updated_at)
   VALUES (@key, @value, @updatedAt)
   ON CONFLICT(key) DO UPDATE SET
     value=excluded.value,
     updated_at=excluded.updated_at`,
);

const transaction = sqlite.transaction(() => {
  for (const scenario of scenarios) {
    insertScenario.run({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description ?? null,
      systemPrompt: scenario.systemPrompt,
      isDefault: scenario.isDefault ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  const defaults = [
    { key: "tts_autoplay", value: "false" },
    { key: "show_inline_corrections", value: "true" },
    { key: "save_transcripts", value: "true" },
  ];

  for (const setting of defaults) {
    insertSetting.run({ ...setting, updatedAt: now });
  }
});

transaction();

console.log(`Seeded ${scenarios.length} scenarios and ${3} settings.`);
