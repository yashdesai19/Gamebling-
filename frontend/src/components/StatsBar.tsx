import { Target, Zap, TrendingUp, Award } from "lucide-react";

const stats = [
  { icon: Target, label: "Total Predictions", value: "156", color: "text-primary" },
  { icon: Zap, label: "Toss Accuracy", value: "72%", color: "text-secondary" },
  { icon: TrendingUp, label: "Match Accuracy", value: "65%", color: "text-primary" },
  { icon: Award, label: "Global Rank", value: "#23", color: "text-secondary" },
];

const StatsBar = () => {
  return (
    <section className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-xl p-5 text-center card-hover shadow-sm"
          >
            <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
            <div className="font-heading text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsBar;
