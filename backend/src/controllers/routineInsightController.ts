import { catchAsync } from '../utils/catchAsync';
import { getQuickInsight, getDetailedRoutineInsight, type StepPlacement } from '../services/routineInsightService';
import ValidationError from '../errors/ValidationError';

export const getRoutineInsight = catchAsync(async (req, res) => {
  const { placements } = req.body;

  if (!Array.isArray(placements)) {
    throw new ValidationError('placements must be an array');
  }

  if (placements.length === 0) {
    return res.json({ insightMessage: null, compatibilityScore: 0 });
  }

  for (const p of placements) {
    if (!p.productId || typeof p.productId !== 'string') {
      throw new ValidationError('Each placement must have a productId string');
    }
  }

  const stepPlacements: StepPlacement[] = placements.map((p: { productId: string; stepName?: string }) => ({
    productId: p.productId,
    stepName: p.stepName || 'Unknown',
  }));

  const result = await getQuickInsight(stepPlacements, req.user!.id);
  res.json(result);
});

export const getDetailedInsight = catchAsync(async (req, res) => {
  const routineId = req.query.routineId as string | undefined;
  const result = await getDetailedRoutineInsight(req.user!.id, routineId);
  res.json(result);
});
