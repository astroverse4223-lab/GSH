-- CreateIndex
CREATE INDEX "platform_settings_id_idx" ON "platform_settings"("id");

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "maintenanceMessage" TEXT,
ADD COLUMN "maxUploadSizeMB" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "maxPostLength" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN "maxImagesPerPost" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN "userLimits" JSONB NOT NULL DEFAULT '{"maxFriends":1000,"maxGroups":50,"maxPosts":5000}',
ADD COLUMN "proFeatures" JSONB NOT NULL DEFAULT '{"streaming":true,"customization":true,"marketplace":true,"analytics":true}',
ADD COLUMN "monetization" JSONB NOT NULL DEFAULT '{"proSubscriptionPrice":9.99,"marketplaceFeePercent":5}',
ADD COLUMN "moderation" JSONB NOT NULL DEFAULT '{"autoModerationEnabled":true,"requirePostApproval":false,"requireListingApproval":true}',
ADD COLUMN "security" JSONB NOT NULL DEFAULT '{"requireEmailVerification":true,"maxLoginAttempts":5,"passwordMinLength":8}';
