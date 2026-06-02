/*
  Warnings:

  - You are about to drop the column `creatorId` on the `VerificationMessage` table. All the data in the column will be lost.
  - Added the required column `userId` to the `VerificationMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "VerificationMessage" DROP CONSTRAINT "VerificationMessage_creatorId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "facePhotoUrl" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "selfieCapturedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- AlterTable
ALTER TABLE "VerificationMessage" DROP COLUMN "creatorId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "InboxMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VerificationMessage" ADD CONSTRAINT "VerificationMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxMessage" ADD CONSTRAINT "InboxMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
