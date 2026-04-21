import { Trophy, TrendingUp, Medal } from "lucide-react";

const players = [
  { rank: 1, name: "CricketKing99", tossWins: 42, matchWins: 35, streak: 7, accuracy: "78%" },
  { rank: 2, name: "TossGuru", tossWins: 39, matchWins: 31, streak: 5, accuracy: "74%" },
  { rank: 3, name: "IPLFanatic", tossWins: 36, matchWins: 29, streak: 4, accuracy: "71%" },
  { rank: 4, name: "SixerMaster", tossWins: 33, matchWins: 27, streak: 3, accuracy: "68%" },
  { rank: 5, name: "BoundaryBoss", tossWins: 30, matchWins: 24, streak: 2, accuracy: "65%" },
];

const Leaderboard = () => {
  return (
    <section className="py-12">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-primary" />
        <h2 className="font-heading text-2xl font-bold uppercase tracking-wide">Leaderboard</h2>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-primary/5 text-xs text-muted-foreground uppercase tracking-wider font-heading">
          <span>Rank</span>
          <span className="col-span-2">Player</span>
          <span className="text-center">Toss</span>
          <span className="text-center">Match</span>
          <span className="text-center">Accuracy</span>
        </div>

        {players.map((p, i) => (
          <div
            key={p.rank}
            className="grid grid-cols-6 gap-4 px-5 py-4 items-center border-t border-border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {i < 3 ? (
                <Medal className={`w-5 h-5 ${i === 0 ? "text-secondary" : i === 1 ? "text-muted-foreground" : "text-warning"}`} />
              ) : (
                <span className="text-muted-foreground font-heading font-bold text-sm ml-0.5">#{p.rank}</span>
              )}
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-heading text-xs font-bold text-primary">
                {p.name.charAt(0)}
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">{p.name}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span>{p.streak} streak</span>
                </div>
              </div>
            </div>
            <span className="text-center font-heading font-bold text-secondary">{p.tossWins}</span>
            <span className="text-center font-heading font-bold text-primary">{p.matchWins}</span>
            <span className="text-center font-heading font-bold text-foreground">{p.accuracy}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Leaderboard;
