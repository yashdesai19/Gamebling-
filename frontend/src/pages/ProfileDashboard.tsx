import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

type WalletResponse = { wallet_balance: string };
type Tx = {
  id: number;
  transaction_type: string;
  amount: string;
  status: string;
  created_at: string;
};
type Bet = { id: number; bet_status: string };

function sumAmount(rows: Tx[], types: string[]) {
  return rows
    .filter((t) => types.includes(t.transaction_type) && t.status === "succeeded")
    .reduce((acc, t) => acc + Number(t.amount), 0);
}

function toDayKey(iso: string) {
  const d = new Date(iso);
  // local day key (YYYY-MM-DD)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function lastNDays(n: number) {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(toDayKey(d.toISOString()));
  }
  return out;
}

export default function ProfileDashboardPage() {
  const walletQ = useQuery({ queryKey: ["wallet"], queryFn: () => apiFetch<WalletResponse>("/api/users/wallet") });
  const txQ = useQuery({ queryKey: ["payments-history"], queryFn: () => apiFetch<Tx[]>("/api/payments/history") });
  const betsQ = useQuery({ queryKey: ["bets-history"], queryFn: () => apiFetch<Bet[]>("/api/bets/history") });

  const walletBalance = walletQ.data?.wallet_balance ?? "0.00";
  const txs = txQ.data ?? [];
  const bets = betsQ.data ?? [];

  const totalDeposit = useMemo(() => sumAmount(txs, ["deposit"]), [txs]);
  const totalWithdrawal = useMemo(() => sumAmount(txs, ["withdrawal_paid"]), [txs]);
  const totalPlayed = useMemo(() => Math.abs(sumAmount(txs, ["bet_debit"])), [txs]);

  const winCount = bets.filter((b) => b.bet_status === "won").length;
  const lossCount = bets.filter((b) => b.bet_status === "lost").length;
  const totalWL = winCount + lossCount;
  const winPct = totalWL ? Math.round((winCount / totalWL) * 100) : 0;
  const lossPct = totalWL ? 100 - winPct : 0;

  const balanceSeries = useMemo(() => {
    const current = Number(walletBalance);
    if (!Number.isFinite(current)) return [];

    // Only use succeeded txns (they actually affect balance).
    const succeeded = txs.filter((t) => t.status === "succeeded");
    const totalDelta = succeeded.reduce((acc, t) => acc + Number(t.amount), 0);
    const start = current - totalDelta;

    const days = lastNDays(7);
    const deltaByDay = new Map<string, number>();
    for (const t of succeeded) {
      const k = toDayKey(t.created_at);
      deltaByDay.set(k, (deltaByDay.get(k) ?? 0) + Number(t.amount));
    }

    let running = start;
    return days.map((day) => {
      running += deltaByDay.get(day) ?? 0;
      return { day: day.slice(5), balance: Number(running.toFixed(2)) };
    });
  }, [txs, walletBalance]);

  const pieData = useMemo(() => {
    return [
      { name: "Win", value: winCount },
      { name: "Loss", value: lossCount },
    ];
  }, [lossCount, winCount]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container py-6 md:py-10 space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Performance <span className="text-primary">Dashboard</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Track your betting stats and financial growth</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Total Balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-primary" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{walletBalance}</div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Withdrawals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{totalWithdrawal.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Deposits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{totalDeposit.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Total Played</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{totalPlayed.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-wide text-foreground">Balance Trend</CardTitle>
                <CardDescription>Daily balance growth (Last 7 days).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  {balanceSeries.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={balanceSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} width={40} />
                        <Tooltip />
                        <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full rounded-lg border border-border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">
                      No data yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-wide text-foreground">Win / Loss Ratio</CardTitle>
                <CardDescription>Distribution of settled bets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-48">
                  {totalWL ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip />
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={80}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                          fill="hsl(var(--primary))"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full rounded-lg border border-border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">
                      No settled bets yet.
                    </div>
                  )}
                </div>
                <div className="flex justify-around text-center pt-4 border-t border-border">
                  <div>
                    <div className="text-xl font-black text-emerald-600">{winPct}%</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Win rate</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-red-600">{lossPct}%</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Loss rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

