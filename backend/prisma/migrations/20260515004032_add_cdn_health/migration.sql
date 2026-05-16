-- CreateTable
CREATE TABLE "CDNHealthLog" (
    "id" TEXT NOT NULL,
    "primaryHealthy" BOOLEAN NOT NULL,
    "secondaryHealthy" BOOLEAN NOT NULL,
    "tertiaryHealthy" BOOLEAN,
    "activeCDN" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CDNHealthLog_pkey" PRIMARY KEY ("id")
);
