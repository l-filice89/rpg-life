CREATE TABLE `skills` (
	`code` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`sort_order` integer NOT NULL,
	`icon_key` text
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_date` text,
	`difficulty` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`completed_at` text,
	`xp_awarded` integer,
	`freshness_multiplier` real,
	`created_at` text NOT NULL,
	`modified_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_owner_status` ON `tasks` (`owner_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tasks_owner_due` ON `tasks` (`owner_id`,`due_date`);--> statement-breakpoint
CREATE TABLE `task_skills` (
	`task_id` text NOT NULL,
	`skill_code` text NOT NULL,
	PRIMARY KEY(`task_id`, `skill_code`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_code`) REFERENCES `skills`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_task_skills_skill` ON `task_skills` (`skill_code`);--> statement-breakpoint
CREATE TABLE `user_skills` (
	`user_id` text NOT NULL,
	`skill_code` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `skill_code`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_code`) REFERENCES `skills`(`code`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT `user_skills_xp_non_negative` CHECK(`xp` >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_user_skills_user` ON `user_skills` (`user_id`);
