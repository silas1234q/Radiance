import prisma from '../config/db.config';
import {
  analyzeWithAI,
  type FullAnalysisResult,
  type QuizOnlyServiceResult,
  type ScanMetricExplanations,
  type SensitivityLevel,
  type SkincarePriority,
} from './openAIService';
import { analyzeSkinPhoto, type YouCamScanResult } from './youCamService';

export type AnalysisSource = 'quiz_and_scan' | 'rule_based';

export interface AnalysisResult {
  skinType: string;
  sensitivityLevel: string;
  skinTone: string;
  concerns: string[];
  allergies: string[];
  skinAge: number;
  skinScore: number;
  hydration: number;
  oilBalance: number;
  texture: number;
  evenTone: number;
  sensitivity: number;
  faceMapIssues: Record<string, string[]>;
  /** Present for AI results; absent for the rule-based fallback. */
  summary?: string;
  scanMetricExplanations?: ScanMetricExplanations | null;
  _raw?: FullAnalysisResult;
  _source: AnalysisSource;
  _scanData?: YouCamScanResult;
}

interface StoredAnswer {
  questionId: number;
  questionText: string;
  answer: string;
}

// --- Quiz-only analysis ---

export async function analyzeSkin(userId: string): Promise<QuizOnlyServiceResult> {
  const answers = await loadAnswers(userId);

  try {
    const aiResult = await analyzeWithAI(answers);
    return { ...aiResult, _source: 'quiz_only' };
  } catch (err) {
    console.error('[SkinAnalysis] Quiz-only AI analysis failed:', err);
    return fallbackQuizOnlyAnalysis(answers);
  }
}

// --- Quiz + scan analysis ---

export async function analyzeSkinWithScan(
  userId: string,
  photoUrl: string,
): Promise<AnalysisResult> {
  const [answers, scanData] = await Promise.all([
    loadAnswers(userId),
    analyzeSkinPhoto(photoUrl),
  ]);

  try {
    const ai = await analyzeWithAI(answers, scanData);

    return {
      skinType: ai.skinType,
      sensitivityLevel: ai.sensitivityLevel,
      skinTone: ai.skinTone,
      concerns: ai.concerns,
      allergies: ai.allergies,
      skinAge: ai.skinAge,
      skinScore: ai.skinScore,
      hydration: ai.hydration,
      oilBalance: ai.oilBalance,
      texture: ai.texture,
      evenTone: ai.evenTone,
      sensitivity: ai.sensitivity,
      faceMapIssues: ai.faceMapIssues,
      summary: ai.summary,
      scanMetricExplanations: ai.scanMetricExplanations ?? null,
      _raw: ai,
      _source: 'quiz_and_scan',
      _scanData: scanData,
    };
  } catch (err) {
    console.error(
      '[SkinAnalysis] AI analysis with scan failed, falling back to rule-based:',
      err,
    );
    return { ...fallbackAnalysis(answers), _scanData: scanData };
  }
}

// --- Shared helpers ---

async function loadAnswers(userId: string): Promise<StoredAnswer[]> {
  const rows = await prisma.skinQuizAnswer.findMany({
    where: { userId },
    orderBy: { questionId: 'asc' },
  });
  return rows.map((a) => ({
    questionId: a.questionId,
    questionText: a.questionText,
    answer: a.answer,
  }));
}

interface BaseProfile {
  answerMap: Map<number, string>;
  skinType: string;
  sensitivityLevel: string;
  skinTone: string;
  concerns: string[];
  allergies: string[];
}

function splitList(raw: string, ignore: string[] = []): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !ignore.includes(s));
}

function extractBaseProfile(answers: Pick<StoredAnswer, 'questionId' | 'answer'>[]): BaseProfile {
  const answerMap = new Map<number, string>(answers.map((a) => [a.questionId, a.answer]));

  let skinType = answerMap.get(1) || 'Normal';
  if (skinType === 'Not sure') {
    const tight = answerMap.get(17) === 'Yes';
    const oily = answerMap.get(18) === 'Yes';
    if (tight && !oily) skinType = 'Dry';
    else if (!tight && oily) skinType = 'Oily';
    else if (tight && oily) skinType = 'Combination';
    else skinType = 'Normal';
  }

  const sensitivityAnswer = answerMap.get(2) || 'Not sure';
  const reactivity = answerMap.get(22) || 'Usually fine';
  let sensitivityLevel = sensitivityAnswer;
  if (sensitivityAnswer === 'Not sure') {
    sensitivityLevel =
      reactivity === 'Very reactive' || reactivity === 'Often breaks out'
        ? 'Very sensitive'
        : reactivity === 'Sometimes irritated'
          ? 'Somewhat sensitive'
          : 'Not sensitive';
  }

  return {
    answerMap,
    skinType,
    sensitivityLevel,
    skinTone: answerMap.get(3) || 'Medium',
    concerns: splitList(answerMap.get(4) || ''),
    allergies: splitList(answerMap.get(20) || '', ['None']),
  };
}

function toSensitivityEnum(level: string): SensitivityLevel {
  const l = level.toLowerCase();
  if (l.includes('very')) return 'Very sensitive';
  if (l.includes('somewhat')) return 'Somewhat sensitive';
  return 'Not sensitive';
}

// --- Rule-based fallbacks ---

function fallbackQuizOnlyAnalysis(
  answers: Pick<StoredAnswer, 'questionId' | 'answer'>[],
): QuizOnlyServiceResult {
  const { skinType, sensitivityLevel, concerns, allergies } = extractBaseProfile(answers);
  const sensitivity = toSensitivityEnum(sensitivityLevel);

  const concernText = concerns.length
    ? `Your main concerns are ${concerns.join(', ').toLowerCase()}.`
    : 'You did not report any specific concerns.';

  const priorities: [SkincarePriority, SkincarePriority, SkincarePriority] = [
    {
      title: 'Keep your basics consistent',
      advice: `Use a gentle cleanser and a moisturizer suited to ${skinType.toLowerCase()} skin, morning and night.`,
    },
    {
      title: 'Protect with daily sunscreen',
      advice:
        'Apply a broad-spectrum SPF 30+ every morning to protect your skin and help any marks fade.',
    },
    {
      title: sensitivity === 'Not sensitive' ? 'Introduce actives gradually' : 'Go slowly with new products',
      advice:
        sensitivity === 'Not sensitive'
          ? 'Add one targeted product at a time for your concerns and give it a few weeks before adding another.'
          : 'Patch test new products and introduce them one at a time to avoid irritating your skin.',
    },
  ];

  return {
    skinType,
    sensitivityLevel: sensitivity,
    concerns,
    allergies,
    summary: `Based on your answers, your skin appears to be ${skinType.toLowerCase()} and ${sensitivity.toLowerCase()}. ${concernText}`,
    skincarePriorities: priorities,
    _source: 'rule_based',
  };
}

function fallbackAnalysis(
  answers: Pick<StoredAnswer, 'questionId' | 'answer'>[],
): AnalysisResult & { _source: 'rule_based' } {
  const { answerMap, skinType, sensitivityLevel, skinTone, concerns, allergies } =
    extractBaseProfile(answers);

  const ageMap: Record<string, number> = {
    'Under 20': 18, '20-29': 25, '30-39': 35, '40-49': 45, '50+': 55,
  };
  const skinAge = ageMap[answerMap.get(21) || '20-29'] ?? 25;

  let hydration = 70;
  let oilBalance = 70;
  let texture = 75;
  let evenTone = 70;
  let sensitivityScore = 75;

  if (skinType === 'Dry') { hydration -= 25; oilBalance += 10; }
  if (skinType === 'Oily') { hydration += 10; oilBalance -= 25; }
  if (skinType === 'Combination') { oilBalance -= 15; }

  const water = answerMap.get(8) || '';
  if (water === 'Less than 4 glasses') hydration -= 15;
  if (water === 'More than 8 glasses') hydration += 10;

  const sleep = answerMap.get(10) || '';
  if (sleep === 'Less than 5') { texture -= 10; hydration -= 5; }
  if (sleep === '7-8' || sleep === 'More than 8') { texture += 5; }

  const stress = answerMap.get(11) || '';
  if (stress === 'High' || stress === 'Very high') { texture -= 10; oilBalance -= 10; }

  if (answerMap.get(7) !== 'Yes') { evenTone -= 15; }
  if (answerMap.get(16) === 'Yes') { texture -= 10; }
  if (answerMap.get(12) === 'Yes') { texture -= 15; evenTone -= 10; hydration -= 10; }

  if (sensitivityLevel === 'Very sensitive') sensitivityScore -= 30;
  if (sensitivityLevel === 'Somewhat sensitive') sensitivityScore -= 15;

  if (concerns.includes('Dark spots')) evenTone -= 10;
  if (concerns.includes('Redness')) sensitivityScore -= 10;
  if (concerns.includes('Uneven texture')) texture -= 10;
  if (concerns.includes('Dryness')) hydration -= 10;
  if (concerns.includes('Oiliness')) oilBalance -= 10;

  const clamp = (v: number): number => Math.max(10, Math.min(100, v));
  hydration = clamp(hydration);
  oilBalance = clamp(oilBalance);
  texture = clamp(texture);
  evenTone = clamp(evenTone);
  sensitivityScore = clamp(sensitivityScore);

  const skinScore = Math.round(
    (hydration + oilBalance + texture + evenTone + sensitivityScore) / 5,
  );

  const faceMapIssues: Record<string, string[]> = {};
  const addIssue = (zone: string, issue: string): void => {
    (faceMapIssues[zone] ??= []).push(issue);
  };

  if (concerns.includes('Acne') || answerMap.get(16) === 'Yes') {
    addIssue('forehead', 'Breakouts');
    addIssue('chin', 'Hormonal acne');
  }
  if (concerns.includes('Dark spots')) addIssue('cheeks', 'Hyperpigmentation');
  if (concerns.includes('Redness')) {
    addIssue('nose', 'Redness');
    addIssue('cheeks', 'Redness');
  }
  if (concerns.includes('Large pores')) addIssue('nose', 'Enlarged pores');
  if (answerMap.get(23) === 'Yes') addIssue('eyes', 'Dark circles');
  if (concerns.includes('Wrinkles')) {
    addIssue('forehead', 'Fine lines');
    addIssue('eyes', "Crow's feet");
  }

  return {
    skinType,
    sensitivityLevel,
    skinTone,
    concerns,
    allergies,
    skinAge,
    skinScore,
    hydration,
    oilBalance,
    texture,
    evenTone,
    sensitivity: sensitivityScore,
    faceMapIssues,
    _source: 'rule_based',
  };
}