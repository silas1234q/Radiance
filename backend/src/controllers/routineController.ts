import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import NotFoundError from '../errors/NotFoundError';
import ValidationErrors from '../errors/ValidationError';
import * as gamificationService from '../services/gamificationService';

async function invalidateInsightCache(userId: string) {
  await prisma.routineInsightCache.deleteMany({ where: { userId } });
}

export const getRoutines = catchAsync(async (req, res) => {
  const routines = await prisma.routine.findMany({
    where: { userId: req.user!.id },
    include: { steps: { orderBy: { order: 'asc' }, include: { product: { select: { id: true, name: true, brand: true, imageUrl: true, category: true } } } } },
  });

  // Virtual daily reset: show steps as incomplete if not completed today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const mapped = routines.map((routine) => ({
    ...routine,
    steps: routine.steps.map((step) => ({
      ...step,
      isCompleted: step.completedAt ? step.completedAt >= todayStart : false,
    })),
  }));

  res.json(mapped);
});

export const createRoutine = catchAsync(async (req, res) => {
  const { type, steps } = req.body;
  const userId = req.user!.id;
  const existing = await prisma.routine.findFirst({
    where: { userId, type, name: null },
  });
  let routine;
  if (existing) {
    routine = await prisma.routine.update({
      where: { id: existing.id },
      data: { steps: { deleteMany: {}, create: steps } },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  } else {
    routine = await prisma.routine.create({
      data: { userId, type, steps: { create: steps } },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  }
  await invalidateInsightCache(userId);
  res.json(routine);
});

export const addStep = catchAsync(async (req, res) => {
  const routineId = req.params.id as string;
  const { name, description, productId } = req.body;

  // Verify routine belongs to user
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId: req.user!.id },
    include: { steps: { orderBy: { order: 'desc' }, take: 1 } },
  });
  if (!routine) throw new NotFoundError('Routine not found');

  const nextOrder = (routine.steps[0]?.order ?? -1) + 1;

  const step = await prisma.routineStep.create({
    data: {
      routineId,
      order: nextOrder,
      name,
      description: description || null,
      productId: productId || null,
    },
    include: { product: true },
  });

  // Track product as "added" in user's shelf
  if (productId) {
    await prisma.userProduct.upsert({
      where: { userId_productId: { userId: req.user!.id, productId } },
      update: {},
      create: { userId: req.user!.id, productId, source: 'added' },
    });
  }

  await invalidateInsightCache(req.user!.id);
  res.status(201).json(step);
});

export const toggleStep = catchAsync(async (req, res) => {
  const stepId = req.params.stepId as string;
  const step = await prisma.routineStep.findFirst({
    where: { id: stepId, routine: { userId: req.user!.id } },
    include: { routine: { include: { steps: true } } },
  });
  if (!step) throw new NotFoundError('Step not found');

  const togglingOn = !step.isCompleted;
  const updated = await prisma.routineStep.update({
    where: { id: stepId },
    data: {
      isCompleted: togglingOn,
      completedAt: togglingOn ? new Date() : null,
    },
  });

  // If toggling ON, check if all steps in the routine are now complete
  if (togglingOn && (step.routine.type === 'AM' || step.routine.type === 'PM')) {
    const allSteps = step.routine.steps;
    const allComplete = allSteps.every((s) => s.id === stepId ? true : s.isCompleted);
    if (allComplete) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const userId = req.user!.id;
      await gamificationService.awardXp(userId, `COMPLETE_${step.routine.type}`, 50, today);
      await gamificationService.updateDailyCompletion(userId, step.routine.type === 'AM' ? 'amCompleted' : 'pmCompleted');
    }
  }

  res.json(updated);
});

export const completeRoutine = catchAsync(async (req, res) => {
  const routineId = req.params.id as string;
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId: req.user!.id },
    include: { steps: { orderBy: { order: 'asc' }, include: { product: { select: { id: true, name: true, brand: true, imageUrl: true, category: true } } } } },
  });
  if (!routine) throw new NotFoundError('Routine not found');

  await prisma.routineStep.updateMany({
    where: { routineId },
    data: { isCompleted: true, completedAt: new Date() },
  });

  const updated = await prisma.routine.findFirst({
    where: { id: routineId },
    include: { steps: { orderBy: { order: 'asc' }, include: { product: { select: { id: true, name: true, brand: true, imageUrl: true, category: true } } } } },
  });

  // Gamification: award XP for completing AM/PM routines
  if (routine.type === 'AM' || routine.type === 'PM') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const userId = req.user!.id;
    await gamificationService.awardXp(userId, `COMPLETE_${routine.type}`, 50, today);
    await gamificationService.updateDailyCompletion(userId, routine.type === 'AM' ? 'amCompleted' : 'pmCompleted');
  }

  res.json(updated);
});

export const deleteRoutine = catchAsync(async (req, res) => {
  const routineId = req.params.id as string;
  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId: req.user!.id },
  });
  if (!routine) throw new NotFoundError('Routine not found');

  await prisma.routine.delete({ where: { id: routineId } });
  await invalidateInsightCache(req.user!.id);
  res.json({ success: true });
});

export const createCustomRoutine = catchAsync(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    throw new ValidationErrors([{ field: 'name', message: 'Routine name is required' }]);
  }

  const routine = await prisma.routine.create({
    data: {
      userId: req.user!.id,
      type: 'CUSTOM',
      name: name.trim(),
    },
    include: { steps: { orderBy: { order: 'asc' }, include: { product: true } } },
  });
  res.status(201).json(routine);
});

export const updateStep = catchAsync(async (req, res) => {
  const stepId = req.params.stepId as string;
  const { name, description, productId } = req.body;

  const step = await prisma.routineStep.findFirst({
    where: { id: stepId, routine: { userId: req.user!.id } },
  });
  if (!step) throw new NotFoundError('Step not found');

  const data: { name?: string; description?: string; productId?: string } = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (productId !== undefined) data.productId = productId;

  const updated = await prisma.routineStep.update({
    where: { id: stepId },
    data,
    include: { product: true },
  });
  await invalidateInsightCache(req.user!.id);
  res.json(updated);
});

export const deleteStep = catchAsync(async (req, res) => {
  const stepId = req.params.stepId as string;
  const step = await prisma.routineStep.findFirst({
    where: { id: stepId, routine: { userId: req.user!.id } },
  });
  if (!step) throw new NotFoundError('Step not found');

  await prisma.routineStep.delete({ where: { id: stepId } });
  await invalidateInsightCache(req.user!.id);
  res.json({ success: true });
});

export const reorderSteps = catchAsync(async (req, res) => {
  const routineId = req.params.id as string;
  const { stepIds } = req.body as { stepIds: string[] };

  if (!Array.isArray(stepIds) || stepIds.length === 0) {
    throw new ValidationErrors([{ field: 'stepIds', message: 'stepIds array is required' }]);
  }

  const routine = await prisma.routine.findFirst({
    where: { id: routineId, userId: req.user!.id },
    include: { steps: { select: { id: true } } },
  });
  if (!routine) throw new NotFoundError('Routine not found');

  // Verify all submitted stepIds belong to this routine
  const routineStepIds = new Set(routine.steps.map((s) => s.id));
  for (const id of stepIds) {
    if (!routineStepIds.has(id)) {
      throw new NotFoundError('Step not found');
    }
  }

  await Promise.all(
    stepIds.map((id, index) =>
      prisma.routineStep.update({ where: { id }, data: { order: index } })
    )
  );

  await invalidateInsightCache(req.user!.id);
  res.json({ success: true });
});
