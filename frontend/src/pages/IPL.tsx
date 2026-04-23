import { useMatches } from "@/lib/queries/matches";
import { useMatchStats } from "@/lib/queries/stats";
import { useMemo, useState, useEffect, useRef } from "react";
import MatchCard from "@/components/MatchCard";
import { ChevronRight, Search, Calendar, LayoutGrid, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import heroStadium from "@/assets/hero-stadium.jpg";

type IPLTheme = {
  id: string;
  name: string;
  pageBg: string;
  heroBase: string;
  heroGradient: string;
  heroRadial: string;
  heroLines: string;
  heroBottomOverlay: string;
  heroSideOverlay: string;
  liveCardBg: string;
  liveCardBorder: string;
  liveCardShadow: string;
  liveSubText: string;
  tabBg: string;
  tabActiveBg: string;
  tabActiveShadow: string;
  dateSelectedBg: string;
  dateSelectedShadow: string;
  dateDefaultBg: string;
  dateDefaultBorder: string;
  surfaceCardBg: string;
  surfaceCardBorder: string;
  titleColor: string;
  mutedStrongColor: string;
};

const IPL_THEMES: IPLTheme[] = [
  {
    id: "royal-blue",
    name: "Royal Blue",
    pageBg: "#f1f5f9",
    heroBase: "#070f22",
    heroGradient: "linear-gradient(135deg, #020817 0%, #071a3d 42%, #08254f 100%)",
    heroRadial:
      "radial-gradient(900px 280px at 10% 0%, rgba(59,130,246,0.36), transparent 58%), radial-gradient(760px 260px at 100% 8%, rgba(14,165,233,0.2), transparent 55%)",
    heroLines: "repeating-linear-gradient(110deg, rgba(148,163,184,0.08) 0 2px, transparent 2px 24px)",
    heroBottomOverlay: "linear-gradient(to top, rgba(3,10,27,0.95), rgba(6,22,53,0.6), transparent)",
    heroSideOverlay: "linear-gradient(to right, rgba(2,6,23,0.75), transparent, rgba(12,74,110,0.3))",
    liveCardBg: "linear-gradient(to right, #051327, #0a2446, #11406d)",
    liveCardBorder: "rgba(29,78,216,0.3)",
    liveCardShadow: "0 18px 40px rgba(4,12,28,0.35)",
    liveSubText: "rgba(219,234,254,0.9)",
    tabBg: "rgba(226,232,240,0.8)",
    tabActiveBg: "#0066ff",
    tabActiveShadow: "0 10px 24px rgba(59,130,246,0.3)",
    dateSelectedBg: "#0066ff",
    dateSelectedShadow: "0 10px 24px rgba(59,130,246,0.4)",
    dateDefaultBg: "#ffffff",
    dateDefaultBorder: "rgba(148,163,184,0.4)",
    surfaceCardBg: "#ffffff",
    surfaceCardBorder: "rgba(148,163,184,0.35)",
    titleColor: "#0f172a",
    mutedStrongColor: "#475569",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    pageBg: "#fff7ed",
    heroBase: "#1f1207",
    heroGradient: "linear-gradient(135deg, #1a0d05 0%, #5c1a08 45%, #9a3412 100%)",
    heroRadial:
      "radial-gradient(900px 280px at 10% 0%, rgba(251,146,60,0.36), transparent 58%), radial-gradient(760px 260px at 100% 8%, rgba(244,63,94,0.22), transparent 55%)",
    heroLines: "repeating-linear-gradient(110deg, rgba(254,215,170,0.12) 0 2px, transparent 2px 24px)",
    heroBottomOverlay: "linear-gradient(to top, rgba(30,13,8,0.92), rgba(72,24,10,0.55), transparent)",
    heroSideOverlay: "linear-gradient(to right, rgba(41,17,8,0.68), transparent, rgba(146,64,14,0.28))",
    liveCardBg: "linear-gradient(to right, #7c2d12, #9a3412, #c2410c)",
    liveCardBorder: "rgba(249,115,22,0.35)",
    liveCardShadow: "0 18px 40px rgba(154,52,18,0.35)",
    liveSubText: "rgba(255,237,213,0.9)",
    tabBg: "rgba(254,215,170,0.55)",
    tabActiveBg: "#ea580c",
    tabActiveShadow: "0 10px 24px rgba(234,88,12,0.3)",
    dateSelectedBg: "#ea580c",
    dateSelectedShadow: "0 10px 24px rgba(234,88,12,0.35)",
    dateDefaultBg: "#ffffff",
    dateDefaultBorder: "rgba(251,146,60,0.35)",
    surfaceCardBg: "#ffffff",
    surfaceCardBorder: "rgba(251,146,60,0.25)",
    titleColor: "#431407",
    mutedStrongColor: "#7c2d12",
  },
  {
    id: "emerald-night",
    name: "Emerald Night",
    pageBg: "#ecfdf5",
    heroBase: "#052e2b",
    heroGradient: "linear-gradient(135deg, #022c22 0%, #065f46 45%, #0f766e 100%)",
    heroRadial:
      "radial-gradient(920px 290px at 12% 0%, rgba(16,185,129,0.32), transparent 58%), radial-gradient(780px 280px at 100% 8%, rgba(45,212,191,0.22), transparent 55%)",
    heroLines: "repeating-linear-gradient(110deg, rgba(167,243,208,0.12) 0 2px, transparent 2px 24px)",
    heroBottomOverlay: "linear-gradient(to top, rgba(2,28,23,0.92), rgba(6,72,58,0.58), transparent)",
    heroSideOverlay: "linear-gradient(to right, rgba(2,44,34,0.72), transparent, rgba(15,118,110,0.28))",
    liveCardBg: "linear-gradient(to right, #064e3b, #065f46, #0f766e)",
    liveCardBorder: "rgba(16,185,129,0.35)",
    liveCardShadow: "0 18px 40px rgba(6,95,70,0.35)",
    liveSubText: "rgba(209,250,229,0.92)",
    tabBg: "rgba(167,243,208,0.5)",
    tabActiveBg: "#059669",
    tabActiveShadow: "0 10px 24px rgba(5,150,105,0.3)",
    dateSelectedBg: "#059669",
    dateSelectedShadow: "0 10px 24px rgba(5,150,105,0.35)",
    dateDefaultBg: "#ffffff",
    dateDefaultBorder: "rgba(16,185,129,0.3)",
    surfaceCardBg: "#ffffff",
    surfaceCardBorder: "rgba(16,185,129,0.22)",
    titleColor: "#064e3b",
    mutedStrongColor: "#065f46",
  },
  {
    id: "crimson-night",
    name: "Crimson Night",
    pageBg: "#fef2f2",
    heroBase: "#2a0909",
    heroGradient: "linear-gradient(135deg, #1f0608 0%, #7f1d1d 45%, #b91c1c 100%)",
    heroRadial:
      "radial-gradient(920px 290px at 12% 0%, rgba(248,113,113,0.34), transparent 58%), radial-gradient(760px 260px at 100% 8%, rgba(251,146,60,0.22), transparent 55%)",
    heroLines: "repeating-linear-gradient(110deg, rgba(254,202,202,0.12) 0 2px, transparent 2px 24px)",
    heroBottomOverlay: "linear-gradient(to top, rgba(31,6,8,0.92), rgba(102,18,26,0.58), transparent)",
    heroSideOverlay: "linear-gradient(to right, rgba(31,6,8,0.72), transparent, rgba(153,27,27,0.28))",
    liveCardBg: "linear-gradient(to right, #7f1d1d, #991b1b, #b91c1c)",
    liveCardBorder: "rgba(248,113,113,0.35)",
    liveCardShadow: "0 18px 40px rgba(127,29,29,0.35)",
    liveSubText: "rgba(254,226,226,0.92)",
    tabBg: "rgba(254,202,202,0.5)",
    tabActiveBg: "#dc2626",
    tabActiveShadow: "0 10px 24px rgba(220,38,38,0.3)",
    dateSelectedBg: "#dc2626",
    dateSelectedShadow: "0 10px 24px rgba(220,38,38,0.35)",
    dateDefaultBg: "#ffffff",
    dateDefaultBorder: "rgba(248,113,113,0.3)",
    surfaceCardBg: "#ffffff",
    surfaceCardBorder: "rgba(248,113,113,0.24)",
    titleColor: "#450a0a",
    mutedStrongColor: "#7f1d1d",
  },
  {
    id: "graphite-pro",
    name: "Graphite Pro",
    pageBg: "#f8fafc",
    heroBase: "#0f172a",
    heroGradient: "linear-gradient(135deg, #020617 0%, #1e293b 48%, #334155 100%)",
    heroRadial:
      "radial-gradient(900px 280px at 10% 0%, rgba(148,163,184,0.3), transparent 58%), radial-gradient(760px 260px at 100% 8%, rgba(71,85,105,0.28), transparent 55%)",
    heroLines: "repeating-linear-gradient(110deg, rgba(203,213,225,0.1) 0 2px, transparent 2px 24px)",
    heroBottomOverlay: "linear-gradient(to top, rgba(2,6,23,0.94), rgba(15,23,42,0.62), transparent)",
    heroSideOverlay: "linear-gradient(to right, rgba(2,6,23,0.74), transparent, rgba(51,65,85,0.28))",
    liveCardBg: "linear-gradient(to right, #0f172a, #1e293b, #334155)",
    liveCardBorder: "rgba(148,163,184,0.3)",
    liveCardShadow: "0 18px 40px rgba(15,23,42,0.35)",
    liveSubText: "rgba(226,232,240,0.9)",
    tabBg: "rgba(226,232,240,0.85)",
    tabActiveBg: "#334155",
    tabActiveShadow: "0 10px 24px rgba(51,65,85,0.3)",
    dateSelectedBg: "#334155",
    dateSelectedShadow: "0 10px 24px rgba(51,65,85,0.35)",
    dateDefaultBg: "#ffffff",
    dateDefaultBorder: "rgba(148,163,184,0.4)",
    surfaceCardBg: "#ffffff",
    surfaceCardBorder: "rgba(148,163,184,0.32)",
    titleColor: "#0f172a",
    mutedStrongColor: "#334155",
  },
];

const IPLPage = () => {
  const { data: matches = [], isLoading } = useMatches();
  const [activeTab, setActiveTab] = useState<"schedule" | "stats">("schedule");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (typeof window === "undefined") return IPL_THEMES[0].id;
    return localStorage.getItem("ipl-theme-id") ?? IPL_THEMES[0].id;
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTheme = IPL_THEMES.find((theme) => theme.id === activeThemeId) ?? IPL_THEMES[0];

  // Generate dates spanning from earliest to latest match date
  const dates = useMemo(() => {
    if (matches.length === 0) {
      // fallback: show 14 days from today
      return Array.from({ length: 14 }).map((_, i) => addDays(startOfDay(new Date()), i - 2));
    }
    // Find the min and max match dates
    const matchDates = matches.map((m) => startOfDay(new Date(m.match_date)));
    const minDate = new Date(Math.min(...matchDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...matchDates.map((d) => d.getTime())));
    // Build array of every day between min and max
    const dayCount = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: dayCount }).map((_, i) => addDays(minDate, i));
  }, [matches]);

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
  }, [filteredMatches, matches, selectedMatchId]);

  // Keep selected date chip visible (today by default) in horizontal scroller
  useEffect(() => {
    if (!scrollRef.current) return;
    const key = format(selectedDate, "yyyy-MM-dd");
    const node = scrollRef.current.querySelector<HTMLButtonElement>(`button[data-date-key="${key}"]`);
    if (!node) return;
    node.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedDate, dates]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ipl-theme-id", activeThemeId);
  }, [activeThemeId]);

  const { data: stats, isLoading: isStatsLoading } = useMatchStats(selectedMatchId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066ff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: activeTheme.pageBg }}>
      {/* Top Banner section */}
      <div className="relative h-52 sm:h-72 lg:h-80 w-full overflow-hidden">
        <div className="absolute inset-0" style={{ background: activeTheme.heroBase }}>
          <div className="absolute inset-0" style={{ background: activeTheme.heroGradient }} />
          <div className="absolute inset-0 opacity-55" style={{ background: activeTheme.heroRadial }} />
          <div className="absolute inset-0 opacity-30" style={{ background: activeTheme.heroLines }} />
          <img
            src={heroStadium}
            className="hidden md:block w-full h-full object-cover scale-105 opacity-55 mix-blend-screen"
            alt="IPL Stadium"
          />
          <div className="absolute inset-0" style={{ background: activeTheme.heroBottomOverlay }} />
          <div className="absolute inset-0" style={{ background: activeTheme.heroSideOverlay }} />
        </div>

        {/* Content */}
        <div className="relative z-20 h-full max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col justify-start py-5 sm:py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </Link>
            <button className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all text-white">
              <Search className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-4 sm:mt-7 mb-3 sm:mb-4">
            <h1 className="text-[2rem] leading-[0.98] sm:text-5xl font-black text-white tracking-[0.02em] uppercase drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]" style={{ fontFamily: '"Bebas Neue", "Arial Narrow", sans-serif' }}>
              Indian Premier League
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto -mt-5 sm:-mt-7 relative z-40 px-4 sm:px-6">
        <div
          className="rounded-xl sm:rounded-2xl border p-3 sm:p-4"
          style={{
            borderColor: activeTheme.liveCardBorder,
            background: activeTheme.liveCardBg,
            boxShadow: activeTheme.liveCardShadow,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-white">
            <p className="text-xs sm:text-sm font-black uppercase tracking-[0.16em]">TATA IPL 2026 Live Center</p>
            <p className="text-[9px] sm:text-xs font-bold uppercase tracking-[0.15em]" style={{ color: activeTheme.liveSubText }}>
              Real-time scores - Fixtures - Stats
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {IPL_THEMES.map((theme) => {
            const isActive = theme.id === activeTheme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setActiveThemeId(theme.id)}
                className="px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border"
                style={{
                  color: isActive ? "#ffffff" : activeTheme.mutedStrongColor,
                  background: isActive ? theme.tabActiveBg : "rgba(255,255,255,0.78)",
                  borderColor: isActive ? theme.tabActiveBg : activeTheme.dateDefaultBorder,
                  boxShadow: isActive ? theme.tabActiveShadow : "none",
                }}
              >
                {theme.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-[1600px] mx-auto mt-4 relative z-30 px-4 sm:px-6 space-y-6">
        {/* Tab Selector */}
        <div className="backdrop-blur-md p-1.5 rounded-2xl flex items-center gap-1" style={{ background: activeTheme.tabBg }}>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === "schedule" ? "text-white" : "text-muted-foreground hover:bg-white/50"
            }`}
            style={activeTab === "schedule" ? { background: activeTheme.tabActiveBg, boxShadow: activeTheme.tabActiveShadow } : undefined}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === "stats" ? "text-white" : "text-muted-foreground hover:bg-white/50"
            }`}
            style={activeTab === "stats" ? { background: activeTheme.tabActiveBg, boxShadow: activeTheme.tabActiveShadow } : undefined}
          >
            Statistics
          </button>
        </div>

        {activeTab === "schedule" ? (
          <div className="space-y-6">
            {/* Horizontal Date Scroller */}
            <div ref={scrollRef} className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-2 px-1">
              {dates.map((date, i) => {
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());
                return (
                  <button
                    key={i}
                    data-date-key={format(date, "yyyy-MM-dd")}
                    onClick={() => setSelectedDate(date)}
                    className={`relative flex-shrink-0 w-[3.1rem] h-[5.4rem] sm:w-20 sm:h-24 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-all ${
                      isSelected ? "text-white translate-y-[-4px]" : "text-muted-foreground border"
                    }`}
                    style={
                      isSelected
                        ? {
                            background: activeTheme.dateSelectedBg,
                            boxShadow: activeTheme.dateSelectedShadow,
                          }
                        : {
                            background: activeTheme.dateDefaultBg,
                            borderColor: activeTheme.dateDefaultBorder,
                          }
                    }
                  >
                    <span className="text-lg sm:text-xl font-black">{format(date, "d")}</span>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80">
                      <span className="sm:hidden">{format(date, "MMM")}</span>
                      <span className="hidden sm:inline">{format(date, "MMMM")}</span>
                    </span>
                    {isToday && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-green-500 absolute top-2 right-4" />}
                    {isToday && isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white absolute top-2 right-4" />}
                  </button>
                );
              })}
            </div>

            {/* Pre-match events Title */}
            <div className="pt-2">
              <h2 className="text-2xl font-black tracking-tight" style={{ color: activeTheme.titleColor, fontFamily: "Outfit, sans-serif" }}>
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
                <div className="rounded-[2.5rem] p-16 text-center border border-dashed" style={{ background: activeTheme.surfaceCardBg, borderColor: activeTheme.surfaceCardBorder }}>
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
            <div className="rounded-[2rem] p-6 border shadow-sm flex items-center gap-5" style={{ background: activeTheme.surfaceCardBg, borderColor: activeTheme.surfaceCardBorder }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${activeTheme.tabActiveBg}1a`, color: activeTheme.tabActiveBg }}>
                <LayoutGrid className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black" style={{ color: activeTheme.titleColor }}>Standings</h3>
                <p className="text-xs font-bold text-muted-foreground">Find out the teams' rankings</p>
              </div>
            </div>

            {/* Top Players section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight" style={{ color: activeTheme.titleColor, fontFamily: "Outfit, sans-serif" }}>
                Top players
              </h2>

              {isStatsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 w-full rounded-3xl animate-pulse border" style={{ background: activeTheme.surfaceCardBg, borderColor: activeTheme.surfaceCardBorder }} />
                  ))}
                </div>
              ) : (
                stats?.top_players.map((player, idx) => (
                  <div key={idx} className="rounded-3xl p-4 border shadow-sm flex items-center gap-4 transition-all" style={{ background: activeTheme.surfaceCardBg, borderColor: activeTheme.surfaceCardBorder }}>
                    <div className="text-2xl font-black text-muted-foreground/40 w-8 text-center">{idx + 1}</div>

                    {/* Premium Avatar */}
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] border border-border transition-transform">
                      <div className="absolute inset-0 flex items-center justify-center text-[#0066ff]/20">
                        <Users className="w-8 h-8" />
                      </div>
                      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-black text-sm sm:text-base" style={{ color: activeTheme.titleColor }}>{player.name}</h4>
                      <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {player.country} - {player.team_name}
                      </p>
                    </div>

                    <div className="rounded-2xl px-4 py-2 text-right border" style={{ background: activeTheme.pageBg, borderColor: activeTheme.surfaceCardBorder }}>
                      <div className="flex gap-4">
                        <div>
                          <div className="text-[10px] font-black text-muted-foreground/60 uppercase">GM</div>
                          <div className="font-black" style={{ color: activeTheme.titleColor }}>{player.gm}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-muted-foreground/60 uppercase">{player.stats ? "ST" : "RN"}</div>
                          <div className="font-black" style={{ color: activeTheme.tabActiveBg }}>{player.stats || player.rn}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default IPLPage;
