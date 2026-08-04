// ── Shared API response types ──
// These mirror the shapes returned by the backend controllers.

// ── User ──
export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  skinProfile?: SkinProfile | null;
}

// ── Skin Profile ──
export interface SkinProfile {
  id: string;
  userId: string;
  skinType: string | null;
  sensitivityLevel: string | null;
  skinTone: string | null;
  concerns: string[];
  allergies: string[];
  skinAge: number | null;
  skinScore: number | null;
  hydration: number | null;
  oilBalance: number | null;
  texture: number | null;
  evenTone: number | null;
  sensitivity: number | null;
  faceMapIssues: Record<string, string[]> | null;
  aiAnalysisRaw: unknown;
  scanData: unknown;
  analysisSource: string | null;
  photoUrl: string | null;
  baselinePhotoUrl: string | null;
  routineLength: string | null;
  productBudget: string | null;
  ingredientsToAvoid: string[];
  faceScanWeekStart: string | null;
  faceScanCountThisWeek: number;
  lastFaceScanAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Product ──
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  description: string | null;
  ingredients: string[];
  barcode: string | null;
  sourceUrl: string | null;
  source: string;
  createdAt: string;
}

// ── Product Analysis ──
export interface IngredientFlag {
  name: string;
  safe: boolean;
}

export interface ProductAnalysis {
  fitScore: number;
  pros: string[];
  cons: string[];
  ingredientFlags: IngredientFlag[];
}

export interface ProductWithAnalysis {
  product: Product;
  analysis: ProductAnalysis | null;
}

// ── Routine ──
export type RoutineType = 'AM' | 'PM' | 'CUSTOM';

export interface RoutineStep {
  id: string;
  routineId: string;
  order: number;
  name: string;
  description: string | null;
  productId: string | null;
  product: Pick<Product, 'id' | 'name' | 'brand' | 'imageUrl' | 'category'> | null;
  isCompleted: boolean;
  completedAt: string | null;
  aiRationale: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Routine {
  id: string;
  userId: string;
  type: RoutineType;
  name: string | null;
  category: string;
  isActive: boolean;
  /** When true, local reminders are scheduled for this routine's time(s). */
  reminderEnabled: boolean;
  /** Morning reminder time as "HH:mm" (24h), or null if unset. */
  amReminderTime: string | null;
  /** Evening reminder time as "HH:mm" (24h), or null if unset. */
  pmReminderTime: string | null;
  steps: RoutineStep[];
  createdAt: string;
  updatedAt: string;
}

// ── Routine Insight ──
export interface CategoryScore {
  category: string;
  score: number;
  tip: string;
}

export interface Improvement {
  area: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DetailedInsight {
  compatibilityScore: number;
  summary: string;
  categoryScores: CategoryScore[];
  improvements: Improvement[];
  comments: string[];
}

// ── Skin Quiz ──
export interface QuizAnswer {
  id: string;
  userId: string;
  questionId: number;
  questionText: string;
  answer: string;
  createdAt: string;
}

// ── Skin Log ──
export interface SkinLog {
  id: string;
  userId: string;
  date: string;
  lifestyleFactors: string[];
  notes: string | null;
  photoUrl: string | null;
  mood: string | null;
  feelings: string[];
  concerns: string[];
  sleepQuality: string | null;
  activityLevel: string | null;
  sunExposure: string | null;
  waterGlasses: number | null;
  supplements: string | null;
  periodStatus: string | null;
  otherFactors: string[];
  completedSteps: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Skin Score ──
export interface SkinScore {
  id: string;
  userId: string;
  score: number;
  week: number;
  date: string;
  hydration: number | null;
  oilBalance: number | null;
  texture: number | null;
  evenTone: number | null;
  sensitivity: number | null;
  createdAt: string;
}

// ── Mood ──
export interface MoodEntry {
  id: string;
  userId: string;
  mood: string;
  date: string;
}

// ── Gamification ──
export interface GlowLevelData {
  level: number;
  label: string;
  currentXp: number;
  levelMinXp: number;
  levelMaxXp: number;
}

export interface GamificationSummary {
  totalXp: number;
  glowLevel: GlowLevelData;
  currentStreak: number;
  longestStreak: number;
  streakRestoresLeft: number;
  canRestoreStreak: boolean;
}

export interface DailyCompletionData {
  date: string;
  dayIndex: number;
  amCompleted: boolean;
  pmCompleted: boolean;
  customCompleted: boolean;
  moodLogged: boolean;
  isFullDay: boolean;
}

export interface XpHistoryEntry {
  date: string;
  dailyXp: number;
  totalXp: number;
}

export interface StreakRestoreResult {
  success: boolean;
  reason?: string;
  streakRestoresLeft?: number;
  currentStreak?: number;
}

// ── User Product (Shelf) ──
export interface UserProduct {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  source: 'recommended' | 'scanned' | 'added';
  createdAt: string;
}
