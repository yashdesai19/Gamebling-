import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown, Menu, User as UserIcon, LogOut, Pencil, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearAuthToken, apiFetch } from "@/lib/api";
import { clearAdminToken, adminFetch } from "@/lib/adminApi";

type WalletResponse = { wallet_balance: string };
type UserMe = { id: number; username: string; email: string };
type AdminMe = { id: number; username: string };

function getUserToken(): string | null {
  return localStorage.getItem("access_token");
}

function getAdminToken(): string | null {
  return localStorage.getItem("admin_access_token");
}

export default function NavbarAccountMenu() {
  const nav = useNavigate();
  const userAuthed = Boolean(getUserToken());
  const adminAuthed = Boolean(getAdminToken());

  const mode: "user" | "admin" | "none" = userAuthed ? "user" : adminAuthed ? "admin" : "none";

  const walletQ = useQuery({
    queryKey: ["navbar-wallet"],
    enabled: mode === "user",
    queryFn: () => apiFetch<WalletResponse>("/api/users/wallet"),
    refetchInterval: 15000,
  });

  const meQ = useQuery({
    queryKey: ["navbar-me"],
    enabled: mode === "user",
    queryFn: () => apiFetch<UserMe>("/api/auth/me"),
    staleTime: 30_000,
  });

  const adminMeQ = useQuery({
    queryKey: ["navbar-admin-me"],
    enabled: mode === "admin",
    queryFn: () => adminFetch<AdminMe>("/api/admin/me"),
    staleTime: 30_000,
  });

  const balanceLabel = useMemo(() => {
    const b = walletQ.data?.wallet_balance ?? "0.00";
    return `₹${b}`;
  }, [walletQ.data?.wallet_balance]);

  const avatarLetter = useMemo(() => {
    const name = mode === "user" ? meQ.data?.username : adminMeQ.data?.username;
    const s = (name ?? "").trim();
    return (s ? s[0] : "U").toUpperCase();
  }, [adminMeQ.data?.username, meQ.data?.username, mode]);

  if (mode === "none") return null;

  const onLogoutUser = () => {
    clearAuthToken();
    nav("/login");
  };

  const onLogoutAdmin = () => {
    clearAdminToken();
    nav("/admin/login");
  };

  return (
    <div className="flex items-center gap-3">
      {mode === "user" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 gap-2 font-heading font-bold tracking-wide"
              aria-label="Wallet balance"
            >
              <span>{balanceLabel}</span>
              <ChevronDown className="w-4 h-4 opacity-80" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="font-heading uppercase tracking-wide">Wallet</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/wallet">Open Wallet</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full" aria-label="Notifications">
            <Bell className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-heading uppercase tracking-wide">Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-3 py-3 text-sm text-muted-foreground">No notifications yet.</div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full" aria-label="Account">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary font-heading font-bold">{avatarLetter}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-heading uppercase tracking-wide">Account</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {mode === "user" ? (
            <>
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
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
              <DropdownMenuItem onClick={onLogoutUser}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link to="/admin/profile">
                  <UserIcon className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/profile">
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogoutAdmin}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="icon" className="rounded-full" aria-label="Menu">
        <Menu className="w-4 h-4" />
      </Button>
    </div>
  );
}

