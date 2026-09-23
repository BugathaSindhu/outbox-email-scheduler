-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `googleId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `slackAccessToken` VARCHAR(191) NULL,
    `slackChannelId` VARCHAR(191) NULL,
    `slackWebhookUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_googleId_key`(`googleId`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `senders` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `smtpHost` VARCHAR(191) NOT NULL,
    `smtpPort` INTEGER NOT NULL,
    `smtpUser` VARCHAR(191) NOT NULL,
    `smtpPassword` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `senders_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `delaySeconds` INTEGER NOT NULL DEFAULT 2,
    `hourlyLimit` INTEGER NOT NULL DEFAULT 100,
    `status` ENUM('SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `campaigns_userId_idx`(`userId`),
    INDEX `campaigns_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scheduled_emails` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `sentAt` DATETIME(3) NULL,
    `status` ENUM('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'RESCHEDULED') NOT NULL DEFAULT 'SCHEDULED',
    `errorMessage` TEXT NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `bullJobId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `scheduled_emails_idempotencyKey_key`(`idempotencyKey`),
    INDEX `scheduled_emails_campaignId_idx`(`campaignId`),
    INDEX `scheduled_emails_senderId_idx`(`senderId`),
    INDEX `scheduled_emails_status_idx`(`status`),
    INDEX `scheduled_emails_scheduledAt_idx`(`scheduledAt`),
    INDEX `scheduled_emails_idempotencyKey_idx`(`idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `senders` ADD CONSTRAINT `senders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scheduled_emails` ADD CONSTRAINT `scheduled_emails_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scheduled_emails` ADD CONSTRAINT `scheduled_emails_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `senders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
