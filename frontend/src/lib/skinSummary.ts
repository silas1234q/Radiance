import type { SkinScore } from '../types/api';

interface InsightGamification {
  currentStreak: number;
  totalXp: number;
}
interface InsightProfile {
  hydration?: number | null;
  texture?: number | null;
}

export interface EarnedBadge {
  label: string;
  /** Ionicons glyph name. */
  icon: string;
  color: string;
}

/**
 * Short, data-derived progress insight shown on the progress screen and its
 * summary. Shared so both surfaces stay in sync.
 */
export function buildAiInsight(
  scores: SkinScore[] | undefined,
  gamification: InsightGamification | null | undefined,
): string {
  const parts: string[] = [];
  if (gamification) {
    if (gamification.currentStreak >= 7) {
      parts.push(`Amazing ${gamification.currentStreak}-day streak! Your consistency is paying off.`);
    } else if (gamification.currentStreak >= 3) {
      parts.push(`Nice ${gamification.currentStreak}-day streak! Keep the momentum going.`);
    }
  }
  if (scores && scores.length >= 2) {
    const sorted = [...scores].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const latest = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    if (latest.score > prev.score) {
      parts.push('Your skin barrier is getting stronger! Keep focusing on hydration.');
    } else if (latest.score < prev.score) {
      parts.push('Your score dipped slightly. Focus on consistency and sun protection.');
    }
  }
  if (parts.length === 0) {
    return 'Complete routines and log your mood daily to unlock personalized insights.';
  }
  return parts.join(' ');
}

/** Achievement badges earned from the user's real profile/gamification data. */
export function buildEarnedBadges(
  profile: InsightProfile | null | undefined,
  gamification: InsightGamification | null | undefined,
): EarnedBadge[] {
  const badges: EarnedBadge[] = [];
  if (profile?.hydration && profile.hydration >= 70) {
    badges.push({ label: 'Hydration Master', icon: 'water', color: '#4FC3F7' });
  }
  if (profile?.texture && profile.texture >= 70) {
    badges.push({ label: 'Barrier Builder', icon: 'shield-checkmark', color: '#81C784' });
  }
  if (gamification && gamification.currentStreak >= 7) {
    badges.push({ label: 'Consistency Queen', icon: 'ribbon', color: '#FFB74D' });
  }
  if (gamification && gamification.totalXp >= 500) {
    badges.push({ label: 'XP Earner', icon: 'star', color: '#AB47BC' });
  }
  return badges;
}
