CREATE TABLE `reels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`kind` enum('entertainment','study') NOT NULL,
	`storageKey` text NOT NULL,
	`mediaUrl` text NOT NULL,
	`contentType` varchar(120) NOT NULL,
	`caption` text,
	`fileSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reels` ADD CONSTRAINT `reels_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;