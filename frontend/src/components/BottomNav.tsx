import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Trophy, User, Bell, LogOut, Lock, Pencil, Plus } from "lucide-react";
import { apiFetch, clearAuthToken } from "@/lib/api";
import Logo from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type WalletResponse = { wallet_balance: string };
type UserMe = { id: number; username: string; email: string };

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/wallet", icon: Plus, label: "Deposit" },
  { to: "/my-bets", icon: Trophy, label: "My Bets" },
  { to: "/profile", icon: User, label: "Account" },
];

const BottomNav = () => {
  const nav = useNavigate();
  const location = useLocation();
  const isAuthed = Boolean(localStorage.getItem("access_token"));

  const { data: walletData } = useQuery({
    queryKey: ["wallet-bal"],
    queryFn: () => apiFetch<WalletResponse>("/api/users/wallet"),
    enabled: isAuthed,
    refetchInterval: 30000,
  });

  const meQ = useQuery({
    queryKey: ["topbar-me"],
    queryFn: () => apiFetch<UserMe>("/api/auth/me"),
    enabled: isAuthed,
    staleTime: 30000,
  });

  const avatarLetter = useMemo(() => {
    const name = (meQ.data?.username ?? "").trim();
    return (name ? name[0] : "U").toUpperCase();
  }, [meQ.data?.username]);

  const onLogout = () => {
    clearAuthToken();
    localStorage.removeItem("admin_access_token");
    nav("/login");
  };

  return (
    <>
      {/* Top Header Bar */}
      <header 
        className="fixed top-0 left-0 right-0 h-16 sm:h-20 z-50 flex items-center justify-between pl-2 pr-4 sm:px-8 bg-white border-b border-border shadow-sm shadow-primary/5"
      >
        <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between">
          {/* LEFT: Wallet Balance (Pill style with green plus) */}
          <div className="flex-1 flex items-center justify-start">
            {isAuthed ? (
              <Link to="/wallet" className="flex items-center gap-1.5 sm:gap-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-full py-1 pl-1 pr-2 sm:pr-3 transition-all border border-border/50 group">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#00c569] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                </div>
                <span className="text-[10px] sm:text-sm font-black text-foreground whitespace-nowrap">
                  {walletData?.wallet_balance ?? "0"} ₹
                </span>
              </Link>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 sm:gap-2 bg-[#f1f5f9] rounded-full py-1 pl-1 pr-2 sm:pr-3 opacity-80 cursor-pointer">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#00c569] flex items-center justify-center text-white">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                </div>
                <span className="text-[10px] sm:text-sm font-black text-foreground">0 ₹</span>
              </Link>
            )}
          </div>

          {/* CENTER: Logo */}
          <div className="flex-1 flex items-center justify-center">
            <Link to="/" className="flex items-center">
              <Logo size="md" />
            </Link>
          </div>

          {/* RIGHT: Account/Login */}
          <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2">
            {!isAuthed ? (
              <Link
                to="/login"
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#0f172a] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                Login
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Open account menu"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border cursor-pointer hover:border-primary transition-colors text-muted-foreground font-black text-xs sm:text-sm"
                  >
                    {avatarLetter}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-heading uppercase tracking-wide">Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile/edit">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile/password">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>


      {/* Bottom Navigation (Mobile Only) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 h-16 z-50 bg-white border-t border-gray-200 md:hidden pb-safe"
        style={{
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to ||
              (to === "/ipl" && location.pathname.startsWith("/ipl")) ||
              (to === "/color-game" && location.pathname.startsWith("/color-game"));
            
            return (
              <Link
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 relative group"
              >
                <div className={`transition-all duration-200 ${isActive ? "-translate-y-0.5" : ""}`}>
                  <Icon 
                    className={`w-6 h-6 ${
                      isActive 
                        ? "text-primary stroke-[2.5px]" 
                        : "text-muted-foreground stroke-[1.5px]"
                    }`}
                  />
                </div>
                
                <span className={`text-[10px] font-black tracking-tight ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;

