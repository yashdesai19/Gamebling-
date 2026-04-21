import heroStadium from "@/assets/hero-stadium.jpg";
import tossCoin from "@/assets/toss-coin.png";
import { Trophy, Flame, Users } from "lucide-react";

const stats = [
  { icon: Users, label: "Active Players", value: "12,450+" },
  { icon: Trophy, label: "Matches Today", value: "5" },
  { icon: Flame, label: "Win Streak", value: "🔥 7" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-[520px] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroStadium} alt="Cricket stadium" className="w-full h-full object-cover" width={1920} height={800} />
        <div className="absolute inset-0 bg-gradient-to-r from-cricket-dark/95 via-cricket-dark/85 to-cricket-dark/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-live/20 border border-live/30 rounded-full px-4 py-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-live animate-pulse-live" />
              <span className="text-primary-foreground font-medium">LIVE Matches Available</span>
            </div>

            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold uppercase leading-tight text-primary-foreground">
              Real Money
              <span className="block text-secondary">Betting</span>
            </h1>

            <p className="text-primary-foreground/70 text-lg max-w-md">
              Place toss and match winner bets. Deposit and withdraw real money. Play responsibly (18+).
            </p>

            <div className="flex gap-3">
              <button className="bg-secondary font-heading text-primary-foreground font-bold uppercase px-8 py-3 rounded-lg text-lg tracking-wide hover:opacity-90 transition-opacity shadow-lg">
                Bet Now
              </button>
              <button className="border border-primary-foreground/30 bg-primary-foreground/10 hover:bg-primary-foreground/20 font-heading uppercase px-8 py-3 rounded-lg text-lg tracking-wide transition-colors text-primary-foreground">
                Leaderboard
              </button>
            </div>

            {/* Quick stats */}
            <div className="flex gap-6 pt-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-secondary">
                    <s.icon className="w-4 h-4" />
                    <span className="font-heading font-bold text-xl">{s.value}</span>
                  </div>
                  <span className="text-primary-foreground/60 text-xs">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coin */}
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-secondary/30 rounded-full blur-3xl scale-75" />
              <div className="relative w-72 h-72 drop-shadow-2xl">
                <img
                  src={tossCoin}
                  alt="Toss coin"
                  className="w-full h-full object-contain"
                  loading="lazy"
                  width={512}
                  height={512}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
