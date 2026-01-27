CREATE INDEX `corrections_message_id_idx` ON `corrections` (`message_id`);--> statement-breakpoint
CREATE INDEX `messages_conversation_id_idx` ON `messages` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `vocabulary_message_id_idx` ON `vocabulary` (`message_id`);--> statement-breakpoint
CREATE INDEX `vocabulary_term_idx` ON `vocabulary` (`term`);