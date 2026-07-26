PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`password_iterations` integer DEFAULT 100000 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "password_hash", "password_salt", "password_iterations", "created_at") SELECT "id", "username", "password_hash", "password_salt", "password_iterations", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
UPDATE `users`
SET
	`password_hash` = '13c937315e49e92732d35a2712d0102e57b41a396e38abda6febbf32f127a02b',
	`password_iterations` = 100000
WHERE
	`username` = '123456'
	AND `password_salt` = '615caa90ef5047edb0bd321e88489d1f'
	AND `password_iterations` > 100000;
