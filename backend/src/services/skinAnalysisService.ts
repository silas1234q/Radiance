import prisma from '../config/db.config';
import { analyzeWithAI, type AIAnalysisResult } from './openAIService';
import { analyzeSkinPhoto, type YouCamScanResult } from './youCamService';

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
  _raw?: AIAnalysisResult;
  _source?: string;
  _scanData?: YouCamScanResult;
}

export async function analyzeSkin(userId: string): Promise<AnalysisResult> {
  const answers = await prisma.skinQuizAnswer.findMany({
    where: { userId },
    orderBy: { questionId: 'asc' },
  });

  try {
    const aiResult = await analyzeWithAI(
      answers.map(a => ({
        questionId: a.questionId,
        questionText: a.questionText,
        answer: a.answer,
      }))
    );

    return {
      skinType: aiResult.skinType,
      sensitivityLevel: aiResult.sensitivityLevel,
      skinTone: aiResult.skinTone,
      concerns: aiResult.concerns,
      allergies: aiResult.allergies,
      skinAge: aiResult.skinAge,
      skinScore: aiResult.skinScore,
      hydration: aiResult.hydration,
      oilBalance: aiResult.oilBalance,
      texture: aiResult.texture,
      evenTone: aiResult.evenTone,
      sensitivity: aiResult.sensitivity,
      faceMapIssues: aiResult.faceMapIssues as Record<string, string[]>,
      _raw: aiResult,
      _source: 'quiz_only',
    };
  } catch (err) {
    console.error('[SkinAnalysis] AI analysis failed, falling back to rule-based:', err);
    return fallbackAnalysis(answers);
  }
}

export async function analyzeSkinWithScan(userId: string, photoUrl: string): Promise<AnalysisResult> {
  const [answers, scanData] = await Promise.all([
    prisma.skinQuizAnswer.findMany({
      where: { userId },
      orderBy: { questionId: 'asc' },
    }),
    analyzeSkinPhoto(photoUrl),
  ]);

  try {
    const aiResult = await analyzeWithAI(
      answers.map(a => ({
        questionId: a.questionId,
        questionText: a.questionText,
        answer: a.answer,
      })),
      scanData
    );

    return {
      skinType: aiResult.skinType,
      sensitivityLevel: aiResult.sensitivityLevel,
      skinTone: aiResult.skinTone,
      concerns: aiResult.concerns,
      allergies: aiResult.allergies,
      skinAge: aiResult.skinAge,
      skinScore: aiResult.skinScore,
      hydration: aiResult.hydration,
      oilBalance: aiResult.oilBalance,
      texture: aiResult.texture,
      evenTone: aiResult.evenTone,
      sensitivity: aiResult.sensitivity,
      faceMapIssues: aiResult.faceMapIssues as Record<string, string[]>,
      _raw: aiResult,
      _source: 'quiz_and_scan',
      _scanData: scanData,
    };
  } catch (err) {
    console.error('[SkinAnalysis] AI analysis with scan failed, falling back to rule-based:', err);
    return fallbackAnalysis(answers);
  }
}

// --- Original rule-based logic as fallback ---

function fallbackAnalysis(
  answers: { questionId: number; answer: string }[]
): AnalysisResult {
  const answerMap = new Map(answers.map(a => [a.questionId, a.answer]));

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

  const skinTone = answerMap.get(3) || 'Medium';

  const concernsRaw = answerMap.get(4) || '';
  const concerns = concernsRaw.split(',').map(c => c.trim()).filter(Boolean);

  const allergiesRaw = answerMap.get(20) || '';
  const allergies = allergiesRaw.split(',').map(a => a.trim()).filter(a => a && a !== 'None');

  const ageRange = answerMap.get(21) || '20-29';
  const ageMap: Record<string, number> = {
    'Under 20': 18, '20-29': 25, '30-39': 35, '40-49': 45, '50+': 55,
  };
  const skinAge = ageMap[ageRange] || 25;

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

  const clamp = (v: number) => Math.max(10, Math.min(100, v));
  hydration = clamp(hydration);
  oilBalance = clamp(oilBalance);
  texture = clamp(texture);
  evenTone = clamp(evenTone);
  sensitivityScore = clamp(sensitivityScore);

  const skinScore = Math.round(
    (hydration + oilBalance + texture + evenTone + sensitivityScore) / 5
  );

  const faceMapIssues: Record<string, string[]> = {};
  if (concerns.includes('Acne') || answerMap.get(16) === 'Yes') {
    faceMapIssues.forehead = ['Breakouts'];
    faceMapIssues.chin = ['Hormonal acne'];
  }
  if (concerns.includes('Dark spots')) {
    faceMapIssues.cheeks = [...(faceMapIssues.cheeks || []), 'Hyperpigmentation'];
  }
  if (concerns.includes('Redness')) {
    faceMapIssues.nose = ['Redness'];
    faceMapIssues.cheeks = [...(faceMapIssues.cheeks || []), 'Redness'];
  }
  if (concerns.includes('Large pores')) {
    faceMapIssues.nose = [...(faceMapIssues.nose || []), 'Enlarged pores'];
  }
  if (answerMap.get(23) === 'Yes') {
    faceMapIssues.eyes = ['Dark circles'];
  }
  if (concerns.includes('Wrinkles')) {
    faceMapIssues.forehead = [...(faceMapIssues.forehead || []), 'Fine lines'];
    faceMapIssues.eyes = [...(faceMapIssues.eyes || []), "Crow's feet"];
  }

  return {
    skinType, sensitivityLevel, skinTone, concerns, allergies,
    skinAge, skinScore, hydration, oilBalance, texture, evenTone,
    sensitivity: sensitivityScore, faceMapIssues,
    _source: 'rule_based',
  };
}
