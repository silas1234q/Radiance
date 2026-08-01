import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import AppError from '../errors/AppError';
import NotFoundError from '../errors/NotFoundError';
import ValidationErrors from '../errors/ValidationError';
import { getOrCreateAnalysis } from '../services/productAnalysisService';
import { searchProducts as obfSearch, getProductByBarcode as obfGetByBarcode } from '../services/openBeautyFactsService';
import { extractIngredientsFromImage } from '../services/openAIService';
import * as revenueCatService from '../services/revenueCatService';
import { getAuth } from '@clerk/express';

const FREE_PRODUCT_SCAN_LIMIT = 10;

const VALID_CATEGORIES = [
  'Cleanser', 'Toner', 'Serum', 'Moisturizer', 'Sunscreen',
  'Eye Cream', 'Exfoliant', 'Mask', 'Oil',
] as const;

export const searchProductsHandler = catchAsync(async (req, res) => {
  const q = (req.query.q as string || '').trim();
  if (!q) {
    res.json([]);
    return;
  }
  const results = await obfSearch(q, 25);
  res.json(results);
});

export const getProducts = catchAsync(async (req, res) => {
  const { category } = req.query;
  const products = await prisma.product.findMany({
    where: category ? { category: category as string } : undefined,
    orderBy: { name: 'asc' },
  });
  res.json(products);
});

export const getProductById = catchAsync(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id as string } });
  if (!product) throw new NotFoundError('Product not found');
  res.json(product);
});

export const getProductByBarcodeHandler = catchAsync(async (req, res) => {
  // Enforce free product scan limit for non-Pro users
  if (req.user) {
    const scanCount = await prisma.userProduct.count({
      where: { userId: req.user.id, source: 'scanned' },
    });

    if (scanCount >= FREE_PRODUCT_SCAN_LIMIT) {
      // Check Pro status — if RevenueCat is configured, verify server-side
      let isPro = false;
      if (revenueCatService.isConfigured()) {
        const auth = getAuth(req);
        isPro = auth?.userId ? await revenueCatService.hasProEntitlement(auth.userId) : false;
      }
      if (!isPro) {
        throw new AppError({
          message: `You've used all ${FREE_PRODUCT_SCAN_LIMIT} free product scans. Upgrade to Radiance Pro for unlimited scans.`,
          statusCode: 403,
          type: 'PRODUCT_SCAN_LIMIT',
        });
      }
    }
  }

  const product = await obfGetByBarcode(req.params.code as string);
  if (!product) throw new NotFoundError('Product not found');

  // Auto-track as "scanned" in user's shelf
  if (req.user) {
    await prisma.userProduct.upsert({
      where: { userId_productId: { userId: req.user.id, productId: product.id } },
      update: { source: 'scanned' },
      create: { userId: req.user.id, productId: product.id, source: 'scanned' },
    });
  }

  res.json(product);
});

export const getProductScanLimit = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const scanCount = await prisma.userProduct.count({
    where: { userId, source: 'scanned' },
  });

  // Pro users get unlimited scans
  let isPro = false;
  if (revenueCatService.isConfigured()) {
    const auth = getAuth(req);
    isPro = auth?.userId ? await revenueCatService.hasProEntitlement(auth.userId) : false;
  }

  res.json({
    scansUsed: scanCount,
    freeLimit: FREE_PRODUCT_SCAN_LIMIT,
    scansRemaining: isPro ? null : Math.max(0, FREE_PRODUCT_SCAN_LIMIT - scanCount),
    isPro,
  });
});

export const extractIngredients = catchAsync(async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl?.trim()) {
    throw new ValidationErrors([{ field: 'imageUrl', message: 'Image URL is required' }]);
  }
  const ingredients = await extractIngredientsFromImage(imageUrl);
  res.json({ ingredients });
});

export const createProduct = catchAsync(async (req, res) => {
  const { name, brand, category, ingredients, barcode, imageUrl } = req.body;

  const errors: Array<{ field: string; message: string }> = [];
  if (!name?.trim()) errors.push({ field: 'name', message: 'Name is required' });
  if (!brand?.trim()) errors.push({ field: 'brand', message: 'Brand is required' });
  if (!category?.trim()) errors.push({ field: 'category', message: 'Category is required' });
  if (!ingredients || (Array.isArray(ingredients) && ingredients.length === 0) || (typeof ingredients === 'string' && !ingredients.trim())) {
    errors.push({ field: 'ingredients', message: 'Ingredients are required' });
  }
  if (category && !VALID_CATEGORIES.includes(category.trim())) {
    errors.push({ field: 'category', message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  if (errors.length) throw new ValidationErrors(errors);

  // If barcode provided, check for existing product
  if (barcode?.trim()) {
    const existing = await prisma.product.findUnique({ where: { barcode: barcode.trim() } });
    if (existing) {
      res.status(200).json(existing);
      return;
    }
  }

  // Normalize ingredients: accept string[] or comma-separated string
  const ingredientList: string[] = Array.isArray(ingredients)
    ? ingredients.map((i: string) => i.trim()).filter(Boolean)
    : ingredients.split(',').map((i: string) => i.trim()).filter(Boolean);

  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      ingredients: ingredientList,
      barcode: barcode?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      source: 'manual',
    },
  });

  // Auto-track as "added" in user's shelf
  if (req.user) {
    await prisma.userProduct.upsert({
      where: { userId_productId: { userId: req.user.id, productId: product.id } },
      update: { source: 'added' },
      create: { userId: req.user.id, productId: product.id, source: 'added' },
    });
  }

  res.status(201).json(product);
});

export const getProductAnalysis = catchAsync(async (req, res) => {
  const result = await getOrCreateAnalysis(req.params.id as string, req.user!.id);
  if (!result) throw new NotFoundError('Product not found');

  res.json({ product: result.product, analysis: result.analysis });
});
