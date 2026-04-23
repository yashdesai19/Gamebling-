import { useState, useEffect, useId } from "react";
import {
  Loader2,
  Minus,
  Plus,
  Trophy,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/lib/types";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthed } from "@/components/ProtectedRoute";
import { format, differenceInSeconds } from "date-fns";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const TEAM_LOGOS: Record<string, string> = {
  MI: "https://scores.iplt20.com/ipl/teamlogos/MI.png",
  CSK: "https://scores.iplt20.com/ipl/teamlogos/CSK.png",
  RCB: "https://scores.iplt20.com/ipl/teamlogos/RCB.png",
  KKR: "https://scores.iplt20.com/ipl/teamlogos/KKR.png",
  DC: "https://scores.iplt20.com/ipl/teamlogos/DC.png",
  RR: "https://scores.iplt20.com/ipl/teamlogos/RR.png",
  SRH: "https://scores.iplt20.com/ipl/teamlogos/SRH.png",
  GT: "https://scores.iplt20.com/ipl/teamlogos/GT.png",
  LSG: "https://scores.iplt20.com/ipl/teamlogos/LSG.png",
  PBKS: "https://scores.iplt20.com/ipl/teamlogos/PBKS.png",
};

const formatOdd = (value: number) => value.toFixed(3);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const TOSS_CLOSE_BUFFER_MS = 5 * 60 * 1000;
const DEFAULT_TOSS_LEAD_MS = 30 * 60 * 1000;

function TossLockSticker() {
  const rawId = useId();
  const filterId = `toss-lock-filter-${rawId.replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 64 64"
      className="h-10 w-10 rotate-[-4deg] drop-shadow-[0_10px_14px_rgba(15,23,42,0.18)]"
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.35" />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <rect x="10" y="24" width="44" height="30" rx="8" fill="#fff" stroke="#111827" strokeWidth="2.4" />
        <path
          d="M22 24v-6c0-6.1 4.9-11 11-11s11 4.9 11 11v6"
          fill="none"
          stroke="#111827"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="32" cy="38" r="4" fill="none" stroke="#111827" strokeWidth="2.6" />
        <path d="M32 42v6" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const parseLiveRuns = (liveScore: string) => {
  const match = liveScore.match(/(\d{1,3})\s*\/\s*(\d{1,2})/);
  if (!match) return null;
  return {
    runs: Number(match[1]),
    wickets: Number(match[2]),
  };
};

const buildMarketOdds = (match: Match) => {
  const liveScoreText = match.live_score?.trim() || "";
  const score = parseLiveRuns(liveScoreText);
  const seed = hashString(`${match.id}-${match.team1.short_name}-${match.team2.short_name}`);
  const bias = ((seed % 1000) / 1000 - 0.5) * 0.24;

  const runsFactor = score ? clamp((score.runs - 140) / 240, -0.18, 0.18) : 0;
  const wicketFactor = score ? clamp(score.wickets * 0.012, 0, 0.12) : 0;
  const liveFactor = match.match_status === "live" ? 0.1 : 0;
  const completedFactor = match.match_status === "completed" ? 0.08 : 0;

  const w1 = clamp(1.35, 4.5, 1.98 - bias - runsFactor + wicketFactor - liveFactor + completedFactor);
  const w2 = clamp(1.35, 4.5, 1.98 + bias + runsFactor + wicketFactor - liveFactor + completedFactor);
  const x = clamp(8, 95, 52 - runsFactor * 22 - (match.match_status === "live" ? 8 : 0) + Math.abs(bias) * 12);

  return {
    W1: Number(w1.toFixed(3)),
    X: Number(x.toFixed(3)),
    W2: Number(w2.toFixed(3)),
  };
};

const getTossTimeMs = (match: Match) => {
  const explicit = match.toss_time ? new Date(match.toss_time).getTime() : Number.NaN;
  if (Number.isFinite(explicit)) return explicit;
  return new Date(match.match_date).getTime() - DEFAULT_TOSS_LEAD_MS;
};

const QUICK_STAKES = [10, 600, 1500];
const DEFAULT_STAKE = 300;
const MIN_STAKE = 10;
const MAX_STAKE = 255000;
const DRAW_MAX_STAKE = 4070;

type BetSelection =
  | { key: "W1"; odds: number; teamId: number }
  | { key: "W2"; odds: number; teamId: number }
  | { key: "X"; odds: number; teamId: null };

type BetMarket = "winner" | "toss";

const MatchCard = ({ match, allowBetting = true }: { match: Match; allowBetting?: boolean }) => {
  const { toast } = useToast();
  const nav = useNavigate();
  const loc = useLocation();

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [betMarket, setBetMarket] = useState<BetMarket>("winner");
  const [selectedBet, setSelectedBet] = useState<BetSelection | null>(null);
  const [betAmount, setBetAmount] = useState<number>(DEFAULT_STAKE);
  const [betSlipOpen, setBetSlipOpen] = useState(false);

  const matchStartMs = new Date(match.match_date).getTime();
  const hasLiveScore = Boolean(match.live_score?.trim());
  const hasStarted = Date.now() >= matchStartMs;
  const isLive = match.match_status === "live" || (hasLiveScore && match.match_status !== "completed") || (hasStarted && match.match_status !== "completed");
  const isCompleted = match.match_status === "completed";
  const teamA = match.team1;
  const teamB = match.team2;
  const liveScoreText = match.live_score?.trim() || "";
  const liveStatusText = match.live_status_text?.trim() || "";
  const marketOdds = buildMarketOdds(match);
  const tossTimeMs = getTossTimeMs(match);
  const isTossBettingOpen = !isLive && !isCompleted && Date.now() < tossTimeMs - TOSS_CLOSE_BUFFER_MS;
  const stakeCap = betMarket === "winner" && selectedBet?.key === "X" ? DRAW_MAX_STAKE : MAX_STAKE;
  const potentialWinnings = selectedBet ? Math.floor(betAmount * selectedBet.odds) : 0;

  const teamALogo = TEAM_LOGOS[teamA.short_name] ?? teamA.logo ?? "";
  const teamBLogo = TEAM_LOGOS[teamB.short_name] ?? teamB.logo ?? "";

  const walletQ = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<{ wallet_balance: string }>("/api/users/wallet"),
    enabled: isAuthed(),
    staleTime: 15_000,
  });
  const walletBalance = walletQ.data?.wallet_balance ?? "0.00";

  useEffect(() => {
    if (isLive || isCompleted) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = differenceInSeconds(new Date(match.match_date), now);

      if (diff <= 0) {
        setTimeLeft("");
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(`${String(h).padStart(2, "0")} : ${String(m).padStart(2, "0")} : ${String(s).padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [match.match_date, isLive, isCompleted]);

  const placeWinner = useMutation({
    mutationFn: () =>
      apiFetch("/api/bets/place_winner", {
        method: "POST",
        body: JSON.stringify({
          match_id: match.id,
          predicted_winner_team_id: selectedBet?.teamId,
          bet_amount: betAmount,
        }),
      }),
  });

  const placeToss = useMutation({
    mutationFn: () =>
      apiFetch("/api/bets/place_toss", {
        method: "POST",
        body: JSON.stringify({
          match_id: match.id,
          predicted_winner_team_id: selectedBet?.teamId,
          bet_amount: betAmount,
        }),
      }),
  });

  const openBetSlip = (market: BetMarket, bet?: BetSelection) => {
    if (!allowBetting || isCompleted) return;
    setBetMarket(market);
    setSelectedBet(bet ?? null);
    setBetAmount(DEFAULT_STAKE);
    setBetSlipOpen(true);
  };

  const updateStake = (nextAmount: number) => {
    setBetAmount(Math.max(MIN_STAKE, Math.min(stakeCap, nextAmount)));
  };

  const handlePlaceBet = async () => {
    if (!selectedBet) return;

    if (!isAuthed()) {
      toast({ title: "Login Required", description: "Please login to place your bets!", variant: "destructive" });
      nav("/login", { state: { from: loc.pathname } });
      return;
    }

    if (betMarket === "winner" && selectedBet.key === "X") {
      toast({
        title: "Draw bet selected",
        description: "Draw popup is ready. Connect draw API when backend endpoint is available.",
      });
      setBetSlipOpen(false);
      return;
    }

    try {
      if (betMarket === "toss") {
        await placeToss.mutateAsync();
        const pickedTeam = selectedBet.key === "W1" ? teamA.name : teamB.name;
        toast({ title: "Toss Bet Placed", description: `Bet placed on ${pickedTeam} to win the toss.` });
      } else {
        await placeWinner.mutateAsync();
        const pickedTeam = selectedBet.key === "W1" ? teamA.name : teamB.name;
        toast({ title: "Bet Placed", description: `Bet placed on ${pickedTeam}.` });
      }
      setBetSlipOpen(false);
    } catch (e) {
      const err = e as ApiError;
      toast({ title: "Bet failed", description: err?.message ?? "Error placing bet", variant: "destructive" });
    }
  };

  const goToDeposit = () => {
    if (!isAuthed()) {
      toast({ title: "Login Required", description: "Please login to deposit.", variant: "destructive" });
      nav("/login", { state: { from: loc.pathname } });
      return;
    }
    setBetSlipOpen(false);
    nav("/wallet");
  };

  return (
    <>
      <div className="bg-white rounded-[2rem] p-5 sm:p-6 border border-border/50 shadow-sm space-y-6 hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0066ff] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[13px] font-black text-[#0f172a] tracking-tight">Indian Premier League</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Round Robin</p>
            </div>
          </div>
          </div>

        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex-1 flex flex-col items-center sm:flex-row sm:justify-end gap-3 sm:gap-4 text-center sm:text-right">
            <span className="text-sm sm:text-base font-black text-[#0f172a] order-2 sm:order-1">{teamA.name}</span>
            {teamALogo ? (
              <img
                src={teamALogo}
                alt={teamA.short_name}
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain flex-shrink-0 group-hover:scale-105 transition-transform order-1 sm:order-2"
              />
            ) : (
              <span className="text-xs font-black order-1 sm:order-2">{teamA.short_name}</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 min-w-[100px]">
            <span className="text-2xl font-black text-[#0f172a]/90 italic">VS</span>
            {!isLive && !isCompleted && (
              <div className="flex items-center gap-1.5">
                {timeLeft.split(":").map((unit, i) => (
                  <div key={i} className="flex items-center">
                    <span className="bg-[#eff6ff] text-[#0066ff] px-1.5 py-0.5 rounded-md text-xs font-black min-w-[24px] text-center">{unit.trim()}</span>
                    {i < 2 && <span className="mx-0.5 text-[#0066ff] font-black">:</span>}
                  </div>
                ))}
              </div>
            )}
            {isLive && (
              <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                LIVE
              </div>
            )}
            <div className="text-[10px] font-bold text-muted-foreground whitespace-nowrap mt-1">
              {format(new Date(match.match_date), "dd.MM.yy hh:mm a")}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center sm:flex-row sm:justify-start gap-3 sm:gap-4 text-center sm:text-left">
            {teamBLogo ? (
              <img
                src={teamBLogo}
                alt={teamB.short_name}
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain flex-shrink-0 group-hover:scale-105 transition-transform"
              />
            ) : (
              <span className="text-xs font-black">{teamB.short_name}</span>
            )}
            <span className="text-sm sm:text-base font-black text-[#0f172a]">{teamB.name}</span>
          </div>
        </div>

        {(isLive || isCompleted || hasLiveScore) && (
          <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] px-4 py-3">
            <p className="text-sm font-black text-[#0f172a]">{liveScoreText || "Score updating..."}</p>
            {liveStatusText && (
              <p className="mt-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{liveStatusText}</p>
            )}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => openBetSlip("toss")}
              disabled={!allowBetting || isCompleted}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                !allowBetting || isCompleted
                  ? "bg-[#eef2f7] text-muted-foreground opacity-60"
                  : isTossBettingOpen
                    ? "bg-[#e8f2ff] text-[#0066ff] hover:bg-[#dcecff]"
                    : "bg-[#fff1f2] text-[#e11d48] opacity-80"
              }`}
            >
              {isTossBettingOpen ? "Toss" : "Toss Closed"}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isTossBettingOpen ? (
                "Open until 5 min before toss"
              ) : (
                <span className="inline-flex scale-75">
                  <TossLockSticker />
                </span>
              )}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => openBetSlip("winner", { key: "W1", odds: marketOdds.W1, teamId: teamA.id })}
              className="bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-xl py-3 px-4 flex items-center justify-between transition-all disabled:opacity-60"
              disabled={!allowBetting || isCompleted}
            >
              <span className="text-[10px] font-bold text-muted-foreground">W1</span>
              <span className="text-sm font-black text-[#0f172a]">{formatOdd(marketOdds.W1)}</span>
            </button>
            <button
              onClick={() => openBetSlip("winner", { key: "X", odds: marketOdds.X, teamId: null })}
              className="bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-xl py-3 px-4 flex items-center justify-between transition-all disabled:opacity-60"
              disabled={!allowBetting || isCompleted}
            >
              <span className="text-[10px] font-bold text-muted-foreground">X</span>
              <span className="text-sm font-black text-[#0f172a]">{formatOdd(marketOdds.X)}</span>
            </button>
            <button
              onClick={() => openBetSlip("winner", { key: "W2", odds: marketOdds.W2, teamId: teamB.id })}
              className="bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-xl py-3 px-4 flex items-center justify-between transition-all disabled:opacity-60"
              disabled={!allowBetting || isCompleted}
            >
              <span className="text-[10px] font-bold text-muted-foreground">W2</span>
              <span className="text-sm font-black text-[#0f172a]">{formatOdd(marketOdds.W2)}</span>
            </button>
          </div>
        </div>
      </div>

      <Sheet open={betSlipOpen} onOpenChange={setBetSlipOpen}>
        <SheetContent
          side="bottom"
          className="p-0 border-0 bg-transparent shadow-none flex items-end pb-[calc(env(safe-area-inset-bottom)+8px)] [&>button]:hidden"
        >
          {betSlipOpen && (
            <div className="mx-auto w-[92vw] max-w-[380px]">
              <div className="max-h-[82dvh] overflow-hidden rounded-[1.75rem] bg-[#f3f4f6] flex flex-col min-h-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.12)_30%,transparent_55%)]">
              <div className="relative overflow-hidden px-4 pb-3 pt-3 flex-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_30%),linear-gradient(135deg,_#1b1464_0%,_#3b0764_35%,_#7e22ce_65%,_#1e1b4b_100%)]" />
                <div className="absolute inset-0" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between text-white">
                    <div className="h-10 w-10" />
                    <div className="h-10 w-10" />
                  </div>

                  <div className="mt-2.5">
                    <h2 className="text-[24px] font-black leading-none text-white/90" style={{ fontFamily: '"Bebas Neue", "Arial Narrow", sans-serif' }}>
                      IPL
                    </h2>
                  </div>

                  <div className="mt-2.5 rounded-[1.55rem] bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.25),_transparent_28%),linear-gradient(145deg,_#062b25_0%,_#072a24_40%,_#0b4336_100%)] p-3 text-white shadow-[0_14px_32px_rgba(3,15,13,0.30)]">
                    <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-white/25" />
                    <div className="flex items-center justify-between text-[12px] font-semibold text-white/80">
                      <span>{format(new Date(match.match_date), "dd.MM.yyyy, hh:mm a")}</span>
                    </div>

                    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-black leading-tight">{teamA.name}</span>
                          {teamALogo && <img src={teamALogo} alt={teamA.short_name} className="h-8 w-8 object-contain" />}
                        </div>
                      </div>
                      <div className="text-[24px] font-black text-white">VS</div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {teamBLogo && <img src={teamBLogo} alt={teamB.short_name} className="h-8 w-8 object-contain" />}
                          <span className="text-[13px] font-black leading-tight">{teamB.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 rounded-[1.2rem] bg-white/10 px-3 py-2 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[12px] font-black">
                            {betMarket === "toss" ? "TOSS" : "MATCH WINNER"}
                            {selectedBet ? `: ${selectedBet.key}` : " - SELECT A TEAM"}
                          </div>
                          <div className="mt-0.5 text-[10px] text-white/75">
                            {betMarket === "toss" ? "Closes 5 min before toss" : "Regular time"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[18px] font-black">
                          {betMarket === "toss" && !isTossBettingOpen ? <TossLockSticker /> : null}
                          <span>{selectedBet ? selectedBet.odds : "--"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mt-2 flex-1 min-h-0 overflow-y-auto rounded-t-[2rem] border-t border-white/80 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)]">
                <div className="grid grid-cols-2 gap-2 rounded-[1.2rem] bg-[#eef2f7] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                  <button
                    type="button"
                    onClick={() => {
                      setBetMarket("winner");
                      setSelectedBet(null);
                    }}
                    className={`rounded-[1rem] py-2 text-[12px] font-black uppercase tracking-widest transition-all ${
                      betMarket === "winner" ? "bg-[#0f172a] text-white shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Match Winner
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBetMarket("toss");
                      setSelectedBet(null);
                    }}
                    className={`rounded-[1rem] py-2 text-[12px] font-black uppercase tracking-widest transition-all ${
                      betMarket === "toss"
                        ? "bg-[#0f172a] text-white shadow-sm"
                        : isTossBettingOpen
                          ? "text-muted-foreground"
                          : "text-[#e11d48]"
                    }`}
                  >
                    Toss
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(betMarket === "toss"
                    ? [
                        { key: "W1" as const, odds: marketOdds.W1, teamId: teamA.id },
                        { key: "W2" as const, odds: marketOdds.W2, teamId: teamB.id },
                      ]
                    : [
                        { key: "W1" as const, odds: marketOdds.W1, teamId: teamA.id },
                        { key: "X" as const, odds: marketOdds.X, teamId: null },
                        { key: "W2" as const, odds: marketOdds.W2, teamId: teamB.id },
                      ]
                  ).map((bet) => (
                    <button
                      key={bet.key}
                      type="button"
                      onClick={() => setSelectedBet(bet)}
                      className={`rounded-xl py-3 px-4 flex items-center justify-between transition-all ${
                        selectedBet?.key === bet.key ? "bg-[#0f172a] text-white" : "bg-[#f1f5f9] hover:bg-[#e2e8f0]"
                      }`}
                    >
                      <span className={`text-[10px] font-bold ${selectedBet?.key === bet.key ? "text-white/70" : "text-muted-foreground"}`}>
                        {bet.key}
                      </span>
                      <span className={`text-sm font-black ${selectedBet?.key === bet.key ? "text-white" : "text-[#0f172a]"}`}>
                        {formatOdd(bet.odds)}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={goToDeposit}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22c55e] text-white"
                      aria-label="Deposit"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 text-[16px] font-black text-[#0f3050]">
                      <span>₹{walletBalance}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 rounded-[1.45rem] bg-[#edf2ff] px-4 py-2.5">
                  <div className="grid grid-cols-[52px_1fr_52px] items-center gap-3">
                    <button type="button" onClick={() => updateStake(betAmount - 100)} className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-white text-[#6d8baa] shadow-sm">
                      <Minus className="h-6 w-6" />
                    </button>
                    <div className="text-center">
                      <div className="text-[16px] font-black text-[#12365a]">{betAmount} Rs</div>
                      <div className="mt-0.5 text-[12px] font-semibold text-[#94a3b8]">
                        {MIN_STAKE} Rs - {stakeCap} Rs
                      </div>
                    </div>
                    <button type="button" onClick={() => updateStake(betAmount + 100)} className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-white text-[#2d8ad8] shadow-sm">
                      <Plus className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 text-center text-[15px] text-[#6b7f95]">
                  Potential winnings: <span className="font-black text-[#22a55a]">₹{potentialWinnings}</span>
                </div>

                <button
                  type="button"
                  onClick={handlePlaceBet}
                  disabled={placeWinner.isPending || placeToss.isPending || !selectedBet}
                  className="mt-2.5 flex w-full items-center justify-center rounded-[1.1rem] bg-[#12c15f] px-4 py-2.5 text-[16px] font-black text-white shadow-[0_14px_30px_rgba(18,193,95,0.26)] disabled:opacity-70"
                >
                  {placeWinner.isPending || placeToss.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Bet"}
                </button>

                <div className="mt-2.5 grid grid-cols-3 gap-2.5">
                  {QUICK_STAKES.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => updateStake(amount)}
                      className="rounded-[0.9rem] bg-[#2d8ad8] px-3 py-1.5 text-[13px] font-black text-white shadow-[0_10px_24px_rgba(45,138,216,0.22)]"
                    >
                      {amount} Rs
                    </button>
                  ))}
                </div>

                {betMarket === "toss" && !isTossBettingOpen ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-white/78 backdrop-blur-[2px] top-[60px] bottom-[-100px]">
                    <div className="mx-4 flex max-w-[220px] flex-col items-center text-center">
                      <TossLockSticker />
                      <p className="mt-3 text-[15px] font-black text-[#0f172a]">Toss bet time has passed</p>
                      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#64748b]">
                        Toss betting closed 5 minutes before toss.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MatchCard;
