import { 
  PlayCircle, Star, Zap, Bookmark, Wallet
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const categories = [
  { group: "MENU", items: [
    { name: "Live Sports", icon: PlayCircle, path: "/ipl", active: true },
    { name: "Wallet", icon: Wallet, path: "/wallet" },
    { name: "Upcoming", icon: Zap, path: "/upcoming" },
    { name: "My Predictions", icon: Bookmark, path: "/my-predictions" },
  ]}
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-full h-fit space-y-8 pr-4">
      {categories.map((group) => (
        <div key={group.group} className="space-y-3">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {group.group}
          </h4>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = location.pathname === item.path || item.active;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between group px-4 py-3 rounded-2xl transition-all ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span className="text-xs font-black tracking-tight">{item.name}</span>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground opacity-50" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Mini Promotion or Filter */}
      <div className="mt-8 p-6 rounded-[2rem] bg-muted/30 border border-muted/50 overflow-hidden relative group cursor-pointer hover:border-primary/30 transition-all">
         <div className="relative z-10">
            <h5 className="text-[10px] font-black text-foreground uppercase tracking-wider mb-1">VIP Club</h5>
            <p className="text-[9px] text-muted-foreground font-bold">Earn 5% more on all Cricket bets.</p>
         </div>
         <Star className="absolute -bottom-2 -right-2 w-12 h-12 text-primary/5 transform -rotate-12 group-hover:scale-110 transition-transform" />
      </div>
    </aside>
  );
};

export default Sidebar;
