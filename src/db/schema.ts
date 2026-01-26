import { relations } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const scenarios = sqliteTable("scenarios", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  isDefault: integer("is_default").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  scenarioId: text("scenario_id").references(() => scenarios.id),
  summary: text("summary"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  correctedContent: text("corrected_content"),
  createdAt: integer("created_at").notNull(),
});

export const corrections = sqliteTable("corrections", {
  id: text("id").primaryKey(),
  messageId: text("message_id")
    .notNull()
    .references(() => messages.id),
  errorType: text("error_type").notNull(),
  originalText: text("original_text").notNull(),
  correctedText: text("corrected_text").notNull(),
  explanation: text("explanation"),
  createdAt: integer("created_at").notNull(),
});

export const vocabulary = sqliteTable("vocabulary", {
  id: text("id").primaryKey(),
  messageId: text("message_id").references(() => messages.id),
  term: text("term").notNull(),
  translation: text("translation"),
  partOfSpeech: text("part_of_speech"),
  category: text("category").notNull(),
  count: integer("count").notNull().default(1),
  firstSeenAt: integer("first_seen_at").notNull(),
  lastSeenAt: integer("last_seen_at"),
});

export const topics = sqliteTable("topics", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
});

export const messageTopics = sqliteTable(
  "message_topics",
  {
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.topicId] }),
  }),
);

export const tenses = sqliteTable("tenses", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
});

export const messageTenses = sqliteTable(
  "message_tenses",
  {
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id),
    tenseId: text("tense_id")
      .notNull()
      .references(() => tenses.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.tenseId] }),
  }),
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const scenariosRelations = relations(scenarios, ({ many }) => ({
  conversations: many(conversations),
}));

export const conversationsRelations = relations(
  conversations,
  ({ many, one }) => ({
    messages: many(messages),
    scenario: one(scenarios, {
      fields: [conversations.scenarioId],
      references: [scenarios.id],
    }),
  }),
);

export const messagesRelations = relations(messages, ({ many, one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  corrections: many(corrections),
  vocabulary: many(vocabulary),
  topicLinks: many(messageTopics),
  tenseLinks: many(messageTenses),
}));

export const correctionsRelations = relations(corrections, ({ one }) => ({
  message: one(messages, {
    fields: [corrections.messageId],
    references: [messages.id],
  }),
}));

export const vocabularyRelations = relations(vocabulary, ({ one }) => ({
  message: one(messages, {
    fields: [vocabulary.messageId],
    references: [messages.id],
  }),
}));

export const messageTopicsRelations = relations(messageTopics, ({ one }) => ({
  message: one(messages, {
    fields: [messageTopics.messageId],
    references: [messages.id],
  }),
  topic: one(topics, {
    fields: [messageTopics.topicId],
    references: [topics.id],
  }),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  messageLinks: many(messageTopics),
}));

export const messageTensesRelations = relations(messageTenses, ({ one }) => ({
  message: one(messages, {
    fields: [messageTenses.messageId],
    references: [messages.id],
  }),
  tense: one(tenses, {
    fields: [messageTenses.tenseId],
    references: [tenses.id],
  }),
}));

export const tensesRelations = relations(tenses, ({ many }) => ({
  messageLinks: many(messageTenses),
}));

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Correction = typeof corrections.$inferSelect;
export type NewCorrection = typeof corrections.$inferInsert;
export type Scenario = typeof scenarios.$inferSelect;
export type NewScenario = typeof scenarios.$inferInsert;
