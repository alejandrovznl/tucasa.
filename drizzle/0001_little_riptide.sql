CREATE INDEX `idx_favorites_user_created` ON `favorites` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_searches_user_created` ON `searches` (`user_id`,`created_at`);