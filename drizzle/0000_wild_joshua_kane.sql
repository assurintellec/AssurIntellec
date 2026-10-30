CREATE TABLE `visit_sessions` (
	`identity` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	`receipt` text NOT NULL,
	PRIMARY KEY(`identity`, `token`)
);
--> statement-breakpoint
CREATE INDEX `visit_sessions_expiry` ON `visit_sessions` (`expires`);--> statement-breakpoint
CREATE TABLE `visit_totals` (
	`identity` text PRIMARY KEY NOT NULL,
	`visits` integer DEFAULT 0 NOT NULL
);
