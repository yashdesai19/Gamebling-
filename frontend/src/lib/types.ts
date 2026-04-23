export type Team = {
  id: number;
  name: string;
  short_name: string;
  logo: string | null;
};

export type Match = {
  id: number;
  match_date: string;
  toss_time: string | null;
  venue: string;
  match_status: string;
  external_match_id: string | null;
  live_score: string | null;
  live_over: string | null;
  live_status_text: string | null;
  last_synced_at: string | null;
  team1: Team;
  team2: Team;
  toss_winner: Team | null;
  match_winner: Team | null;
};

export type Bet = {
  id: number;
  user_id: number;
  match_id: number;
  bet_type: string;
  predicted_winner_team_id: number;
  bet_amount: string;
  odds: string;
  potential_payout: string;
  bet_status: string;
};

