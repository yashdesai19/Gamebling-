import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthed } from "@/components/ProtectedRoute";
import BottomNav from "@/components/BottomNav";
import { History, Wallet, TrendingUp, Trophy } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ColorChoice = "red" | "green" | "violet";
type RoundStatus = "open" | "closed" | "resulted";

interface ColorRound {
  id: number;
  round_number: number;
  status: RoundStatus;
  started_at: string;
  seconds_remaining: number;
  result_color?: ColorChoice;
}

interface ColorBet {
  id: number;
  round_id: number;
  chosen_color: ColorChoice;
  bet_amount: string;
  status: string;
  actual_payout?: string;
  commission?: string;
}

interface HistoryRound {
  id: number;
  round_number: number;
  result_color: ColorChoice;
  status: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROUND_DURATION = 60;
const COMMISSION = 0.05;

const COLOR_CONFIG: Record<ColorChoice, {
  label: string; emoji: string;
  multiplier: string; bg: string; border: string;
  glow: string; text: string; shadow: string;
}> = {
  red: {
    label: "Red", emoji: "🔴", multiplier: "2×",
    bg: "hsl(0 90% 58% / 0.12)",
    border: "hsl(0 90% 58% / 0.7)",
    glow: "0 0 24px hsl(0 90% 58% / 0.5), 0 0 60px hsl(0 90% 58% / 0.2)",
    text: "hsl(0 90% 68%)",
    shadow: "hsl(0 90% 58%)",
  },
  green: {
    label: "Green", emoji: "🟢", multiplier: "2×",
    bg: "hsl(142 72% 45% / 0.12)",
    border: "hsl(142 72% 45% / 0.7)",
    glow: "0 0 24px hsl(142 72% 45% / 0.5), 0 0 60px hsl(142 72% 45% / 0.2)",
    text: "hsl(142 72% 60%)",
    shadow: "hsl(142 72% 45%)",
  },
  violet: {
    label: "Violet", emoji: "🟣", multiplier: "3×",
    bg: "hsl(270 80% 60% / 0.12)",
    border: "hsl(270 80% 60% / 0.7)",
    glow: "0 0 24px hsl(270 80% 60% / 0.5), 0 0 60px hsl(270 80% 60% / 0.2)",
    text: "hsl(270 80% 75%)",
    shadow: "hsl(270 80% 60%)",
  },
};

const DOT_COLORS: Record<ColorChoice, string> = {
  red: "#EF4444",
  green: "#22C55E",
  violet: "#A855F7",
};

const QUICK_AMOUNTS = [10, 50, 100, 500];

// ─── Circular Timer SVG ───────────────────────────────────────────────────────
function CircularTimer({ seconds, total = ROUND_DURATION, status }: {
  seconds: number; total?: number; status: RoundStatus;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, seconds / total));
  const dashOffset = circumference * (1 - progress);

  const timerColor = seconds <= 10 ? "#EF4444" : seconds <= 20 ? "#F59E0B" : "#22C55E";

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Track */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(230 22% 16%)" strokeWidth="8" />
        {/* Progress */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={timerColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 1s linear, stroke 0.5s ease",
            filter: `drop-shadow(0 0 6px ${timerColor}88)`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="relative z-10 text-center">
        {status === "open" ? (
          <>
            <div className="text-4xl font-black leading-none" style={{ color: timerColor, fontFamily: 'Outfit, sans-serif' }}>
              {seconds}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">seconds</div>
          </>
        ) : status === "closed" ? (
          <div className="text-sm font-bold text-yellow-400 uppercase">Drawing...</div>
        ) : (
          <div className="text-sm font-bold text-green-400 uppercase">Result!</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ColorGamePage() {
  const { toast } = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const qc = useQueryClient();
  const userIsAuthed = isAuthed();

  const [selectedColor, setSelectedColor] = useState<ColorChoice | null>(null);
  const [betAmount, setBetAmount] = useState("100");
  const [localSeconds, setLocalSeconds] = useState(ROUND_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch current round ──────────────────────────────────────────────────
  const { data: round, refetch: refetchRound } = useQuery<ColorRound>({
    queryKey: ["color-current"],
    queryFn: () => apiFetch<ColorRound>("/api/color/current"),
    refetchInterval: 1500,
  });

  // Sync local timer with server
  useEffect(() => {
    if (!round) return;
    setLocalSeconds(Math.max(0, round.seconds_remaining));

    if (timerRef.current) clearInterval(timerRef.current);

    if (round.status === "open") {
      timerRef.current = setInterval(() => {
        setLocalSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            refetchRound();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [round?.id, round?.status, round?.seconds_remaining]);

  // ── Fetch history ────────────────────────────────────────────────────────
  const { data: history = [] } = useQuery<HistoryRound[]>({
    queryKey: ["color-history"],
    queryFn: () => apiFetch<HistoryRound[]>("/api/color/history"),
    refetchInterval: 10000,
  });

  // ── Fetch my bets ────────────────────────────────────────────────────────
  const { data: myBets = [] } = useQuery<ColorBet[]>({
    queryKey: ["color-my-bets"],
    queryFn: () => apiFetch<ColorBet[]>("/api/color/my-bets"),
    refetchInterval: 8000,
    enabled: userIsAuthed,
  });

  // ── Place bet ────────────────────────────────────────────────────────────
  const placeBet = useMutation({
    mutationFn: () =>
      apiFetch("/api/color/bet", {
        method: "POST",
        body: JSON.stringify({
          round_id: round?.id,
          chosen_color: selectedColor,
          bet_amount: Number(betAmount),
        }),
      }),
    onSuccess: () => {
      toast({ title: "🎯 Bet Placed!", description: `₹${betAmount} on ${selectedColor?.toUpperCase()}` });
      qc.invalidateQueries({ queryKey: ["color-my-bets"] });
      qc.invalidateQueries({ queryKey: ["wallet-bal"] });
      setSelectedColor(null);
    },
    onError: (e) => {
      const err = e as ApiError;
      if (err?.status === 401) {
        toast({ title: "Login required", variant: "destructive" });
        nav("/login");
        return;
      }
      toast({ title: "Bet failed", description: err?.message ?? "Try again", variant: "destructive" });
    },
  });

  const handleBet = useCallback(() => {
    if (!userIsAuthed) {
      toast({ title: "Login Required", description: "Login to start trading!", variant: "destructive" });
      nav("/login", { state: { from: loc.pathname } });
      return;
    }
    if (!selectedColor || !round || round.status !== "open") return;
    const amt = Number(betAmount);
    if (!Number.isFinite(amt) || amt < 10) {
      toast({ title: "Min bet is ₹10", variant: "destructive" });
      return;
    }
    placeBet.mutate();
  }, [userIsAuthed, selectedColor, round, betAmount, placeBet, nav, loc.pathname]);

  // Compute estimated payout
  const estimatedPayout = useCallback(() => {
    if (!selectedColor || !betAmount) return null;
    const amt = Number(betAmount);
    if (!amt) return null;
    const mult = selectedColor === "violet" ? 3 : 2;
    const gross = amt * mult;
    const commission = gross * COMMISSION;
    const net = gross - commission;
    return { gross, commission, net };
  }, [selectedColor, betAmount]);

  const payoutInfo = estimatedPayout();
  const isBettingOpen = round?.status === "open" && localSeconds > 5;
  const currentRoundBet = myBets.find((b) => b.round_id === round?.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <BottomNav />
      <div className="container max-w-lg mx-auto px-4 pt-10 pb-24 space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Color <span className="text-primary">Trading</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Pick a color, wait 60s, win 3×!</p>
        </div>

        {/* Timer Card */}
        <div className="rounded-3xl p-8 glass-card text-center space-y-6" style={{ background: "white" }}>
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Period #{round?.round_number ?? "—"}</span>
            <span className={`px-2 py-0.5 rounded-full ${
              round?.status === "open" ? "bg-green-100 text-green-700" :
              round?.status === "closed" ? "bg-yellow-100 text-yellow-700" : "bg-purple-100 text-purple-700"
            }`}>
              {round?.status === "open" ? "Betting Open"
              : round?.status === "closed" ? "Closed"
              : "Completed"}
            </span>
          </div>

          <div className="flex justify-center py-4">
            <CircularTimer
              seconds={localSeconds}
              total={ROUND_DURATION}
              status={round?.status ?? "open"}
            />
          </div>

          {/* Result reveal */}
          {round?.status === "resulted" && round.result_color && (
            <div className="animate-float-up flex justify-center">
              <div
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-2xl shadow-xl transition-all"
                style={{
                  background: "white",
                  border: `3px solid hsl(var(--color-${round.result_color}))`,
                  color: `hsl(var(--color-${round.result_color}))`,
                }}
              >
                {round.result_color.toUpperCase()} WINS!
              </div>
            </div>
          )}
        </div>

        {/* Color Buttons */}
        <div className="grid grid-cols-3 gap-4">
          {(["red", "green", "violet"] as ColorChoice[]).map((color) => {
            const isSelected = selectedColor === color;
            return (
              <button
                key={color}
                onClick={() => isBettingOpen ? setSelectedColor(isSelected ? null : color) : undefined}
                disabled={!isBettingOpen}
                className={`relative rounded-3xl p-5 flex flex-col items-center gap-3 transition-all duration-300 ${
                  isSelected ? `ring-4 ring-offset-2 ring-primary bg-white scale-105` : `bg-white glass-card`
                }`}
                style={{
                  opacity: !isBettingOpen ? 0.6 : 1,
                  cursor: !isBettingOpen ? "not-allowed" : "pointer",
                }}
              >
                <div className="w-10 h-10 rounded-full shadow-lg" style={{ background: `hsl(var(--color-${color}))` }} />
                <span className="font-black text-xs uppercase tracking-wider text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {color}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {color === 'violet' ? '3.0×' : '2.0×'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bet Confirm Card */}
        <div className={`rounded-3xl p-6 glass-card space-y-4 transition-all duration-300 ${selectedColor ? "scale-100 opacity-100" : "scale-95 opacity-50"}`} 
             style={{ background: "white" }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bet Amount</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => setBetAmount(String(v))}
                className={`py-3 rounded-xl text-sm font-black transition-all ${
                  betAmount === String(v) ? "bg-primary text-white" : "bg-muted text-foreground"
                }`}
              >
                ₹{v}
              </button>
            ))}
          </div>
          
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black">₹</span>
            <input
              type="number"
              min={10}
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-muted border-none font-black text-foreground focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleBet}
            disabled={!isBettingOpen || placeBet.isPending}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
          >
            {placeBet.isPending ? "Placing..." : selectedColor ? `Confirm Market (₹${betAmount})` : "Select a Color"}
          </button>
        </div>

        {/* History */}
        <div className="rounded-3xl p-6 glass-card" style={{ background: "white" }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Draw History</h3>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {history.slice(0, 15).map((r) => (
              <div key={r.id} className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-4 border-white shadow-md" style={{ background: `hsl(var(--color-${r.result_color}))` }} />
                <span className="text-[8px] font-black text-muted-foreground">#{String(r.round_number).slice(-3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Bets History */}
        {userIsAuthed && myBets.length > 0 && (
          <div className="rounded-3xl p-6 glass-card" style={{ background: "white" }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-black text-foreground uppercase tracking-widest text-sm">My Active Trades</h3>
            </div>
            <div className="space-y-3">
              {myBets.slice(0, 10).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ background: DOT_COLORS[b.chosen_color] }} />
                    <div>
                      <div className="text-xs font-black uppercase text-foreground">{b.chosen_color}</div>
                      <div className="text-[10px] text-muted-foreground font-bold">₹{b.bet_amount}</div>
                    </div>
                  </div>
                  <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                    b.status === "won" ? "bg-green-100 text-green-700" : 
                    b.status === "lost" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {b.status === "won" ? `+₹${Number(b.actual_payout).toFixed(0)}` : b.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="rounded-3xl p-6 glass-card bg-primary text-white space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-sm">Trading Guide</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 text-[11px] font-bold opacity-90">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">1</div>
              <span>Pick a market color (Red/Green/Violet)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">2</div>
              <span>Enter your trade amount and confirm</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">3</div>
              <span>Wait for the 60s period to result. Win up to 3×!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
