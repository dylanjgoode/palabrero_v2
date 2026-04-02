PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`scenario_id` text,
	`summary` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_conversations`("id", "title", "scenario_id", "summary", "created_at", "updated_at") SELECT "id", "title", "scenario_id", "summary", "created_at", "updated_at" FROM `conversations`;--> statement-breakpoint
DROP TABLE `conversations`;--> statement-breakpoint
ALTER TABLE `__new_conversations` RENAME TO `conversations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX `vocabulary_term_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `vocabulary_term_idx` ON `vocabulary` (`term`);