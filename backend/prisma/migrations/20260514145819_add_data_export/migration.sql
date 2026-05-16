-- AlterTable
ALTER TABLE "DataExportRequest" ADD COLUMN     "dataTypes" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "downloadedAt" TIMESTAMP(3),
ADD COLUMN     "fileSize" INTEGER;
