import OpenAI from 'openai';
import { z } from 'zod';
import { Product, SkinProfile } from '../../generated/prisma/client';
import prisma from '../config/db.config';
import aiConfig from '../config/ai.config';

// --- Types ---

interface IngredientFlag {
  name: string;
  safe: boolean;
}

interface ProductAnalysisResult {
  fitScore: number;
  pros: string[];
  cons: string[];
  ingredientFlags: IngredientFlag[];
}

// --- Zod schema for AI structured output ---

const aiProductAnalysisSchema = z.object({
  fitScore: z.number().int().min(0).max(100),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  ingredientFlags: z.array(z.object({
    name: z.string(),
    safe: z.boolean(),
  })),
});

// --- AI-powered analysis ---

async function analyzeProductWithAI(
  product: Product,
  profile: SkinProfile,
): Promise<ProductAnalysisResult> {
  const openai = new OpenAI({ apiKey: aiConfig.openai.apiKey });

  const response = await openai.chat.completions.create(
    {
      model: aiConfig.openai.model,
      temperature: aiConfig.openai.temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'product_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              fitScore: {
                type: 'number',
                description: 'How well this product fits the user\'s skin profile (0-100). 70+ is good, 50-69 is neutral, below 50 is poor fit.',
              },
              pros: {
                type: 'array',
                items: { type: 'string' },
                description: 'Benefits of this product for the user\'s skin (2-5 items)',
              },
              cons: {
                type: 'array',
                items: { type: 'string' },
                description: 'Potential concerns or drawbacks for the user\'s skin (0-4 items)',
              },
              ingredientFlags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Flag label (e.g. "Fragrance-free", "Paraben-free", "Alcohol-free")' },
                    safe: { type: 'boolean', description: 'true if the product is free of this concern' },
                  },
                  required: ['name', 'safe'],
                  additionalProperties: false,
                },
                description: 'Free-from checks relevant to this product and user',
              },
            },
            required: ['fitScore', 'pros', 'cons', 'ingredientFlags'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: 'system',
          content: `You are a board-certified dermatologist analyzing skincare product compatibility for a specific user. Evaluate the product's ingredients against the user's skin profile.

Rules:
- fitScore: 0-100. Be realistic — most products score 40-80. Only give 85+ if the product is exceptionally well-suited. Below 30 only if clearly harmful.
- pros: 2-5 specific benefits based on the ingredients and user's skin needs.
- cons: 0-4 concerns. Include allergen warnings if any user allergens are found in ingredients.
- ingredientFlags: Check for common free-from categories (Alcohol-free, Fragrance-free, Paraben-free, Sulfate-free, Silicone-free, Oil-free, EU-allergen-free, Reef-safe, Fungal-acne-safe). Only include relevant flags.
- Reference specific ingredients by name when possible.`,
        },
        {
          role: 'user',
          content: `Product:
- Name: ${product.name}
- Brand: ${product.brand}
- Category: ${product.category}
- Ingredients: ${product.ingredients.join(', ') || 'Not listed'}

User Skin Profile:
- Skin Type: ${profile.skinType || 'Unknown'}
- Sensitivity: ${profile.sensitivityLevel || 'Unknown'}
- Concerns: ${profile.concerns.join(', ') || 'None specified'}
- Allergies: ${profile.allergies.join(', ') || 'None'}`,
        },
      ],
    },
    { timeout: 30_000 },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty response for product analysis');

  const parsed = JSON.parse(content);
  return aiProductAnalysisSchema.parse(parsed);
}

// --- Cache logic ---

const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function getOrCreateAnalysis(
  productId: string,
  userId: string,
): Promise<{ product: Product; analysis: ProductAnalysisResult | null }> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return null as unknown as { product: Product; analysis: ProductAnalysisResult | null };

  const profile = await prisma.skinProfile.findUnique({ where: { userId } });
  if (!profile) return { product, analysis: null };

  // Check cache
  const cached = await prisma.productAnalysis.findUnique({
    where: { productId_userId: { productId, userId } },
  });

  if (cached && Date.now() - cached.createdAt.getTime() < CACHE_MAX_AGE_MS) {
    return {
      product,
      analysis: {
        fitScore: cached.fitScore,
        pros: cached.pros,
        cons: cached.cons,
        ingredientFlags: cached.ingredientFlags as unknown as IngredientFlag[],
      },
    };
  }

  // Try AI analysis
  try {
    const analysis = await analyzeProductWithAI(product, profile);

    await prisma.productAnalysis.upsert({
      where: { productId_userId: { productId, userId } },
      create: {
        productId,
        userId,
        fitScore: analysis.fitScore,
        pros: analysis.pros,
        cons: analysis.cons,
        ingredientFlags: JSON.parse(JSON.stringify(analysis.ingredientFlags)),
      },
      update: {
        fitScore: analysis.fitScore,
        pros: analysis.pros,
        cons: analysis.cons,
        ingredientFlags: JSON.parse(JSON.stringify(analysis.ingredientFlags)),
        createdAt: new Date(),
      },
    });

    return { product, analysis };
  } catch (err) {
    console.error('AI product analysis failed, falling back to rule-based:', err);
    const analysis = analyzeProductFit(product, profile);
    return { product, analysis };
  }
}

// --- Rule-based fallback (existing logic) ---

const INGREDIENT_CONCERNS: Record<string, { bad_for: string[]; reason: string }> = {
  alcohol: { bad_for: ['dry', 'sensitive'], reason: 'Can be drying and irritating' },
  'denatured alcohol': { bad_for: ['dry', 'sensitive'], reason: 'Can strip natural oils' },
  'alcohol denat': { bad_for: ['dry', 'sensitive'], reason: 'Can strip natural oils' },
  fragrance: { bad_for: ['sensitive', 'acne'], reason: 'Can cause irritation and breakouts' },
  parfum: { bad_for: ['sensitive', 'acne'], reason: 'Can cause irritation and breakouts' },
  'sodium lauryl sulfate': { bad_for: ['dry', 'sensitive', 'eczema'], reason: 'Harsh surfactant that strips moisture' },
  'sodium laureth sulfate': { bad_for: ['dry', 'sensitive'], reason: 'Can be drying for sensitive skin' },
  'mineral oil': { bad_for: ['oily', 'acne'], reason: 'Can clog pores' },
  'isopropyl myristate': { bad_for: ['acne', 'oily'], reason: 'Highly comedogenic' },
  'coconut oil': { bad_for: ['acne', 'oily'], reason: 'Comedogenic, can cause breakouts' },
  paraben: { bad_for: [], reason: 'Controversial preservative' },
  methylparaben: { bad_for: [], reason: 'Paraben preservative' },
  propylparaben: { bad_for: [], reason: 'Paraben preservative' },
  'essential oil': { bad_for: ['sensitive'], reason: 'Can cause sensitization' },
  retinol: { bad_for: ['sensitive'], reason: 'Can cause irritation if skin is very sensitive' },
};

const INGREDIENT_BENEFITS: Record<string, { good_for: string[]; reason: string }> = {
  'hyaluronic acid': { good_for: ['dry', 'dehydration', 'aging', 'wrinkles'], reason: 'Deeply hydrates and plumps skin' },
  niacinamide: { good_for: ['oily', 'acne', 'dark spots', 'hyperpigmentation', 'pores'], reason: 'Reduces oil, fades dark spots, minimizes pores' },
  'salicylic acid': { good_for: ['acne', 'oily', 'blackheads', 'pores'], reason: 'Unclogs pores and fights acne' },
  'glycolic acid': { good_for: ['texture', 'dullness', 'dark spots', 'aging'], reason: 'Exfoliates for smoother, brighter skin' },
  'vitamin c': { good_for: ['dark spots', 'dullness', 'aging', 'hyperpigmentation', 'uneven tone'], reason: 'Brightens and protects against sun damage' },
  'ascorbic acid': { good_for: ['dark spots', 'dullness', 'aging', 'hyperpigmentation'], reason: 'Potent form of Vitamin C' },
  retinol: { good_for: ['aging', 'wrinkles', 'acne', 'texture'], reason: 'Boosts cell turnover and collagen' },
  ceramide: { good_for: ['dry', 'sensitive', 'eczema', 'barrier repair'], reason: 'Restores skin barrier' },
  'aloe vera': { good_for: ['sensitive', 'redness', 'irritation'], reason: 'Soothes and calms skin' },
  'tea tree': { good_for: ['acne', 'oily'], reason: 'Natural antibacterial properties' },
  'zinc oxide': { good_for: ['sun protection', 'sensitive', 'acne'], reason: 'Gentle mineral sun protection' },
  'titanium dioxide': { good_for: ['sun protection', 'sensitive'], reason: 'Mineral UV filter' },
  squalane: { good_for: ['dry', 'sensitive', 'aging'], reason: 'Lightweight moisturizer that mimics skin oils' },
  peptide: { good_for: ['aging', 'wrinkles', 'firmness'], reason: 'Supports collagen production' },
  centella: { good_for: ['sensitive', 'acne', 'redness', 'irritation'], reason: 'Calms inflammation and aids healing' },
  'centella asiatica': { good_for: ['sensitive', 'acne', 'redness'], reason: 'Calms and repairs skin' },
  'shea butter': { good_for: ['dry', 'eczema'], reason: 'Rich emollient for deep moisture' },
  glycerin: { good_for: ['dry', 'dehydration'], reason: 'Attracts and retains moisture' },
  'azelaic acid': { good_for: ['acne', 'rosacea', 'dark spots', 'hyperpigmentation'], reason: 'Reduces acne and evens skin tone' },
  'lactic acid': { good_for: ['dry', 'texture', 'dullness'], reason: 'Gentle exfoliation with hydration' },
  panthenol: { good_for: ['dry', 'sensitive', 'irritation'], reason: 'Soothes and hydrates' },
  allantoin: { good_for: ['sensitive', 'irritation'], reason: 'Calms and softens skin' },
};

const FREE_FROM_CHECKS: { label: string; keywords: string[] }[] = [
  { label: 'Alcohol-free', keywords: ['alcohol', 'alcohol denat', 'denatured alcohol', 'ethanol', 'isopropyl alcohol'] },
  { label: 'Fragrance-free', keywords: ['fragrance', 'parfum', 'perfume', 'linalool', 'limonene'] },
  { label: 'Paraben-free', keywords: ['paraben', 'methylparaben', 'propylparaben', 'butylparaben', 'ethylparaben'] },
  { label: 'Sulfate-free', keywords: ['sodium lauryl sulfate', 'sodium laureth sulfate', 'sls', 'sles', 'ammonium lauryl sulfate'] },
  { label: 'Silicone-free', keywords: ['dimethicone', 'cyclomethicone', 'silicone', 'cyclopentasiloxane', 'trimethicone'] },
  { label: 'Oil-free', keywords: ['mineral oil', 'paraffinum liquidum', 'petrolatum', 'coconut oil', 'palm oil'] },
  { label: 'Cruelty-free', keywords: [] },
  { label: 'Vegan', keywords: [] },
  { label: 'EU-allergen-free', keywords: ['linalool', 'limonene', 'citronellol', 'geraniol', 'eugenol', 'coumarin'] },
  { label: 'Reef-safe', keywords: ['oxybenzone', 'octinoxate', 'octocrylene', 'homosalate', 'avobenzone'] },
  { label: 'Fungal-acne-safe', keywords: ['polysorbate', 'isopropyl myristate', 'lauric acid', 'palmitic acid', 'oleic acid', 'coconut oil'] },
];

const CATEGORY_CONCERN_MAP: Record<string, string[]> = {
  Cleanser: ['acne', 'oily', 'pores', 'blackheads'],
  Toner: ['pores', 'oily', 'dullness'],
  Serum: ['aging', 'wrinkles', 'dark spots', 'hyperpigmentation', 'acne', 'texture'],
  Moisturizer: ['dry', 'dehydration', 'sensitive', 'barrier repair'],
  Sunscreen: ['sun protection', 'dark spots', 'aging', 'hyperpigmentation'],
  'Eye Cream': ['dark circles', 'wrinkles', 'aging', 'puffiness'],
  Exfoliant: ['texture', 'dullness', 'acne', 'blackheads', 'pores'],
  Mask: ['dry', 'oily', 'dullness', 'acne'],
  Oil: ['dry', 'aging'],
};

function normalizeIngredient(ing: string): string {
  return ing.toLowerCase().trim();
}

export function analyzeProductFit(product: Product, profile: SkinProfile): ProductAnalysisResult {
  const ingredients = product.ingredients.map(normalizeIngredient);
  const skinType = (profile.skinType || '').toLowerCase();
  const concerns = profile.concerns.map((c) => c.toLowerCase());
  const allergies = profile.allergies.map((a) => a.toLowerCase());

  const pros: string[] = [];
  const cons: string[] = [];
  let score = 50;

  const categoryConcerns = CATEGORY_CONCERN_MAP[product.category] || [];
  const matchingConcerns = concerns.filter((c) =>
    categoryConcerns.some((cc) => c.includes(cc) || cc.includes(c)),
  );
  if (matchingConcerns.length > 0) {
    score += Math.min(matchingConcerns.length * 5, 15);
    pros.push(`${product.category} products are great for your concerns: ${matchingConcerns.join(', ')}`);
  }

  for (const [key, benefit] of Object.entries(INGREDIENT_BENEFITS)) {
    const found = ingredients.some((ing) => ing.includes(key));
    if (!found) continue;

    const matchesSkinType = benefit.good_for.includes(skinType);
    const matchesConcern = concerns.some((c) =>
      benefit.good_for.some((g) => c.includes(g) || g.includes(c)),
    );

    if (matchesSkinType || matchesConcern) {
      score += 8;
      pros.push(`Contains ${key} — ${benefit.reason}`);
    }
  }

  for (const [key, concern] of Object.entries(INGREDIENT_CONCERNS)) {
    const found = ingredients.some((ing) => ing.includes(key));
    if (!found) continue;

    const badForSkinType = concern.bad_for.includes(skinType);
    const badForConcern = concerns.some((c) =>
      concern.bad_for.some((b) => c.includes(b) || b.includes(c)),
    );

    if (badForSkinType || badForConcern) {
      score -= 10;
      cons.push(`Contains ${key} — ${concern.reason}`);
    }
  }

  for (const allergy of allergies) {
    const found = ingredients.some((ing) => ing.includes(allergy));
    if (found) {
      score -= 20;
      cons.push(`Contains ${allergy}, which is in your allergen list`);
    }
  }

  const ingredientFlags: IngredientFlag[] = [];
  for (const check of FREE_FROM_CHECKS) {
    if (check.keywords.length === 0) continue;

    const containsAny = check.keywords.some((kw) =>
      ingredients.some((ing) => ing.includes(kw)),
    );
    ingredientFlags.push({ name: check.label, safe: !containsAny });
  }

  if (ingredients.length > 5) {
    score += 3;
  }

  if (pros.length === 0 && product.category) {
    pros.push(`A ${product.category.toLowerCase()} that may complement your routine`);
  }

  score = Math.max(10, Math.min(98, score));

  return { fitScore: score, pros, cons, ingredientFlags };
}
