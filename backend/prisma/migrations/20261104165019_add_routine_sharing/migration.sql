-- CreateTable
CREATE TABLE "RoutineShare" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "RoutineShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoutineShare_token_key" ON "RoutineShare"("token");

-- CreateIndex
CREATE INDEX "RoutineShare_creatorId_idx" ON "RoutineShare"("creatorId");
