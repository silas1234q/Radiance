import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import NotFoundError from '../errors/NotFoundError';

export const getUserProducts = catchAsync(async (req, res) => {
  const userId = req.user!.id;

  // Backfill: sync recommended products from system-generated AM/PM routines only
  const routineSteps = await prisma.routineStep.findMany({
    where: {
      routine: { userId, type: { in: ['AM', 'PM'] }, name: null },
      productId: { not: null },
    },
    select: { productId: true },
  });

  const routineProductIds = [...new Set(
    routineSteps.map(s => s.productId).filter((id): id is string => !!id)
  )];

  if (routineProductIds.length > 0) {
    // Only insert missing ones (don't overwrite existing source)
    const existing = await prisma.userProduct.findMany({
      where: { userId, productId: { in: routineProductIds } },
      select: { productId: true },
    });
    const existingIds = new Set(existing.map(e => e.productId));
    const toCreate = routineProductIds.filter(id => !existingIds.has(id));

    if (toCreate.length > 0) {
      await prisma.userProduct.createMany({
        data: toCreate.map(productId => ({ userId, productId, source: 'recommended' })),
        skipDuplicates: true,
      });
    }
  }

  const userProducts = await prisma.userProduct.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(userProducts);
});

export const addUserProduct = catchAsync(async (req, res) => {
  const { productId, source } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product not found');

  const userProduct = await prisma.userProduct.upsert({
    where: { userId_productId: { userId: req.user!.id, productId } },
    update: { source },
    create: { userId: req.user!.id, productId, source },
    include: { product: true },
  });
  res.status(201).json(userProduct);
});

export const removeUserProduct = catchAsync(async (req, res) => {
  const productId = req.params.productId as string;
  await prisma.userProduct.deleteMany({
    where: { userId: req.user!.id, productId },
  });
  res.status(204).send();
});
