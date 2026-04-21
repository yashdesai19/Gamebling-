import { Link } from "react-router-dom";
import { 
  Palette, ChevronRight, Users,
  Trophy, PlayCircle, Activity, Star, 
  Clock, Hash, ArrowUpRight
} from "lucide-react";
import { useMatches } from "@/lib/queries/matches";
import { useMemo } from "react";
import MatchCard from "@/components/MatchCard";

import Sidebar from "@/components/Sidebar";
import Logo from "@/components/Logo";

const sports = [
  { name: "Cricket", icon: Trophy, to: "/ipl", active: true },
  { name: "Color Game", icon: Palette, to: "/color-game" },
];

const trendingBets = [
  { user: "User_829", amount: "₹12,400", time: "2m ago", game: "MI vs CSK" },
  { user: "Karan_X", amount: "₹5,000", time: "5m ago", game: "Color Game" },
  { user: "BetMaster", amount: "₹25,000", time: "8m ago", game: "RCB vs GT" },
];

const Index = () => {
  const { data: matches = [] } = useMatches();

  const { todayMatches } = useMemo(() => {
    const today: typeof matches = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    matches.forEach((m) => {
      const matchDate = new Date(m.match_date);
      matchDate.setHours(0, 0, 0, 0);
      if (matchDate.getTime() === now.getTime()) today.push(m);
    });

    return { todayMatches: today };
  }, [matches]);

  return (
    <div className="min-h-screen bg-background pt-20 sm:pt-28 pb-20 sm:pb-16">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR: Sports Nav */}
          <div className="hidden lg:block lg:col-span-2">
            <Sidebar />
          </div>

          {/* MAIN CONTENT: Feed */}
          <main className="col-span-1 lg:col-span-7 space-y-6">
            {/* Horizontal Sports Pills */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {sports.map((s) => (
                <Link
                  key={s.name}
                  to={s.to}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap shadow-sm border ${
                    s.active
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-white border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <s.icon className="w-4 h-4" />
                  {s.name}
                </Link>
              ))}
            </div>

            {/* Hero Header */}
            <div className="bg-white border border-border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 relative overflow-hidden shadow-sm">
              <div className="relative z-10 max-w-md">
                <h1 className="text-2xl sm:text-4xl font-black mb-3 leading-tight tracking-tight text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  THE CLEANEST <br/> BETTING EXPERIENCE.
                </h1>
                <p className="text-muted-foreground text-sm font-medium mb-8">
                  Join 50,000+ players winning daily on Cricket & Color trading.
                </p>
                <div className="flex gap-4">
                    <Link to="/ipl" className="bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-black text-sm uppercase tracking-widest shadow-md transition-transform hover:-translate-y-1 active:translate-y-0">
                        Start Playing
                    </Link>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/10 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-4 right-12 opacity-10 transform rotate-12">
                   <Trophy className="w-56 h-56 text-primary" />
              </div>
            </div>

            {/* Game Options Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/ipl" className="group bg-white rounded-3xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Trophy className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Cricket Betting</h3>
                    <p className="text-xs text-muted-foreground mb-4">IPL, T20 World Cup & More</p>
                    <div className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest">
                        Enter Sportsbook <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                </Link>

                <Link to="/color-game" className="group bg-white rounded-3xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Palette className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Color Trading</h3>
                    <p className="text-xs text-muted-foreground mb-4">Win 2× Every 60 Seconds</p>
                    <div className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest">
                        Trade Now <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                </Link>
            </div>

            {/* Match Feed */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-50 rounded-lg">
                        <PlayCircle className="w-5 h-5 text-red-600" />
                   </div>
                   <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Live Matches
                  </h2>
                </div>
                <Link to="/ipl" className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-widest hover:underline">
                  View Schedule
                </Link>
              </div>

              {todayMatches.length > 0 ? (
                <div className="space-y-4">
                  {todayMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-dashed border-border p-12 text-center">
                  <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-bold">No Live Matches Right Now</p>
                  <Link to="/ipl" className="text-primary text-sm font-black mt-2 inline-block">Check Upcoming Schedule →</Link>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT SIDEBAR: Stats & Activity */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-border">
                    <div className="text-[10px] font-black text-muted-foreground uppercase mb-1">Active Players</div>
                    <div className="text-lg font-black text-primary">14.2K</div>
                 </div>
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-border">
                    <div className="text-[10px] font-black text-muted-foreground uppercase mb-1">Total Payout</div>
                    <div className="text-lg font-black text-emerald-600">₹44L+</div>
                 </div>
              </div>

              {/* Trending Bets */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
                        Live Betting Feed
                    </h3>
                </div>
                <div className="space-y-5">
                  {trendingBets.map((bet, i) => (
                    <div key={i} className="flex flex-col gap-1 border-b border-muted/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-foreground">{bet.user}</span>
                        <span className="text-[10px] text-muted-foreground">{bet.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3 text-muted-foreground/50" />
                            <span className="text-[11px] font-bold text-muted-foreground">{bet.game}</span>
                        </div>
                        <span className="text-xs font-black text-emerald-600">{bet.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 bg-muted/30 rounded-xl text-[11px] font-black text-muted-foreground uppercase tracking-widest hover:bg-muted transition-colors">
                    View Leaderboard
                </button>
              </div>

              {/* Promo Card */}
              <div className="bg-black rounded-3xl p-6 text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Refer & Earn</p>
                    <h4 className="text-lg font-black mb-3 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>GET ₹500 FOR <br/> EVERY FRIEND</h4>
                    <button className="bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Invite Now</button>
                 </div>
                 <Users className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" />
              </div>
            </div>
          </aside>

        </div>
      </div>

      <footer className="container mx-auto px-4 mt-16 pt-8 border-t border-border/50 text-center">
         <div className="flex flex-col items-center justify-center gap-2">
            <Logo size="sm" className="opacity-50 grayscale hover:grayscale-0 transition-all" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
               © 2024 PLATFORM • PLAY RESPONSIBLY
            </p>
         </div>
      </footer>
    </div>
  );
};

export default Index;
