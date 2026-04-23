import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Match } from "@/lib/types";

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: () => apiFetch<Match[]>("/api/matches/"),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const matches = query.state.data ?? [];
      const hasLiveMatch = matches.some((match) => match.match_status === "live" || Boolean(match.live_score?.trim()));
      return hasLiveMatch ? 3000 : 10000;
    },
  });
}

