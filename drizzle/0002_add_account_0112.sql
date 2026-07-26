-- Custom SQL migration file, put your code below! --
INSERT OR IGNORE INTO `users` (
	`username`,
	`password_hash`,
	`password_salt`,
	`password_iterations`
) VALUES (
	'0112',
	'e93d61bfa3646a37447ce3a85335c21e26d8ea96d533bb3518c253fa9244df60',
	'8fcd784e5ae5c891477a626181aa4504',
	100000
);
--> statement-breakpoint
INSERT OR IGNORE INTO `account_data` (
	`user_id`,
	`data_json`
)
SELECT
	`id`,
	'{"records":[],"shellBalance":0,"shellsEarned":0,"rewardClaims":[],"areaSchemaVersion":3,"seedSampleHistory":false,"profile":{"nickname":""},"preferences":{"language":"zh","theme":"light"}}'
FROM `users`
WHERE `username` = '0112';
