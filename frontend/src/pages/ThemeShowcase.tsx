import { Trophy, Flame, Users, Coins, Medal, TrendingUp } from "lucide-react";
import Logo from "@/components/Logo";

const themes = [
  {
    id: "dark-neon",
    name: "Dark Neon (Gaming)",
    description: "Deep navy/black with neon blue & orange — esports/gaming feel",
    bg: "bg-[#0a0e1a]",
    card: "bg-[#111827]",
    border: "border-[#1e293b]",
    primary: "text-[#3b82f6]",
    primaryBg: "bg-[#3b82f6]",
    accent: "text-[#f97316]",
    accentBg: "bg-[#f97316]",
    text: "text-[#e2e8f0]",
    muted: "text-[#64748b]",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    gradient: "bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]",
    liveBg: "bg-[#ef4444]",
    teamAColor: "#3b82f6",
    teamBColor: "#f97316",
  },
  {
    id: "white-blue",
    name: "White & Blue (Official IPL)",
    description: "Clean white with IPL-official blue & red — professional broadcast look",
    bg: "bg-[#f8fafc]",
    card: "bg-white",
    border: "border-[#e2e8f0]",
    primary: "text-[#1e40af]",
    primaryBg: "bg-[#1e40af]",
    accent: "text-[#dc2626]",
    accentBg: "bg-[#dc2626]",
    text: "text-[#1e293b]",
    muted: "text-[#64748b]",
    glow: "shadow-lg",
    gradient: "bg-gradient-to-r from-[#1e40af] to-[#3b82f6]",
    liveBg: "bg-[#dc2626]",
    teamAColor: "#1e40af",
    teamBColor: "#dc2626",
  },
  {
    id: "purple-gold",
    name: "Purple & Gold (Premium)",
    description: "Royal purple with golden accents — luxury fantasy sports feel",
    bg: "bg-[#0f0a1a]",
    card: "bg-[#1a1128]",
    border: "border-[#2d1f4e]",
    primary: "text-[#a855f7]",
    primaryBg: "bg-[#a855f7]",
    accent: "text-[#eab308]",
    accentBg: "bg-[#eab308]",
    text: "text-[#e8e0f0]",
    muted: "text-[#8b7aaa]",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
    gradient: "bg-gradient-to-r from-[#7c3aed] to-[#a855f7]",
    liveBg: "bg-[#ef4444]",
    teamAColor: "#a855f7",
    teamBColor: "#eab308",
  },
  {
    id: "red-black",
    name: "Red & Black (Bold Fire)",
    description: "Dark charcoal with fiery red & orange — aggressive cricket energy",
    bg: "bg-[#0c0a09]",
    card: "bg-[#1c1917]",
    border: "border-[#292524]",
    primary: "text-[#ef4444]",
    primaryBg: "bg-[#ef4444]",
    accent: "text-[#f97316]",
    accentBg: "bg-[#f97316]",
    text: "text-[#fafaf9]",
    muted: "text-[#78716c]",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
    gradient: "bg-gradient-to-r from-[#ef4444] to-[#f97316]",
    liveBg: "bg-[#ef4444]",
    teamAColor: "#ef4444",
    teamBColor: "#f97316",
  },
];

const ThemeShowcase = () => {
  return (
    <div className="min-h-screen bg-[#f1f5f9] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-wide text-[#0f172a]">
            Choose Your <span className="text-[#16a34a]">Theme</span>
          </h1>
          <p className="text-[#64748b] mt-2 text-lg">Pick the look that matches your <Logo size="sm" /> vibe</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {themes.map((t) => (
            <div key={t.id} className={`${t.bg} rounded-2xl overflow-hidden ${t.glow} border ${t.border}`}>
              {/* Theme Header */}
              <div className={`px-5 py-4 border-b ${t.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className={`w-5 h-5 ${t.primary}`} />
                    <Logo size="sm" className={t.text} />
                  </div>
                  <div className={`flex items-center gap-1.5 ${t.primary} bg-current/10 px-3 py-1 rounded-full`}>
                    <Trophy className={`w-3.5 h-3.5 ${t.primary}`} />
                    <span className={`text-xs font-bold ${t.primary}`}>1,250</span>
                  </div>
                </div>
              </div>

              {/* Hero Mini */}
              <div className={`px-5 py-6 ${t.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-4 w-20 h-20 rounded-full border-2 border-white/30" />
                  <div className="absolute bottom-0 left-8 w-32 h-16 rounded-t-full border-2 border-white/20" />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-white font-medium">LIVE</span>
                  </div>
                  <h2 className="font-heading text-2xl font-bold uppercase text-white leading-tight">
                    Real Money<br />
                    <span className={t.id === "white-blue" ? "text-red-200" : t.id === "purple-gold" ? "text-yellow-300" : t.id === "red-black" ? "text-orange-300" : "text-orange-300"}>
                      Betting
                    </span>
                  </h2>
                  <div className="flex gap-4 mt-3">
                    {[
                      { icon: Users, val: "12K+", label: "Players" },
                      { icon: Trophy, val: "5", label: "Matches" },
                      { icon: Flame, val: "🔥 7", label: "Streak" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <span className="font-heading font-bold text-sm text-white">{s.val}</span>
                        <p className="text-[10px] text-white/60">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Match Card Preview */}
              <div className={`mx-4 my-4 ${t.card} rounded-xl border ${t.border} overflow-hidden`}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className={`text-xs font-medium ${t.muted}`}>Match 1 • Wankhede Stadium</span>
                  <span className={`${t.liveBg} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>LIVE</span>
                </div>
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: t.teamAColor }}>MI</div>
                      <span className={`font-heading font-bold text-sm ${t.text}`}>Mumbai Indians</span>
                    </div>
                    <span className={`font-heading text-lg font-bold ${t.muted}`}>VS</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-heading font-bold text-sm ${t.text}`}>Chennai SK</span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: t.teamBColor }}>CSK</div>
                    </div>
                  </div>

                  {/* Betting Buttons Preview */}
                  <div className="space-y-2">
                    <p className={`text-[10px] uppercase tracking-wider font-bold ${t.muted}`}>🪙 Toss Winner</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button className={`${t.card} border-2 border-current/20 rounded-lg py-1.5 text-xs font-bold ${t.primary} border-[${t.teamAColor}]/30`}>MI</button>
                      <button className={`${t.card} border ${t.border} rounded-lg py-1.5 text-xs font-medium ${t.muted}`}>CSK</button>
                    </div>
                    <p className={`text-[10px] uppercase tracking-wider font-bold ${t.muted}`}>🏏 Match Winner</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button className={`${t.card} border ${t.border} rounded-lg py-1.5 text-xs font-medium ${t.muted}`}>MI</button>
                      <button className={`${t.card} border-2 rounded-lg py-1.5 text-xs font-bold ${t.accent}`}>CSK</button>
                    </div>
                  </div>

                  <button className={`w-full mt-3 ${t.gradient} text-white font-heading font-bold uppercase text-xs py-2 rounded-lg`}>
                    Place Bet
                  </button>
                </div>
              </div>

              {/* Mini Leaderboard */}
              <div className={`mx-4 mb-4 ${t.card} rounded-xl border ${t.border} overflow-hidden`}>
                <div className={`px-4 py-2 border-b ${t.border} flex items-center gap-2`}>
                  <Trophy className={`w-3.5 h-3.5 ${t.primary}`} />
                  <span className={`font-heading text-xs font-bold uppercase ${t.text}`}>Leaderboard</span>
                </div>
                {[
                  { rank: 1, name: "CricketKing99", acc: "78%" },
                  { rank: 2, name: "TossGuru", acc: "74%" },
                  { rank: 3, name: "IPLFanatic", acc: "71%" },
                ].map((p) => (
                  <div key={p.rank} className={`px-4 py-2 flex items-center justify-between border-b last:border-0 ${t.border}`}>
                    <div className="flex items-center gap-2">
                      <Medal className={`w-4 h-4 ${p.rank === 1 ? t.accent : t.muted}`} />
                      <span className={`text-xs font-medium ${t.text}`}>{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`w-3 h-3 ${t.primary}`} />
                      <span className={`text-xs font-bold ${t.primary}`}>{p.acc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Theme Label */}
              <div className={`px-5 py-3 border-t ${t.border} text-center`}>
                <h3 className={`font-heading font-bold uppercase text-sm ${t.text}`}>{t.name}</h3>
                <p className={`text-[11px] mt-0.5 ${t.muted}`}>{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeShowcase;
