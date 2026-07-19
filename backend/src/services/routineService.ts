import prisma from '../config/db.config';
import { searchProducts } from './openBeautyFactsService';
import { generateRoutinesWithAI } from './openAIService';

interface StepData {
  order: number;
  name: string;
  description: string;
  productId?: string | null;
  aiRationale?: string | null;
}

export async function generateRoutines(userId: string): Promise<void> {
  const profile = await prisma.skinProfile.findUnique({ where: { userId } });
  if (!profile) return;

  const skinType = profile.skinType || 'Normal';
  const concerns = profile.concerns || [];

  try {
    // Fetch products from OBF + seeded for relevant categories
    const searchTerms = [skinType, ...concerns.slice(0, 3), 'cleanser', 'moisturizer', 'sunscreen'];
    const productResults = await Promise.all(
      searchTerms.map(term => searchProducts(term, 5))
    );
    const allProducts = [...new Map(
      productResults.flat().map(p => [p.id, p])
    ).values()].slice(0, 15);

    const aiRoutines = await generateRoutinesWithAI(
      {
        skinType: profile.skinType,
        sensitivityLevel: profile.sensitivityLevel,
        concerns: profile.concerns,
        allergies: profile.allergies,
      },
      allProducts.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        ingredients: (p.ingredients || []).slice(0, 3),
      }))
    );

    for (const type of ['AM', 'PM'] as const) {
      const steps: StepData[] = (type === 'AM' ? aiRoutines.am : aiRoutines.pm).map(s => ({
        order: s.order,
        name: s.name,
        description: s.description,
        productId: s.productId,
        aiRationale: s.rationale,
      }));

      const existing = await prisma.routine.findFirst({
        where: { userId, type, name: null },
      });
      if (existing) {
        await prisma.routine.update({
          where: { id: existing.id },
          data: { steps: { deleteMany: {}, create: steps } },
        });
      } else {
        await prisma.routine.create({
          data: { userId, type, steps: { create: steps } },
        });
      }
    }
  } catch (err) {
    console.error('[RoutineService] AI routine generation failed, falling back:', err);
    await fallbackGenerateRoutines(userId, skinType, concerns);
  }
}

// --- Original hardcoded logic as fallback ---

function generateSteps(skinType: string, concerns: string[], type: 'AM' | 'PM'): StepData[] {
  if (type === 'AM') {
    const steps: StepData[] = [
      { order: 1, name: 'Cleanser', description: skinType === 'Oily' ? 'Gel or foam cleanser' : skinType === 'Dry' ? 'Cream or milk cleanser' : 'Gentle gel cleanser' },
      { order: 2, name: 'Toner', description: 'Hydrating toner to balance pH' },
    ];

    if (concerns.includes('Dark spots') || concerns.includes('Uneven texture')) {
      steps.push({ order: 3, name: 'Vitamin C Serum', description: 'Brightening antioxidant protection' });
    } else if (concerns.includes('Acne')) {
      steps.push({ order: 3, name: 'Niacinamide Serum', description: 'Reduces inflammation and pore size' });
    } else {
      steps.push({ order: 3, name: 'Hyaluronic Acid Serum', description: 'Deep hydration booster' });
    }

    steps.push({ order: 4, name: 'Moisturizer', description: skinType === 'Oily' ? 'Lightweight gel moisturizer' : 'Rich hydrating moisturizer' });
    steps.push({ order: 5, name: 'Sunscreen SPF 50', description: 'Broad spectrum UV protection' });

    return steps;
  }

  const steps: StepData[] = [
    { order: 1, name: 'Oil Cleanser', description: 'Remove sunscreen and makeup' },
    { order: 2, name: 'Water Cleanser', description: skinType === 'Oily' ? 'Salicylic acid cleanser' : 'Gentle hydrating cleanser' },
    { order: 3, name: 'Toner', description: 'Prep skin for treatments' },
  ];

  if (concerns.includes('Wrinkles') || concerns.includes('Fine lines')) {
    steps.push({ order: 4, name: 'Retinol', description: 'Anti-aging cell turnover (start low)' });
  } else if (concerns.includes('Acne')) {
    steps.push({ order: 4, name: 'BHA Exfoliant', description: 'Salicylic acid for pore clearing' });
  } else if (concerns.includes('Dark spots')) {
    steps.push({ order: 4, name: 'Alpha Arbutin', description: 'Brightening dark spot treatment' });
  } else {
    steps.push({ order: 4, name: 'Peptide Serum', description: 'Skin repair and strengthening' });
  }

  steps.push({ order: 5, name: 'Eye Cream', description: 'Target dark circles and fine lines' });
  steps.push({ order: 6, name: 'Night Moisturizer', description: skinType === 'Dry' ? 'Rich overnight repair cream' : 'Nourishing night cream' });

  return steps;
}

async function fallbackGenerateRoutines(userId: string, skinType: string, concerns: string[]): Promise<void> {
  for (const type of ['AM', 'PM'] as const) {
    const steps = generateSteps(skinType, concerns, type);

    const existing = await prisma.routine.findFirst({
      where: { userId, type, name: null },
    });
    if (existing) {
      await prisma.routine.update({
        where: { id: existing.id },
        data: { steps: { deleteMany: {}, create: steps } },
      });
    } else {
      await prisma.routine.create({
        data: { userId, type, steps: { create: steps } },
      });
    }
  }
}
