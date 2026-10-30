/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `SkinScore` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Routine" ADD COLUMN     "amReminderTime" TEXT,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'skincare',
ADD COLUMN     "pmReminderTime" TEXT,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SkinLog" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SkinProfile" ADD COLUMN     "baselinePhotoUrl" TEXT,
ADD COLUMN     "faceScanCountThisWeek" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "faceScanWeekStart" TIMESTAMP(3),
ADD COLUMN     "ingredientsToAvoid" TEXT[],
ADD COLUMN     "lastFaceScanAt" TIMESTAMP(3),
ADD COLUMN     "productBudget" TEXT,
ADD COLUMN     "routineLength" TEXT,
ADD COLUMN     "weeklyPlan" JSONB,
ADD COLUMN     "weeklyPlanSource" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "expoPushToken" TEXT,
ADD COLUMN     "lastScanReminderAt" TIMESTAMP(3),
ADD COLUMN     "lastWeeklySummaryAt" TIMESTAMP(3),
ADD COLUMN     "lastWinbackAt" TIMESTAMP(3),
ADD COLUMN     "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "weeklyProgressEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "winbackEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UserGamification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletionDate" TIMESTAMP(3),
    "streakRestoresLeft" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGamification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amCompleted" BOOLEAN NOT NULL DEFAULT false,
    "pmCompleted" BOOLEAN NOT NULL DEFAULT false,
    "customCompleted" BOOLEAN NOT NULL DEFAULT false,
    "moodLogged" BOOLEAN NOT NULL DEFAULT false,
    "isFullDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "ScanCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGamification_userId_key" ON "UserGamification"("userId");

-- CreateIndex
CREATE INDEX "DailyCompletion_userId_idx" ON "DailyCompletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCompletion_userId_date_key" ON "DailyCompletion"("userId", "date");

-- CreateIndex
CREATE INDEX "XpEvent_userId_date_idx" ON "XpEvent"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ScanCredit_transactionId_key" ON "ScanCredit"("transactionId");

-- CreateIndex
CREATE INDEX "ScanCredit_userId_idx" ON "ScanCredit"("userId");

-- CreateIndex
CREATE INDEX "UserProduct_userId_idx" ON "UserProduct"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProduct_userId_productId_key" ON "UserProduct"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "SkinScore_userId_date_key" ON "SkinScore"("userId", "date");

-- AddForeignKey
ALTER TABLE "UserGamification" ADD CONSTRAINT "UserGamification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCompletion" ADD CONSTRAINT "DailyCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanCredit" ADD CONSTRAINT "ScanCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProduct" ADD CONSTRAINT "UserProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProduct" ADD CONSTRAINT "UserProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
