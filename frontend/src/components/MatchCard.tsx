import { useMemo, useState, useEffect } from "react";
import { Clock, MapPin, Coins, Trophy, Zap, Loader2, ChevronDown, Bell, Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/lib/types";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { isAuthed } from "@/components/ProtectedRoute";
import { format, differenceInSeconds } from "date-fns";

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

const MatchCard = ({ match, allowBetting = true }: { match: Match; allowBetting?: boolean }) => {
  const { toast } = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [winnerSelected, setWinnerSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const isLive = match.match_status === "live";
  const isCompleted = match.match_status === "completed";
  const teamA = match.team1;
  const teamB = match.team2;

  // Countdown timer logic
  useEffect(() => {
    if (isLive || isCompleted) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const matchStart = new Date(match.match_date);
      const diff = differenceInSeconds(matchStart, now);
      
      if (diff <= 0) {
        setTimeLeft("STAERTING");
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setTimeLeft(`${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [match.match_date, isLive, isCompleted]);

  const placeWinner = useMutation({
    mutationFn: () =>
      apiFetch("/api/bets/place_winner", {
        method: "POST",
        body: JSON.stringify({ 
          match_id: match.id, 
          predicted_winner_team_id: winnerSelected, 
          bet_amount: 500 // Default bet amount for demonstration
        }),
      }),
  });

  const handlePlaceBet = async (teamId: number) => {
    if (!isAuthed()) {
      toast({ title: "Login Required", description: "Please login to place your bets!", variant: "destructive" });
      nav("/login", { state: { from: loc.pathname } });
      return;
    }

    setWinnerSelected(teamId);
    try {
      await placeWinner.mutateAsync();
      setSubmitted(true);
      toast({ title: "🎯 Bet Placed!", description: `Bet placed successfully on ${teamId === teamA.id ? teamA.name : teamB.name}.` });
    } catch (e) {
      const err = e as ApiError;
      toast({ title: "Bet failed", description: err?.message ?? "Error placing bet", variant: "destructive" });
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-5 sm:p-6 border border-border/50 shadow-sm space-y-6 hover:shadow-md transition-all group">
      
      {/* Top Bar: League Info + Actions */}
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
         <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-full bg-[#f1f5f9] text-muted-foreground hover:bg-[#e2e8f0] transition-all">
               <Bell className="w-4.5 h-4.5" />
            </button>
            <button className="p-2.5 rounded-full bg-[#f1f5f9] text-muted-foreground hover:bg-[#e2e8f0] transition-all">
               <Star className="w-4.5 h-4.5" />
            </button>
         </div>
      </div>

      {/* Center: Match Teams & VS */}
      <div className="flex items-center justify-between gap-4 py-2">
         {/* Team Left */}
         <div className="flex-1 flex flex-col items-center sm:flex-row sm:justify-end gap-3 sm:gap-4 text-center sm:text-right">
            <span className="text-sm sm:text-base font-black text-[#0f172a] order-2 sm:order-1">{teamA.name}</span>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#f8fafc] border border-border/40 p-2.5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform order-1 sm:order-2">
               <img src={TEAM_LOGOS[teamA.short_name]} alt={teamA.short_name} className="w-full h-full object-contain" />
            </div>
         </div>

         {/* VS & Timer */}
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

         {/* Team Right */}
         <div className="flex-1 flex flex-col items-center sm:flex-row sm:justify-start gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#f8fafc] border border-border/40 p-2.5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
               <img src={TEAM_LOGOS[teamB.short_name]} alt={teamB.short_name} className="w-full h-full object-contain" />
            </div>
            <span className="text-sm sm:text-base font-black text-[#0f172a]">{teamB.name}</span>
         </div>
      </div>

      {/* Bottom: 1X2 Odds */}
      <div className="space-y-3 pt-2">
         <h4 className="text-[11px] font-black text-[#0f172a] uppercase tracking-wider">1X2</h4>
         <div className="grid grid-cols-3 gap-2.5">
            <button 
              onClick={() => handlePlaceBet(teamA.id)}
              className="bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-xl py-3 px-4 flex items-center justify-between transition-all group/btn"
            >
               <span className="text-[10px] font-bold text-muted-foreground">W1</span>
               <span className="text-sm font-black text-[#0f172a]">1.823</span>
            </button>
            <button className="bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-xl py-3 px-4 flex items-center justify-between transition-all">
               <span className="text-[10px] font-bold text-muted-foreground">X</span>
               <span className="text-sm font-black text-[#0f172a]">55</span>
            </button>
            <button 
              onClick={() => handlePlaceBet(teamB.id)}
              className="bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-xl py-3 px-4 flex items-center justify-between transition-all group/btn"
            >
               <span className="text-[10px] font-bold text-muted-foreground">W2</span>
               <span className="text-sm font-black text-[#0f172a]">2.036</span>
            </button>
         </div>
      </div>

    </div>
  );
};

export default MatchCard;
