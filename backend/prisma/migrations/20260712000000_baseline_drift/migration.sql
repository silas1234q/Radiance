-- Baseline drift migration
-- These changes were already applied to the database manually.
-- This migration exists to sync the migration history with the actual DB state.

-- AlterTable: User (rename name -> firstName, add lastName)
ALTER TABLE "User" RENAME COLUMN "name" TO "firstName";
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

-- AlterTable: SkinProfile (add AI/scan fields)
ALTER TABLE "SkinProfile" ADD COLUMN "aiAnalysisRaw" JSONB;
ALTER TABLE "SkinProfile" ADD COLUMN "scanData" JSONB;
ALTER TABLE "SkinProfile" ADD COLUMN "analysisSource" TEXT;
ALTER TABLE "SkinProfile" ADD COLUMN "photoUrl" TEXT;

-- AlterTable: Routine (add name column, update unique constraint)
ALTER TABLE "Routine" ADD COLUMN "name" TEXT;
DROP INDEX "Routine_userId_type_key";
CREATE UNIQUE INDEX "Routine_userId_type_name_key" ON "Routine"("userId", "type", "name");

-- AlterTable: RoutineStep (add aiRationale)
ALTER TABLE "RoutineStep" ADD COLUMN "aiRationale" TEXT;

-- AlterTable: SkinLog (add extended fields, unique constraint)
ALTER TABLE "SkinLog" ADD COLUMN "mood" TEXT;
ALTER TABLE "SkinLog" ADD COLUMN "feelings" TEXT[];
ALTER TABLE "SkinLog" ADD COLUMN "concerns" TEXT[];
ALTER TABLE "SkinLog" ADD COLUMN "sleepQuality" TEXT;
ALTER TABLE "SkinLog" ADD COLUMN "activityLevel" TEXT;
ALTER TABLE "SkinLog" ADD COLUMN "sunExposure" TEXT;
ALTER TABLE "SkinLog" ADD COLUMN "waterGlasses" INTEGER;
ALTER TABLE "SkinLog" ADD COLUMN "supplements" TEXT;
ALTER TABLE "SkinLog" ADD COLUMN "periodStatus" TEXT;
ALTER TABLE "SkinLog" ADD COLUMN "otherFactors" TEXT[];
ALTER TABLE "SkinLog" ADD COLUMN "completedSteps" TEXT[];
ALTER TABLE "SkinLog" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX "SkinLog_userId_date_key" ON "SkinLog"("userId", "date");

-- AlterTable: Product (add barcode, source fields)
ALTER TABLE "Product" ADD COLUMN "barcode" TEXT;
ALTER TABLE "Product" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'seeded';
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateTable: RoutineInsightCache
CREATE TABLE "RoutineInsightCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "routineHash" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineInsightCache_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RoutineInsightCache_userId_type_key" ON "RoutineInsightCache"("userId", "type");

-- CreateTable: ProductAnalysis
CREATE TABLE "ProductAnalysis" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fitScore" INTEGER NOT NULL,
    "pros" TEXT[],
    "cons" TEXT[],
    "ingredientFlags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAnalysis_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductAnalysis_productId_userId_key" ON "ProductAnalysis"("productId", "userId");

-- AddForeignKey
ALTER TABLE "ProductAnalysis" ADD CONSTRAINT "ProductAnalysis_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAnalysis" ADD CONSTRAINT "ProductAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
