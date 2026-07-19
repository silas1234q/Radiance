import { catchAsync } from '../utils/catchAsync';
import * as gamificationService from '../services/gamificationService';

export const getSummary = catchAsync(async (req, res) => {
  const summary = await gamificationService.getGamificationSummary(req.user!.id);
  res.json(summary);
});

export const restoreStreak = catchAsync(async (req, res) => {
  const result = await gamificationService.restoreStreak(req.user!.id);
  res.json(result);
});

export const getWeeklyCompletions = catchAsync(async (req, res) => {
  const completions = await gamificationService.getWeeklyCompletions(req.user!.id);
  res.json(completions);
});

export const getXpHistory = catchAsync(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const history = await gamificationService.getXpHistory(req.user!.id, days);
  res.json(history);
});
