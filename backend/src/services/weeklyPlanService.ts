import prisma from "../config/db.config";
import { generateWeeklyPlanWithAI } from "./openAIService";

interface WeekMilestone {
  week: string;
  title: string;
  description: string;
}

// --- Rule-based fallback (ported from frontend getWeeklyPlan) ---

function generateRuleBasedPlan(concerns: string[]): WeekMilestone[] {
  const c = concerns.map((s) => s.toLowerCase());

  const hasAcne = c.some((x) => x.includes("acne"));
  const hasTexture = c.some((x) => x.includes("texture"));
  const hasLines = c.some(
    (x) => x.includes("fine lines") || x.includes("wrinkles"),
  );
  const hasDarkSpots = c.some(
    (x) => x.includes("dark spots") || x.includes("uneven tone"),
  );
  const hasDryness = c.some((x) => x.includes("dryness"));
  const hasDullness = c.some((x) => x.includes("dullness"));
  const hasOiliness = c.some((x) => x.includes("oiliness"));
  const hasRedness = c.some((x) => x.includes("redness"));
  const hasPores = c.some((x) => x.includes("large pores"));
  const hasScarring = c.some((x) => x.includes("scarring"));

  return [
    {
      week: "Week 1",
      title: hasAcne
        ? "Calming inflammation & cleansing"
        : hasDryness
          ? "Hydration and skin barrier support"
          : hasRedness
            ? "Soothing irritation & redness"
            : "Hydration and skin barrier support",
      description: hasAcne
        ? "Active breakouts start to calm as your routine reduces bacteria and excess oil"
        : hasDryness
          ? "Skin feels smoother with reduced tightness and dryness"
          : hasRedness
            ? "Skin feels less reactive as the barrier begins to strengthen"
            : "Skin feels smoother with reduced tightness and dryness",
    },
    {
      week: "Week 2",
      title: hasLines
        ? "Reducing the appearance of fine lines"
        : hasAcne
          ? "Fewer new breakouts"
          : hasDarkSpots
            ? "Targeting pigmentation"
            : "Improving skin clarity",
      description: hasLines
        ? "Fine lines look softer and early dark spots begin to fade"
        : hasAcne
          ? "Breakout frequency decreases and existing spots begin to heal"
          : hasDarkSpots
            ? "Dark spots start to lighten as cell turnover increases"
            : "Skin starts to look clearer and more balanced day to day",
    },
    {
      week: "Week 3",
      title:
        hasTexture || hasPores
          ? "More even tone & refined texture"
          : hasDullness
            ? "Visible radiance returning"
            : hasScarring
              ? "Scar appearance softening"
              : "More even tone & refined texture",
      description:
        hasTexture || hasPores
          ? "A healthy glow develops as tone and hydration improve"
          : hasDullness
            ? "Skin looks brighter and more luminous with improved cell renewal"
            : hasScarring
              ? "Post-acne marks and scarring become less prominent"
              : "A healthy glow develops as tone and hydration improve",
    },
    {
      week: "Week 4",
      title: hasOiliness
        ? "Balanced oil production"
        : hasDryness
          ? "Healthy, well-hydrated glow"
          : hasAcne
            ? "Clearer, calmer complexion"
            : "Healthy, well-hydrated glow",
      description: hasOiliness
        ? "Sebum levels normalize and skin feels comfortable throughout the day"
        : hasDryness
          ? "Dullness is reduced and skin looks smoother and more radiant"
          : hasAcne
            ? "Skin is noticeably clearer with fewer marks and less inflammation"
            : "Dullness is reduced and skin looks smoother and more radiant",
    },
    {
      week: "Week 5+",
      title: hasLines
        ? "Ongoing maintenance and smoother texture"
        : hasAcne
          ? "Long-term clarity & prevention"
          : "Ongoing maintenance and smoother texture",
      description: hasLines
        ? "Skin stays smooth and even, with continued improvement in firmness"
        : hasAcne
          ? "Consistent routine keeps breakouts at bay and supports scar healing"
          : "Skin stays smooth and even, with continued improvement over time",
    },
  ];
}

// --- Main service functions ---

export async function generateWeeklyPlan(userId: string): Promise<{
  milestones: WeekMilestone[];
  source: string;
}> {
  const profile = await prisma.skinProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return { milestones: generateRuleBasedPlan([]), source: "rule-based" };
  }

  // Try AI first
  try {
    const result = await generateWeeklyPlanWithAI({
      concerns: profile.concerns,
      skinType: profile.skinType,
      sensitivityLevel: profile.sensitivityLevel,
      skinScore: profile.skinScore,
    });

    await prisma.skinProfile.update({
      where: { userId },
      data: {
        weeklyPlan: result.milestones as any,
        weeklyPlanSource: "ai",
      },
    });

    return { milestones: result.milestones, source: "ai" };
  } catch (err) {
    console.error("AI weekly plan failed, using rule-based fallback:", err);

    const milestones = generateRuleBasedPlan(profile.concerns);

    await prisma.skinProfile.update({
      where: { userId },
      data: {
        weeklyPlan: milestones as any,
        weeklyPlanSource: "rule-based",
      },
    });

    return { milestones, source: "rule-based" };
  }
}

export async function getOrGenerateWeeklyPlan(userId: string): Promise<{
  milestones: WeekMilestone[];
  source: string;
}> {
  const profile = await prisma.skinProfile.findUnique({
    where: { userId },
    select: { weeklyPlan: true, weeklyPlanSource: true, concerns: true },
  });

  if (profile?.weeklyPlan && profile.weeklyPlanSource) {
    return {
      milestones: profile.weeklyPlan as unknown as WeekMilestone[],
      source: profile.weeklyPlanSource,
    };
  }

  return generateWeeklyPlan(userId);
}
