import { useMatches } from "@/lib/queries/matches";
import { useMatchStats } from "@/lib/queries/stats";
import { useMemo, useState, useEffect, useRef } from "react";
import MatchCard from "@/components/MatchCard";
import { ChevronRight, Search, Trophy, Calendar, LayoutGrid, Users, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { format, addDays, isSameDay, startOfDay } from "date-fns";

const IPLPage = () => {
  const { data: matches = [], isLoading } = useMatches();
  const [activeTab, setActiveTab] = useState<"schedule" | "stats">("schedule");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate 14 days for the scroller
  const dates = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => addDays(startOfDay(new Date()), i - 2));
  }, []);

  // Filter matches for the selected date
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => isSameDay(new Date(m.match_date), selectedDate));
  }, [matches, selectedDate]);

  // Set default selected match for stats when matches change or date changes
  useEffect(() => {
    if (filteredMatches.length > 0) {
      setSelectedMatchId(filteredMatches[0].id);
    } else if (matches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(matches[0].id);
    }
  }, [filteredMatches, matches]);

  const { data: stats, isLoading: isStatsLoading } = useMatchStats(selectedMatchId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066ff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-24">
      {/* Top Banner section */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        {/* Background Overlay with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/80 to-transparent z-10" />
        
        {/* Placeholder for the cinematic background */}
        <div className="absolute inset-0 bg-[#1e293b]">
           <img 
             src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=2000" 
             className="w-full h-full object-cover opacity-60 mix-blend-overlay"
             alt="Cricket Background"
           />
        </div>

        {/* Content */}
        <div className="relative z-20 h-full max-w-[1600px] mx-auto px-6 flex flex-col justify-between py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </Link>
            <button className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white">
              <Search className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mb-4">
             <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase italic" style={{ fontFamily: 'Outfit, sans-serif' }}>
               Indian League
             </h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-[1600px] mx-auto -mt-8 relative z-30 px-4 sm:px-6 space-y-6">
        
        {/* Tab Selector */}
        <div className="bg-[#e2e8f0]/80 backdrop-blur-md p-1.5 rounded-2xl flex items-center gap-1">
          <button 
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === "schedule" ? "bg-[#0066ff] text-white shadow-lg shadow-blue-500/30" : "text-muted-foreground hover:bg-white/50"
            }`}
          >
            Schedule
          </button>
          <button 
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === "stats" ? "bg-[#0066ff] text-white shadow-lg shadow-blue-500/30" : "text-muted-foreground hover:bg-white/50"
            }`}
          >
            Statistics
          </button>
        </div>

        {activeTab === "schedule" ? (
          <div className="space-y-6">
            {/* Horizontal Date Scroller */}
            <div 
              ref={scrollRef}
              className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1"
            >
              {dates.map((date, i) => {
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 w-20 h-24 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected 
                        ? "bg-[#0066ff] text-white shadow-lg shadow-blue-500/40 translate-y-[-4px]" 
                        : "bg-white text-muted-foreground border border-border/50 hover:border-primary/30"
                    }`}
                  >
                    <span className="text-xl font-black">{format(date, "d")}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{format(date, "MMMM")}</span>
                    {isToday && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-green-500 absolute top-2 right-4" />}
                    {isToday && isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-2 right-4" />}
                  </button>
                );
              })}
            </div>

            {/* Pre-match events Title */}
            <div className="pt-2">
               <h2 className="text-2xl font-black text-[#0f172a] tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                 Pre-match events
               </h2>
            </div>

            {/* Match List */}
            <div className="space-y-4">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match) => (
                  <MatchCard key={match.id} match={match} allowBetting={isSameDay(new Date(match.match_date), new Date())} />
                ))
              ) : (
                <div className="bg-white rounded-[2.5rem] p-16 text-center border border-dashed border-border/60">
                   <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                   <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No matches scheduled for this date</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Statistics Tab Content */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Standings Placeholder Card */}
            <div className="bg-white rounded-[2rem] p-6 border border-border/50 shadow-sm flex items-center gap-5">
               <div className="w-14 h-14 rounded-2xl bg-[#eff6ff] flex items-center justify-center text-[#0066ff]">
                  <LayoutGrid className="w-7 h-7" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-[#0f172a]">Standings</h3>
                  <p className="text-xs font-bold text-muted-foreground">Find out the teams' rankings</p>
               </div>
            </div>

            {/* Top Players section */}
            <div className="space-y-4">
               <h2 className="text-2xl font-black text-[#0f172a] tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                 Top players
               </h2>
               
               {isStatsLoading ? (
                 <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-24 w-full bg-white rounded-3xl animate-pulse border border-border/30" />
                    ))}
                 </div>
               ) : stats?.top_players.map((player, idx) => (
                 <div key={idx} className="bg-white rounded-3xl p-4 border border-border/50 shadow-sm flex items-center gap-4 group hover:border-[#0066ff]/30 transition-all">
                    <div className="text-2xl font-black text-muted-foreground/40 w-8 text-center">{idx + 1}</div>
                    
                    {/* Premium Avatar */}
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] border border-border group-hover:scale-105 transition-transform">
                       <div className="absolute inset-0 flex items-center justify-center text-[#0066ff]/20">
                          <Users className="w-8 h-8" />
                       </div>
                       <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>

                    <div className="flex-1">
                       <h4 className="font-black text-[#0f172a] text-sm sm:text-base">{player.name}</h4>
                       <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">{player.country} • {player.team_name}</p>
                    </div>

                    <div className="bg-[#f8fafc] rounded-2xl px-4 py-2 text-right border border-border/30">
                       <div className="flex gap-4">
                          <div>
                             <div className="text-[10px] font-black text-muted-foreground/60 uppercase">GM</div>
                             <div className="font-black text-[#0f172a]">{player.gm}</div>
                          </div>
                          <div>
                             <div className="text-[10px] font-black text-muted-foreground/60 uppercase">{player.stats ? 'ST' : 'RN'}</div>
                             <div className="font-black text-[#0066ff]">{player.stats || player.rn}</div>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default IPLPage;
