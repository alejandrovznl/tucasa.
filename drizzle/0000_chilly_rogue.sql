CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`property_id` text NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `searches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`data` text NOT NULL,
	`count` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `support` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
