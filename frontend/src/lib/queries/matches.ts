import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Match } from "@/lib/types";

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: () => apiFetch<Match[]>("/api/matches/"),
    refetchInterval: 4000, // Poll every 4 seconds for maximum responsiveness
  });
}

