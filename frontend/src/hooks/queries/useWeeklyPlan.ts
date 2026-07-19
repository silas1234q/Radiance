import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

interface WeekMilestone {
  week: string;
  title: string;
  description: string;
}

interface WeeklyPlanResponse {
  milestones: WeekMilestone[];
  source: string;
}

export function useWeeklyPlan() {
  const api = useApi();
  return useQuery({
    queryKey: ['weeklyPlan'],
    queryFn: () => api.fetch<WeeklyPlanResponse>('/skin-profile/weekly-plan'),
    staleTime: 30 * 60 * 1000,
  });
}
