-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoDistribution" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contractStatus" TEXT,
ADD COLUMN     "platformSplit" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN     "revenueSplit" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'inactive',
ADD COLUMN     "userType" TEXT NOT NULL DEFAULT 'vibe',
ADD COLUMN     "zlsBadgeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "zlsProfileBanner" TEXT,
ADD COLUMN     "zlsVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "zlsWatermarkEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "agreementText" TEXT NOT NULL,
    "agreedText" TEXT,
    "eSignature" TEXT,
    "signedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "terminatedAt" TIMESTAMP(3),
    "terminatedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorSubscription" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'basic',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payfastId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_creatorId_key" ON "Contract"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorSubscription_creatorId_key" ON "CreatorSubscription"("creatorId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorSubscription" ADD CONSTRAINT "CreatorSubscription_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
