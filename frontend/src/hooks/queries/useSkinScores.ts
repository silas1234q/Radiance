import { useQuery } from "@tanstack/react-query";
import { useApi } from "../useApi";
import type { SkinScore } from "../../types/api";
import { useAuth } from "@clerk/clerk-expo";

export function useSkinScores() {
  const api = useApi();
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["skinScores"],
    queryFn: () => api.fetch<SkinScore[]>("/skin-scores"),
    staleTime: 5 * 60 * 1000,
    enabled: !!isSignedIn,
  });
}

export function useLatestScore() {
  const api = useApi();
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["skinScores", "latest"],
    queryFn: () => api.fetch<SkinScore>("/skin-scores/latest"),
    staleTime: 5 * 60 * 1000,
    enabled: !!isSignedIn,
  });
}
