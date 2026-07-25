import OpenAI from 'openai';
import crypto from 'crypto';
import { z } from 'zod';
import { Product, SkinProfile } from '../../generated/prisma/client';
import prisma from '../config/db.config';
import aiConfig from '../config/ai.config';

function computeRoutineHash(placements: { stepName: string; productId?: string }[]): string {
  const data = placements
    .map((p) => `${p.stepName}:${p.productId || 'none'}`)
    .sort()
    .join('|');
  return crypto.createHash('sha256').update(data).digest('hex');
}

export interface StepPlacement {
  productId: string;
  stepName: string;
}

const quickInsightSchema = z.object({
  insightMessage: z.string(),
  compatibilityScore: z.number().int().min(0).max(100),
  reasons: z.array(
    z.object({
      label: z.string(),
      sentiment: z.enum(['positive', 'negative', 'neutral']),
    }),
  ),
});

export type QuickInsightResult = z.infer<typeof quickInsightSchema>;

const detailedInsightSchema = z.object({
  compatibilityScore: z.number().int().min(0).max(100),
  summary: z.string(),
  categoryScores: z.array(
    z.object({
      category: z.string(),
      score: z.number().int().min(0).max(100),
      tip: z.string(),
    }),
  ),
  improvements: z.array(
    z.object({
      area: z.string(),
      suggestion: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
    }),
  ),
  comments: z.array(z.string()),
});

export type DetailedInsightResult = z.infer<typeof detailedInsightSchema>;

export async function getQuickInsight(
  placements: StepPlacement[],
  userId: string,
): Promise<QuickInsightResult> {
  const productIds = placements.map((p) => p.productId);
  const [products, profile] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } } }),
    prisma.skinProfile.findUnique({ where: { userId } }),
  ]);

  if (products.length === 0) {
    return { insightMessage: '', compatibilityScore: 0, reasons: [] };
  }

  // Check cache
  const hash = computeRoutineHash(placements);
  const cached = await prisma.routineInsightCache.findUnique({
    where: { userId_type: { userId, type: 'quick' } },
  });
  if (cached && cached.routineHash === hash) {
    return cached.result as unknown as QuickInsightResult;
  }

  // Build product map for step matching
  const productMap = new Map(products.map((p) => [p.id, p]));
  const enriched = placements
    .map((pl) => ({ ...pl, product: productMap.get(pl.productId) }))
    .filter((pl) => pl.product != null) as (StepPlacement & { product: Product })[];

  let result: QuickInsightResult;
  try {
    result = await analyzeWithAI(enriched, profile);
  } catch (err) {
    console.error('AI routine insight failed, falling back to rule-based:', err);
    result = analyzeRuleBased(enriched, profile);
  }

  // Store in cache
  await prisma.routineInsightCache.upsert({
    where: { userId_type: { userId, type: 'quick' } },
    update: { routineHash: hash, result: JSON.parse(JSON.stringify(result)) },
    create: { userId, type: 'quick', routineHash: hash, result: JSON.parse(JSON.stringify(result)) },
  });

  return result;
}

// --- AI-powered analysis ---

async function analyzeWithAI(
  placements: (StepPlacement & { product: Product })[],
  profile: SkinProfile | null,
): Promise<QuickInsightResult> {
  const openai = new OpenAI({ apiKey: aiConfig.openai.apiKey });

  const placementList = placements
    .map((pl) => `- Step "${pl.stepName}": ${pl.product.name} (${pl.product.brand}) [Category: ${pl.product.category}] — Ingredients: ${pl.product.ingredients.slice(0, 8).join(', ') || 'Not listed'}`)
    .join('\n');

  const profileInfo = profile
    ? `Skin Type: ${profile.skinType || 'Unknown'}, Sensitivity: ${profile.sensitivityLevel || 'Unknown'}, Concerns: ${profile.concerns.join(', ') || 'None'}, Allergies: ${profile.allergies.join(', ') || 'None'}`
    : 'No skin profile available';

  const response = await openai.chat.completions.create(
    {
      model: aiConfig.openai.model,
      temperature: aiConfig.openai.temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'routine_insight',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              insightMessage: {
                type: 'string',
                description: 'A brief 1-2 sentence insight about product compatibility, step placement correctness, interactions, or fit. Be specific — reference product names, categories, and step names.',
              },
              compatibilityScore: {
                type: 'number',
                description: 'Overall compatibility score (0-100). Factor in: 1) Whether each product category matches its assigned step (e.g. a moisturizer in a cleanser step is a mismatch — penalize heavily). 2) Ingredient interactions. 3) Skin profile fit. A product in the wrong step type should score below 50. A product that is clearly the right type for its step (e.g. any kind of cleanser in the Cleanser step) should score 70+.',
              },
              reasons: {
                type: 'array',
                description: 'Short bullet-point reasons explaining the score (2-4 items). Each should be concise (under 10 words).',
                items: {
                  type: 'object',
                  properties: {
                    label: {
                      type: 'string',
                      description: 'Short reason text, e.g. "Right product for this step", "Contains harsh sulfates"',
                    },
                    sentiment: {
                      type: 'string',
                      enum: ['positive', 'negative', 'neutral'],
                      description: 'Whether this reason is positive, negative, or neutral',
                    },
                  },
                  required: ['label', 'sentiment'],
                  additionalProperties: false,
                },
              },
            },
            required: ['insightMessage', 'compatibilityScore', 'reasons'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: 'system',
          content: `You are a dermatologist reviewing products being placed into specific skincare routine steps. Pay close attention to whether each product's category matches the step it's assigned to.

Key rules:
- Match product types BROADLY — a "Face Wash", "Gel Cleanser", "Cleansing Foam", "Micellar Water" etc. ALL count as cleansers. A "Day Cream", "Night Cream", "Hydrating Lotion" etc. ALL count as moisturizers. Use common sense about product types; don't penalize for category label variations.
- A product placed in a genuinely WRONG step type (e.g. a moisturizer in a "Cleanser" step) should score below 50 with a clear warning.
- A product in the CORRECT step type with good ingredients for the user's skin should score 75+.
- A single correctly-placed product with no concerning ingredients should score at least 70.
- Also consider ingredient interactions between products and fit with the user's skin profile.
- Be specific in your insight — mention the product name and what step it's in.
- Provide 2-4 short reasons explaining the score.`,
        },
        {
          role: 'user',
          content: `Routine placements:\n${placementList}\n\nUser profile: ${profileInfo}`,
        },
      ],
    },
    { timeout: 15_000 },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty response for routine insight');

  return quickInsightSchema.parse(JSON.parse(content));
}

// --- Rule-based fallback ---

// Maps step names to expected product category keywords (substring-matched)
const STEP_CATEGORY_KEYWORDS: Record<string, string[]> = {
  cleanser: ['cleanser', 'cleansing', 'face wash', 'facial wash', 'micellar', 'makeup remover', 'oil cleanser', 'gel wash', 'foam wash', 'cleanse'],
  moisturizer: ['moisturizer', 'moisturising', 'moisturizing', 'cream', 'lotion', 'hydrat', 'emollient', 'day cream', 'night cream', 'face cream'],
  sunscreen: ['sunscreen', 'spf', 'sun protection', 'sun block', 'sunblock', 'uv protect', 'solar'],
  serum: ['serum', 'essence', 'ampoule', 'concentrate', 'booster', 'treatment'],
  toner: ['toner', 'toning', 'essence', 'astringent'],
  exfoliant: ['exfoliant', 'exfoliating', 'peel', 'scrub', 'aha', 'bha'],
  'eye cream': ['eye cream', 'eye treatment', 'eye gel', 'eye serum'],
  mask: ['mask', 'sheet mask', 'peel-off', 'clay mask'],
};

function isStepMismatch(stepName: string, productCategory: string): boolean {
  const normalizedStep = stepName.toLowerCase().trim();
  const keywords = STEP_CATEGORY_KEYWORDS[normalizedStep];
  if (!keywords) return false; // Unknown step, can't determine mismatch
  const normalizedCategory = productCategory.toLowerCase();
  // Match if ANY keyword is found as a substring in the category
  return !keywords.some((kw) => normalizedCategory.includes(kw));
}

const CONFLICT_PAIRS: [string, string, string][] = [
  ['retinol', 'vitamin c', 'Heads up — retinol and vitamin C can be irritating together. Consider using them at different times of day.'],
  ['retinol', 'salicylic acid', 'Be cautious — retinol and salicylic acid together can over-exfoliate. Alternate usage days if possible.'],
  ['retinol', 'glycolic acid', 'Watch out — retinol with glycolic acid may cause irritation. Best to alternate rather than layer.'],
  ['salicylic acid', 'glycolic acid', 'Double exfoliation alert — using both salicylic and glycolic acid may be too harsh for daily use.'],
];

function analyzeRuleBased(
  placements: (StepPlacement & { product: Product })[],
  profile: SkinProfile | null,
): QuickInsightResult {
  // Check for step mismatches first — this is the most important signal
  const mismatches = placements.filter((pl) => isStepMismatch(pl.stepName, pl.product.category));

  if (mismatches.length > 0) {
    const first = mismatches[0];
    const reasons = mismatches.map((m) => ({
      label: `${m.product.name} doesn't belong in ${m.stepName}`,
      sentiment: 'negative' as const,
    }));
    return {
      insightMessage: `${first.product.name} is a ${first.product.category.toLowerCase()}, but it's placed in your ${first.stepName} step. Try moving it to the right step for better results.`,
      compatibilityScore: Math.max(20, 45 - mismatches.length * 15),
      reasons,
    };
  }

  // Check ingredient conflicts
  const allIngredients = placements.flatMap((pl) => pl.product.ingredients.map((i) => i.toLowerCase()));
  for (const [a, b, message] of CONFLICT_PAIRS) {
    const hasA = allIngredients.some((i) => i.includes(a));
    const hasB = allIngredients.some((i) => i.includes(b));
    if (hasA && hasB) {
      return {
        insightMessage: message,
        compatibilityScore: 55,
        reasons: [
          { label: `${a} + ${b} may clash`, sentiment: 'negative' as const },
          { label: 'Consider alternating days', sentiment: 'neutral' as const },
        ],
      };
    }
  }

  // All products in correct steps, no conflicts
  const correctReasons = placements.map((pl) => ({
    label: `${pl.product.name} fits ${pl.stepName} step`,
    sentiment: 'positive' as const,
  }));

  if (placements.length === 1) {
    return {
      insightMessage: `${placements[0].product.name} fits well as your ${placements[0].stepName.toLowerCase()}. Add more products to see how they work together!`,
      compatibilityScore: 75,
      reasons: [
        ...correctReasons,
        { label: 'Add more products for full analysis', sentiment: 'neutral' as const },
      ],
    };
  }

  return {
    insightMessage: `Your ${placements.length} products are well-placed across your routine steps. Nice choices!`,
    compatibilityScore: 78,
    reasons: correctReasons,
  };
}

// ─── Detailed Insight (for insight screen) ──────────────────

export async function getDetailedRoutineInsight(userId: string, routineId?: string): Promise<DetailedInsightResult> {
  const where: { userId: string; type?: { in: string[] }; id?: string } = { userId };
  if (routineId) {
    // 'default' means AM+PM routines
    if (routineId === 'default') {
      where.type = { in: ['AM', 'PM'] };
    } else {
      where.id = routineId;
    }
  }
  const routines = await prisma.routine.findMany({
    where,
    include: { steps: { include: { product: true }, orderBy: { order: 'asc' } } },
  });

  const profile = await prisma.skinProfile.findUnique({ where: { userId } });

  const allSteps = routines.flatMap((r) =>
    (r.steps ?? [])
      .filter((s) => s.product)
      .map((s) => ({
        stepName: s.name,
        product: s.product!,
        routineType: r.type,
      })),
  );

  if (allSteps.length === 0) {
    return {
      compatibilityScore: 0,
      summary: 'Add products to your routine steps to get a detailed analysis.',
      categoryScores: [],
      improvements: [{ area: 'Getting Started', suggestion: 'Add products to your routine to receive personalized insights', priority: 'high' }],
      comments: ['Your routine is empty — start by adding a cleanser and moisturizer.'],
    };
  }

  // Check cache — scope key by routineId
  const cacheType = routineId ? `detailed:${routineId}` : 'detailed';
  const hash = computeRoutineHash(allSteps.map((s) => ({ stepName: s.stepName, productId: s.product.id })));
  const cached = await prisma.routineInsightCache.findUnique({
    where: { userId_type: { userId, type: cacheType } },
  });
  if (cached && cached.routineHash === hash) {
    return cached.result as unknown as DetailedInsightResult;
  }

  let result: DetailedInsightResult;
  try {
    result = await detailedAnalyzeWithAI(allSteps, profile);
  } catch (err) {
    console.error('AI detailed insight failed, falling back to rule-based:', err);
    result = detailedAnalyzeRuleBased(allSteps, profile);
  }

  // Store in cache
  await prisma.routineInsightCache.upsert({
    where: { userId_type: { userId, type: cacheType } },
    update: { routineHash: hash, result: JSON.parse(JSON.stringify(result)) },
    create: { userId, type: cacheType, routineHash: hash, result: JSON.parse(JSON.stringify(result)) },
  });

  return result;
}

async function detailedAnalyzeWithAI(
  steps: { stepName: string; product: Product; routineType: string }[],
  profile: SkinProfile | null,
): Promise<DetailedInsightResult> {
  const openai = new OpenAI({ apiKey: aiConfig.openai.apiKey });

  const stepList = steps
    .map((s) => `- [${s.routineType}] Step "${s.stepName}": ${s.product.name} (${s.product.brand}) [Category: ${s.product.category}] — Ingredients: ${s.product.ingredients.slice(0, 8).join(', ') || 'Not listed'}`)
    .join('\n');

  const profileInfo = profile
    ? `Skin Type: ${profile.skinType || 'Unknown'}, Sensitivity: ${profile.sensitivityLevel || 'Unknown'}, Concerns: ${profile.concerns.join(', ') || 'None'}, Allergies: ${profile.allergies.join(', ') || 'None'}`
    : 'No skin profile available';

  const response = await openai.chat.completions.create(
    {
      model: aiConfig.openai.model,
      temperature: aiConfig.openai.temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'detailed_routine_insight',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              compatibilityScore: {
                type: 'number',
                description: 'Overall routine compatibility score (0-100).',
              },
              summary: {
                type: 'string',
                description: 'A 2-3 sentence summary of the routine quality. Mention key strengths and weaknesses.',
              },
              categoryScores: {
                type: 'array',
                description: 'Scores for each skincare dimension (always include: Cleansing, Hydration, Protection, Treatment, Balance). Score 0 if not covered.',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string' },
                    score: { type: 'number', description: '0-100' },
                    tip: { type: 'string', description: 'One short sentence tip for this category' },
                  },
                  required: ['category', 'score', 'tip'],
                  additionalProperties: false,
                },
              },
              improvements: {
                type: 'array',
                description: '2-4 specific, actionable improvements. Be concrete.',
                items: {
                  type: 'object',
                  properties: {
                    area: { type: 'string', description: 'Short area name (e.g. "Sun Protection", "Exfoliation")' },
                    suggestion: { type: 'string', description: 'Actionable suggestion in 1-2 sentences' },
                    priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  },
                  required: ['area', 'suggestion', 'priority'],
                  additionalProperties: false,
                },
              },
              comments: {
                type: 'array',
                description: '2-3 expert dermatologist tips or observations about this routine. Short sentences.',
                items: { type: 'string' },
              },
            },
            required: ['compatibilityScore', 'summary', 'categoryScores', 'improvements', 'comments'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: 'system',
          content: `You are a board-certified dermatologist providing a detailed routine analysis. Be encouraging but honest. Match product types broadly — don't penalize for category label variations. Always include these 5 category scores: Cleansing, Hydration, Protection, Treatment, Balance. Score 0 for categories not addressed by any product.`,
        },
        {
          role: 'user',
          content: `Routine steps:\n${stepList}\n\nUser profile: ${profileInfo}`,
        },
      ],
    },
    { timeout: 20_000 },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty for detailed insight');
  return detailedInsightSchema.parse(JSON.parse(content));
}

function detailedAnalyzeRuleBased(
  steps: { stepName: string; product: Product; routineType: string }[],
  profile: SkinProfile | null,
): DetailedInsightResult {
  const hasCleanser = steps.some((s) => !isStepMismatch('cleanser', s.product.category) || s.stepName.toLowerCase().includes('cleanser'));
  const hasMoisturizer = steps.some((s) => !isStepMismatch('moisturizer', s.product.category) || s.stepName.toLowerCase().includes('moisturizer'));
  const hasSunscreen = steps.some((s) => !isStepMismatch('sunscreen', s.product.category) || s.stepName.toLowerCase().includes('sunscreen'));
  const hasSerum = steps.some((s) => !isStepMismatch('serum', s.product.category) || s.stepName.toLowerCase().includes('serum'));
  const mismatches = steps.filter((s) => isStepMismatch(s.stepName, s.product.category));

  const categoryScores = [
    { category: 'Cleansing', score: hasCleanser ? 80 : 0, tip: hasCleanser ? 'Good cleansing coverage' : 'Add a cleanser to your routine' },
    { category: 'Hydration', score: hasMoisturizer ? 75 : 0, tip: hasMoisturizer ? 'Hydration is covered' : 'A moisturizer is essential' },
    { category: 'Protection', score: hasSunscreen ? 85 : 0, tip: hasSunscreen ? 'UV protection in place' : 'Sunscreen is crucial — add SPF' },
    { category: 'Treatment', score: hasSerum ? 70 : 0, tip: hasSerum ? 'Treatment products included' : 'Consider a targeted serum' },
    { category: 'Balance', score: mismatches.length === 0 ? 75 : 40, tip: mismatches.length === 0 ? 'Products are well-matched to steps' : 'Some products are in the wrong steps' },
  ];

  const avgScore = Math.round(categoryScores.reduce((sum, c) => sum + c.score, 0) / categoryScores.length);

  const improvements: DetailedInsightResult['improvements'] = [];
  if (!hasSunscreen) improvements.push({ area: 'Sun Protection', suggestion: 'Add a broad-spectrum SPF 30+ sunscreen to your morning routine', priority: 'high' });
  if (!hasCleanser) improvements.push({ area: 'Cleansing', suggestion: 'Start with a gentle cleanser suited to your skin type', priority: 'high' });
  if (!hasMoisturizer) improvements.push({ area: 'Hydration', suggestion: 'Add a moisturizer to lock in hydration after cleansing', priority: 'medium' });
  if (mismatches.length > 0) improvements.push({ area: 'Step Placement', suggestion: `Move ${mismatches[0].product.name} to the correct step for better results`, priority: 'medium' });
  if (!hasSerum) improvements.push({ area: 'Treatment', suggestion: 'Consider adding a serum targeting your skin concerns', priority: 'low' });

  const comments: string[] = [];
  if (steps.length >= 3 && mismatches.length === 0) comments.push('Your routine has a solid foundation — keep it up!');
  if (profile?.sensitivityLevel === 'High') comments.push('With sensitive skin, patch-test new products before adding them.');
  comments.push(`You have ${steps.length} product${steps.length > 1 ? 's' : ''} in your routine.`);

  return {
    compatibilityScore: avgScore,
    summary: `Your routine covers ${categoryScores.filter((c) => c.score > 0).length} of 5 key skincare areas. ${improvements.length > 0 ? `Focus on ${improvements[0].area.toLowerCase()} for the biggest improvement.` : 'Great coverage across all areas!'}`,
    categoryScores,
    improvements: improvements.slice(0, 4),
    comments,
  };
}
