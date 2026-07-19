import OpenAI from "openai";
import { z } from "zod";
import aiConfig from "../config/ai.config";
import type { YouCamScanResult } from "./youCamService";

const openai = new OpenAI({ apiKey: aiConfig.openai.apiKey });

// --- Zod schemas for structured output validation ---

const scanMetricExplanationsSchema = z.object({
  acne: z.string(),
  wrinkle: z.string(),
  ageSpot: z.string(),
  redness: z.string(),
  pore: z.string(),
  oiliness: z.string(),
  texture: z.string(),
  moisture: z.string(),
});

const analysisSchema = z.object({
  skinType: z.string(),
  sensitivityLevel: z.string(),
  skinTone: z.string(),
  concerns: z.array(z.string()),
  allergies: z.array(z.string()),
  skinAge: z.number().int().min(10).max(80),
  skinScore: z.number().int().min(0).max(100),
  hydration: z.number().int().min(0).max(100),
  oilBalance: z.number().int().min(0).max(100),
  texture: z.number().int().min(0).max(100),
  evenTone: z.number().int().min(0).max(100),
  sensitivity: z.number().int().min(0).max(100),
  faceMapIssues: z.record(z.string(), z.array(z.string())),
  summary: z.string(),
  scanMetricExplanations: scanMetricExplanationsSchema.nullable().optional(),
});

const routineStepSchema = z.object({
  order: z.number().int(),
  name: z.string(),
  description: z.string(),
  productId: z.string().nullable(),
  rationale: z.string(),
});

const routinesSchema = z.object({
  am: z.array(routineStepSchema),
  pm: z.array(routineStepSchema),
});

export type AIAnalysisResult = z.infer<typeof analysisSchema>;
export type AIRoutinesResult = z.infer<typeof routinesSchema>;

// --- Analysis ---

interface QuizAnswer {
  questionId: number;
  questionText: string;
  answer: string;
}

export async function analyzeWithAI(
  quizAnswers: QuizAnswer[],
  scanData?: YouCamScanResult,
): Promise<AIAnalysisResult> {
  const formattedAnswers = quizAnswers
    .map((a) => `Q${a.questionId}. ${a.questionText}\nA: ${a.answer}`)
    .join("\n\n");

  let userContent = `Here are the user's skin quiz answers:\n\n${formattedAnswers}`;
  if (scanData) {
    userContent += `\n\nSkin scan results:\n${JSON.stringify(scanData, null, 2)}`;
  }

  const response = await openai.chat.completions.create(
    {
      model: aiConfig.openai.model,
      temperature: aiConfig.openai.temperature,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "skin_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              skinType: {
                type: "string",
                description: "e.g. Oily, Dry, Combination, Normal, Sensitive",
              },
              sensitivityLevel: {
                type: "string",
                description:
                  "e.g. Very sensitive, Somewhat sensitive, Not sensitive",
              },
              skinTone: {
                type: "string",
                description:
                  "e.g. Very fair, Fair, Medium, Olive, Brown, Dark brown",
              },
              concerns: {
                type: "array",
                items: { type: "string" },
                description: "List of skin concerns",
              },
              allergies: {
                type: "array",
                items: { type: "string" },
                description: "Known ingredient allergies",
              },
              skinAge: {
                type: "number",
                description: "Estimated skin age (10-80)",
              },
              skinScore: {
                type: "number",
                description: "Overall skin health score 0-100",
              },
              hydration: {
                type: "number",
                description: "Hydration level 0-100",
              },
              oilBalance: {
                type: "number",
                description: "Oil balance 0-100 (100=perfectly balanced)",
              },
              texture: {
                type: "number",
                description: "Skin texture quality 0-100",
              },
              evenTone: {
                type: "number",
                description: "Skin tone evenness 0-100",
              },
              sensitivity: {
                type: "number",
                description: "Sensitivity score 0-100 (100=not sensitive)",
              },
              faceMapIssues: {
                type: "object",
                description:
                  "Map of face zones to issues. Use empty arrays for zones with no issues.",
                properties: {
                  forehead: { type: "array", items: { type: "string" } },
                  cheeks: { type: "array", items: { type: "string" } },
                  nose: { type: "array", items: { type: "string" } },
                  chin: { type: "array", items: { type: "string" } },
                  eyes: { type: "array", items: { type: "string" } },
                  jawline: { type: "array", items: { type: "string" } },
                },
                required: [
                  "forehead",
                  "cheeks",
                  "nose",
                  "chin",
                  "eyes",
                  "jawline",
                ],
                additionalProperties: false,
              },
              summary: {
                type: "string",
                description: "2-3 sentence plain-language skin summary",
              },
              scanMetricExplanations: {
                type: ["object", "null"],
                description:
                  "When scan data is provided, brief 1-2 sentence explanations for each scan metric. Set to null when no scan data is provided.",
                properties: {
                  acne: { type: "string", description: "Explanation of the acne score" },
                  wrinkle: { type: "string", description: "Explanation of the wrinkle score" },
                  ageSpot: { type: "string", description: "Explanation of the age spot score" },
                  redness: { type: "string", description: "Explanation of the redness score" },
                  pore: { type: "string", description: "Explanation of the pore score" },
                  oiliness: { type: "string", description: "Explanation of the oiliness score" },
                  texture: { type: "string", description: "Explanation of the texture score" },
                  moisture: { type: "string", description: "Explanation of the moisture score" },
                },
                required: ["acne", "wrinkle", "ageSpot", "redness", "pore", "oiliness", "texture", "moisture"],
                additionalProperties: false,
              },
            },
            required: [
              "skinType",
              "sensitivityLevel",
              "skinTone",
              "concerns",
              "allergies",
              "skinAge",
              "skinScore",
              "hydration",
              "oilBalance",
              "texture",
              "evenTone",
              "sensitivity",
              "faceMapIssues",
              "summary",
              "scanMetricExplanations",
            ],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `You are a board-certified dermatologist AI assistant. Analyze the user's skin quiz answers to produce a comprehensive, evidence-based skin assessment.

Be conservative with scoring (0-100 scale). Most people should score between 40-80. Only give very high scores (85+) if answers strongly indicate excellent skin health.

For faceMapIssues, only include zones that have actual issues based on the answers. Common zones: forehead, cheeks, nose, chin, eyes, jawline.

For concerns, use these standard labels when applicable: Acne, Dark spots, Redness, Uneven texture, Large pores, Wrinkles, Fine lines, Dryness, Oiliness, Scarring, Dark circles.

For sensitivityLevel, use: "Very sensitive", "Somewhat sensitive", or "Not sensitive".

If skin scan results are provided, generate scanMetricExplanations — a brief 1-2 sentence personalized explanation for each of the 8 scan metrics (acne, wrinkle, ageSpot, redness, pore, oiliness, texture, moisture). Explain what the score means for this specific user's skin and any relevant context. If no scan data is provided, set scanMetricExplanations to null.`,
        },
        { role: "user", content: userContent },
      ],
    },
    { timeout: 30_000 },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response");

  const parsed = JSON.parse(content);
  return analysisSchema.parse(parsed);
}

// --- Ingredient OCR ---

export async function extractIngredientsFromImage(imageUrl: string): Promise<string[]> {
  const response = await openai.chat.completions.create(
    {
      model: 'gpt-4o-mini',
      temperature: 0.1,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ingredient_extraction',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              ingredients: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of ingredient names extracted from the label',
              },
            },
            required: ['ingredients'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'You are an ingredient label reader. Extract all ingredient names from the product label image. Return them as a JSON object with an "ingredients" array of strings. Each string should be a single ingredient name, cleaned up and properly capitalized. If you cannot read the ingredients, return an empty array.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: 'Extract all ingredients from this product label image.',
            },
          ],
        },
      ],
    },
    { timeout: 30_000 },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  const parsed = JSON.parse(content);
  const result = z.object({ ingredients: z.array(z.string()) }).parse(parsed);
  return result.ingredients;
}

// --- Weekly Plan Generation ---

const weeklyPlanMilestoneSchema = z.object({
  week: z.string(),
  title: z.string(),
  description: z.string(),
});

const weeklyPlanSchema = z.object({
  milestones: z.array(weeklyPlanMilestoneSchema).length(5),
});

export type AIWeeklyPlanResult = z.infer<typeof weeklyPlanSchema>;

interface WeeklyPlanInput {
  concerns: string[];
  skinType: string | null;
  sensitivityLevel: string | null;
  skinScore: number | null;
}

export async function generateWeeklyPlanWithAI(
  input: WeeklyPlanInput,
): Promise<AIWeeklyPlanResult> {
  const response = await openai.chat.completions.create(
    {
      model: aiConfig.openai.model,
      temperature: aiConfig.openai.temperature,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "weekly_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              milestones: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    week: {
                      type: "string",
                      description:
                        'Week label, e.g. "Week 1", "Week 2", ... "Week 5+"',
                    },
                    title: {
                      type: "string",
                      description: "Short title for this week\'s focus",
                    },
                    description: {
                      type: "string",
                      description:
                        "1-2 sentence description of expected progress",
                    },
                  },
                  required: ["week", "title", "description"],
                  additionalProperties: false,
                },
              },
            },
            required: ["milestones"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `You are a board-certified dermatologist creating a progressive 5-week skincare roadmap. The plan must address ALL of the user's concerns holistically — do not focus on just one concern per week. Each week should build on the previous one, showing realistic progression. Use week labels: "Week 1", "Week 2", "Week 3", "Week 4", "Week 5+". Keep titles concise and descriptions encouraging but realistic.`,
        },
        {
          role: "user",
          content: `Create a personalized 5-week skincare plan for this user:
- Skin Type: ${input.skinType || "Normal"}
- Sensitivity: ${input.sensitivityLevel || "Not sensitive"}
- Concerns: ${input.concerns.join(", ") || "General skin health"}
- Current Skin Score: ${input.skinScore ?? "Not assessed"}`,
        },
      ],
    },
    { timeout: 30_000 },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response for weekly plan");

  const parsed = JSON.parse(content);
  return weeklyPlanSchema.parse(parsed);
}

// --- Routine Generation ---

interface SkinProfileData {
  skinType: string | null;
  sensitivityLevel: string | null;
  concerns: string[];
  allergies: string[];
}

interface ProductData {
  id: string;
  name: string;
  brand: string;
  category: string;
  ingredients: string[];
}

export async function generateRoutinesWithAI(
  profile: SkinProfileData,
  products: ProductData[],
): Promise<AIRoutinesResult> {
  const productList = products
    .map(
      (p) =>
        `- ID: ${p.id} | ${p.name} (${p.brand}) | Category: ${p.category} | Key ingredients: ${p.ingredients.slice(0, 5).join(", ")}`,
    )
    .join("\n");

  const response = await openai.chat.completions.create(
    {
      model: aiConfig.openai.model,
      temperature: aiConfig.openai.temperature,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "skincare_routines",
          strict: true,
          schema: {
            type: "object",
            properties: {
              am: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    order: { type: "number" },
                    name: {
                      type: "string",
                      description: "Step name (e.g. Cleanser, Serum)",
                    },
                    description: {
                      type: "string",
                      description: "Brief instruction for this step",
                    },
                    productId: {
                      type: ["string", "null"],
                      description:
                        "Product ID from the provided list, or null if no match",
                    },
                    rationale: {
                      type: "string",
                      description: "Why this step is recommended",
                    },
                  },
                  required: [
                    "order",
                    "name",
                    "description",
                    "productId",
                    "rationale",
                  ],
                  additionalProperties: false,
                },
              },
              pm: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    order: { type: "number" },
                    name: { type: "string", description: "Step name" },
                    description: {
                      type: "string",
                      description: "Brief instruction for this step",
                    },
                    productId: {
                      type: ["string", "null"],
                      description:
                        "Product ID from the provided list, or null if no match",
                    },
                    rationale: {
                      type: "string",
                      description: "Why this step is recommended",
                    },
                  },
                  required: [
                    "order",
                    "name",
                    "description",
                    "productId",
                    "rationale",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["am", "pm"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `You are a skincare routine formulation expert. Create personalized AM and PM routines based on the user's skin profile. Consider ingredient interactions and layering order.

Rules:
- AM routine: always end with sunscreen
- PM routine: double cleanse if needed, treatments before moisturizer
- Only use productId values from the provided product list. If no suitable product exists, set productId to null.
- Each routine should have 4-7 steps
- Order steps by application sequence (thinnest to thickest consistency)
- Provide a brief rationale for each step`,
        },
        {
          role: "user",
          content: `Skin Profile:
- Skin Type: ${profile.skinType || "Normal"}
- Sensitivity: ${profile.sensitivityLevel || "Not sensitive"}
- Concerns: ${profile.concerns.join(", ") || "None specified"}
- Allergies: ${profile.allergies.join(", ") || "None"}

Available Products:
${productList || "No specific products available. Recommend generic step names with productId: null."}`,
        },
      ],
    },
    { timeout: 30_000 },
  );

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response for routines");

  const parsed = JSON.parse(content);
  const result = routinesSchema.parse(parsed);

  // Validate productIds against provided list
  const validIds = new Set(products.map((p) => p.id));
  for (const step of [...result.am, ...result.pm]) {
    if (step.productId && !validIds.has(step.productId)) {
      step.productId = null;
    }
  }

  return result;
}
