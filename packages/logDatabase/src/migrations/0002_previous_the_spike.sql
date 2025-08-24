ALTER TABLE `log` ADD `request_id` text;--> statement-breakpoint
ALTER TABLE `log` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `log` ADD `route_id` text;--> statement-breakpoint
ALTER TABLE `log` ADD `url` text;--> statement-breakpoint
ALTER TABLE `log` ADD `method` text;--> statement-breakpoint
ALTER TABLE `log` ADD `user_agent` text;--> statement-breakpoint
ALTER TABLE `log` ADD `ip` text;--> statement-breakpoint
CREATE INDEX `log_request_idx` ON `log` (`request_id`);--> statement-breakpoint
CREATE INDEX `log_user_idx` ON `log` (`user_id`);--> statement-breakpoint
CREATE INDEX `log_route_idx` ON `log` (`route_id`);