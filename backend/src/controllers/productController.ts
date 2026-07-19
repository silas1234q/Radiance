import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import NotFoundError from '../errors/NotFoundError';
import ValidationErrors from '../errors/ValidationError';
import { getOrCreateAnalysis } from '../services/productAnalysisService';
import { searchProducts as obfSearch, getProductByBarcode as obfGetByBarcode } from '../services/openBeautyFactsService';
import { extractIngredientsFromImage } from '../services/openAIService';

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
  const product = await obfGetByBarcode(req.params.code as string);
  if (!product) throw new NotFoundError('Product not found');
  res.json(product);
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

  res.status(201).json(product);
});

export const getProductAnalysis = catchAsync(async (req, res) => {
  const result = await getOrCreateAnalysis(req.params.id as string, req.user!.id);
  if (!result) throw new NotFoundError('Product not found');

  res.json({ product: result.product, analysis: result.analysis });
});
