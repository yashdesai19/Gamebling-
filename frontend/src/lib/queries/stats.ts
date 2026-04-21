import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type TopPlayer = {
  name: string;
  country: string;
  gm: number;
  rn: number;
  role: string;
  team_name: string;
  stats?: string;
};

export type MatchStats = {
  match_id: number;
  teams: string[];
  top_players: TopPlayer[];
  standings_summary: string;
};

export function useMatchStats(matchId: number | null) {
  return useQuery({
    queryKey: ["matchStats", matchId],
    queryFn: () => (matchId ? apiFetch<MatchStats>(`/api/stats/match/${matchId}`) : null),
    enabled: !!matchId,
  });
}
