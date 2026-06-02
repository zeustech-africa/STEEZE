/*
  Warnings:

  - You are about to alter the column `price` on the `Post` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `facePhotoUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `selfieCapturedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedBy` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `VerificationMessage` table. All the data in the column will be lost.
  - You are about to drop the `InboxMessage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `creatorId` to the `VerificationMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('free', 'subscriber', 'direct_purchase', 'creator_page_only');

-- CreateEnum
CREATE TYPE "DistributionChannel" AS ENUM ('steeze', 'youtube', 'spotify', 'apple_music', 'tiktok', 'instagram', 'facebook', 'twitter');

-- DropForeignKey
ALTER TABLE "InboxMessage" DROP CONSTRAINT "InboxMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "VerificationMessage" DROP CONSTRAINT "VerificationMessage_userId_fkey";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "contentType" "ContentType" NOT NULL DEFAULT 'free',
ADD COLUMN     "distributionChannels" "DistributionChannel"[],
ADD COLUMN     "originalCreatorId" TEXT,
ADD COLUMN     "repostCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "saveCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "price" DROP DEFAULT,
ALTER COLUMN "price" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "facePhotoUrl",
DROP COLUMN "rejectionReason",
DROP COLUMN "selfieCapturedAt",
DROP COLUMN "verifiedAt",
DROP COLUMN "verifiedBy",
ADD COLUMN     "fullBio" TEXT,
ADD COLUMN     "gracePeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "lastPaymentAttemptAt" TIMESTAMP(3),
ADD COLUMN     "paymentFailureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shortBio" TEXT,
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ALTER COLUMN "subscriptionStatus" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "VerificationMessage" DROP COLUMN "userId",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- DropTable
DROP TABLE "InboxMessage";

-- CreateTable
CREATE TABLE "PaymentFailureLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'failed',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentFailureLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewQueue" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewHistory" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playlistId" TEXT,

    CONSTRAINT "SavedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "metadata" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advertiser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiserProfile" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "targetAudience" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertiserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertiserVerification" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertiserVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdPayment" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AdPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "placement" TEXT NOT NULL,
    "cpm" INTEGER NOT NULL,
    "budget" INTEGER NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "remainingBudget" INTEGER NOT NULL DEFAULT 0,
    "countries" JSONB,
    "interests" JSONB,
    "ageRange" JSONB,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "rejectionReason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdImpression" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewDuration" INTEGER,
    "fullyVisible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdImpression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdClick" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdApplication" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "taxId" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "campaignName" TEXT NOT NULL,
    "campaignDescription" TEXT,
    "placement" TEXT NOT NULL,
    "cpm" INTEGER NOT NULL,
    "budget" INTEGER NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "countries" JSONB,
    "interests" JSONB,
    "ageRange" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "advertiserId" TEXT,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentFailureLog_userId_idx" ON "PaymentFailureLog"("userId");

-- CreateIndex
CREATE INDEX "PaymentFailureLog_createdAt_idx" ON "PaymentFailureLog"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentFailureLog_status_idx" ON "PaymentFailureLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewQueue_postId_key" ON "ReviewQueue"("postId");

-- CreateIndex
CREATE INDEX "ReviewQueue_status_idx" ON "ReviewQueue"("status");

-- CreateIndex
CREATE INDEX "ReviewQueue_priority_idx" ON "ReviewQueue"("priority");

-- CreateIndex
CREATE INDEX "ReviewQueue_submittedAt_idx" ON "ReviewQueue"("submittedAt");

-- CreateIndex
CREATE INDEX "ReviewQueue_assignedTo_idx" ON "ReviewQueue"("assignedTo");

-- CreateIndex
CREATE INDEX "ReviewQueue_status_priority_idx" ON "ReviewQueue"("status", "priority");

-- CreateIndex
CREATE INDEX "ReviewHistory_postId_idx" ON "ReviewHistory"("postId");

-- CreateIndex
CREATE INDEX "ReviewHistory_adminId_idx" ON "ReviewHistory"("adminId");

-- CreateIndex
CREATE INDEX "ReviewHistory_createdAt_idx" ON "ReviewHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ReviewHistory_action_idx" ON "ReviewHistory"("action");

-- CreateIndex
CREATE INDEX "ReviewHistory_createdAt_action_idx" ON "ReviewHistory"("createdAt", "action");

-- CreateIndex
CREATE INDEX "AdminNotification_adminId_idx" ON "AdminNotification"("adminId");

-- CreateIndex
CREATE INDEX "AdminNotification_isRead_idx" ON "AdminNotification"("isRead");

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- CreateIndex
CREATE INDEX "SavedPost_userId_idx" ON "SavedPost"("userId");

-- CreateIndex
CREATE INDEX "SavedPost_postId_idx" ON "SavedPost"("postId");

-- CreateIndex
CREATE INDEX "SavedPost_createdAt_idx" ON "SavedPost"("createdAt");

-- CreateIndex
CREATE INDEX "SavedPost_playlistId_idx" ON "SavedPost"("playlistId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPost_userId_postId_key" ON "SavedPost"("userId", "postId");

-- CreateIndex
CREATE INDEX "DirectPurchase_userId_idx" ON "DirectPurchase"("userId");

-- CreateIndex
CREATE INDEX "DirectPurchase_postId_idx" ON "DirectPurchase"("postId");

-- CreateIndex
CREATE INDEX "DirectPurchase_status_idx" ON "DirectPurchase"("status");

-- CreateIndex
CREATE INDEX "DirectPurchase_createdAt_idx" ON "DirectPurchase"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DirectPurchase_userId_postId_key" ON "DirectPurchase"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Advertiser_email_key" ON "Advertiser"("email");

-- CreateIndex
CREATE INDEX "Advertiser_email_idx" ON "Advertiser"("email");

-- CreateIndex
CREATE INDEX "Advertiser_status_idx" ON "Advertiser"("status");

-- CreateIndex
CREATE INDEX "Advertiser_createdAt_idx" ON "Advertiser"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertiserProfile_advertiserId_key" ON "AdvertiserProfile"("advertiserId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertiserVerification_advertiserId_key" ON "AdvertiserVerification"("advertiserId");

-- CreateIndex
CREATE INDEX "Campaign_advertiserId_idx" ON "Campaign"("advertiserId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_placement_idx" ON "Campaign"("placement");

-- CreateIndex
CREATE INDEX "Campaign_createdAt_idx" ON "Campaign"("createdAt");

-- CreateIndex
CREATE INDEX "Campaign_startDate_idx" ON "Campaign"("startDate");

-- CreateIndex
CREATE INDEX "Campaign_endDate_idx" ON "Campaign"("endDate");

-- CreateIndex
CREATE INDEX "AdImpression_campaignId_idx" ON "AdImpression"("campaignId");

-- CreateIndex
CREATE INDEX "AdImpression_userId_idx" ON "AdImpression"("userId");

-- CreateIndex
CREATE INDEX "AdImpression_viewedAt_idx" ON "AdImpression"("viewedAt");

-- CreateIndex
CREATE INDEX "AdClick_campaignId_idx" ON "AdClick"("campaignId");

-- CreateIndex
CREATE INDEX "AdClick_userId_idx" ON "AdClick"("userId");

-- CreateIndex
CREATE INDEX "AdClick_clickedAt_idx" ON "AdClick"("clickedAt");

-- CreateIndex
CREATE INDEX "AdApplication_email_idx" ON "AdApplication"("email");

-- CreateIndex
CREATE INDEX "AdApplication_status_idx" ON "AdApplication"("status");

-- CreateIndex
CREATE INDEX "AdApplication_createdAt_idx" ON "AdApplication"("createdAt");

-- CreateIndex
CREATE INDEX "Post_contentType_idx" ON "Post"("contentType");

-- CreateIndex
CREATE INDEX "Post_originalCreatorId_idx" ON "Post"("originalCreatorId");

-- CreateIndex
CREATE INDEX "User_subscriptionTier_idx" ON "User"("subscriptionTier");

-- CreateIndex
CREATE INDEX "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "User_subscriptionExpiresAt_idx" ON "User"("subscriptionExpiresAt");

-- AddForeignKey
ALTER TABLE "PaymentFailureLog" ADD CONSTRAINT "PaymentFailureLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_originalCreatorId_fkey" FOREIGN KEY ("originalCreatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationMessage" ADD CONSTRAINT "VerificationMessage_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHistory" ADD CONSTRAINT "ReviewHistory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHistory" ADD CONSTRAINT "ReviewHistory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectPurchase" ADD CONSTRAINT "DirectPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectPurchase" ADD CONSTRAINT "DirectPurchase_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserProfile" ADD CONSTRAINT "AdvertiserProfile_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertiserVerification" ADD CONSTRAINT "AdvertiserVerification_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPayment" ADD CONSTRAINT "AdPayment_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPayment" ADD CONSTRAINT "AdPayment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdImpression" ADD CONSTRAINT "AdImpression_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdClick" ADD CONSTRAINT "AdClick_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
