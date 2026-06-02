-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "walletId" TEXT;

-- CreateTable
CREATE TABLE "CreatorWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWithdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorWallet_userId_key" ON "CreatorWallet"("userId");

-- CreateIndex
CREATE INDEX "CreatorWallet_userId_idx" ON "CreatorWallet"("userId");

-- CreateIndex
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

-- AddForeignKey
ALTER TABLE "CreatorWallet" ADD CONSTRAINT "CreatorWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CreatorWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
