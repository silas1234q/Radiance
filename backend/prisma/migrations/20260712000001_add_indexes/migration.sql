-- CreateIndex
CREATE INDEX "MoodEntry_userId_idx" ON "MoodEntry"("userId");

-- CreateIndex
CREATE INDEX "ProductAnalysis_productId_idx" ON "ProductAnalysis"("productId");

-- CreateIndex
CREATE INDEX "ProductAnalysis_userId_idx" ON "ProductAnalysis"("userId");

-- CreateIndex
CREATE INDEX "Routine_userId_idx" ON "Routine"("userId");

-- CreateIndex
CREATE INDEX "RoutineInsightCache_userId_idx" ON "RoutineInsightCache"("userId");

-- CreateIndex
CREATE INDEX "RoutineStep_routineId_idx" ON "RoutineStep"("routineId");

-- CreateIndex
CREATE INDEX "SkinLog_userId_idx" ON "SkinLog"("userId");

-- CreateIndex
CREATE INDEX "SkinQuizAnswer_userId_idx" ON "SkinQuizAnswer"("userId");

-- CreateIndex
CREATE INDEX "SkinScore_userId_idx" ON "SkinScore"("userId");
