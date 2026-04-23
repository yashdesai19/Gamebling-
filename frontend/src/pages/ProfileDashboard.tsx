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

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function normalizeAmount(value: number | string) {
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[₹,\s]/g, "");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: number | string) {
  const amount = normalizeAmount(value);
  return moneyFormatter.format(amount);
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase();
}

function transactionDelta(tx: Tx) {
  const amount = normalizeAmount(tx.amount);
  const type = normalizeStatus(tx.transaction_type);

  switch (type) {
    case "deposit":
    case "bet_payout":
    case "withdrawal_released":
    case "adjustment":
      return amount;
    case "bet_debit":
    case "withdrawal_hold":
    case "withdrawal_paid":
      return -Math.abs(amount);
    default:
      return amount;
  }
}

function sumAmount(rows: Tx[], types: string[]) {
  return rows
    .filter((t) => types.includes(normalizeStatus(t.transaction_type)) && normalizeStatus(t.status) === "succeeded")
    .reduce((acc, t) => acc + transactionDelta(t), 0);
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

  const totalDeposit = useMemo(() => Math.max(0, sumAmount(txs, ["deposit"])), [txs]);
  const totalWithdrawal = useMemo(() => Math.abs(sumAmount(txs, ["withdrawal_paid", "withdrawal_hold"])), [txs]);
  const totalPlayed = useMemo(() => Math.abs(sumAmount(txs, ["bet_debit"])), [txs]);

  const settledBets = useMemo(
    () => bets.filter((b) => ["won", "lost"].includes(normalizeStatus(b.bet_status))),
    [bets],
  );
  const winCount = settledBets.filter((b) => normalizeStatus(b.bet_status) === "won").length;
  const lossCount = settledBets.filter((b) => normalizeStatus(b.bet_status) === "lost").length;
  const totalWL = winCount + lossCount;
  const winPct = totalWL ? Math.round((winCount / totalWL) * 100) : null;
  const lossPct = totalWL ? 100 - Math.round((winCount / totalWL) * 100) : null;

  const balanceSeries = useMemo(() => {
    if (!txs.length) return [];
    const days = lastNDays(7);
    const deltaByDay = new Map<string, number>();
    for (const t of txs.filter((t) => normalizeStatus(t.status) === "succeeded")) {
      const k = toDayKey(t.created_at);
      deltaByDay.set(k, (deltaByDay.get(k) ?? 0) + transactionDelta(t));
    }

    let running = 0;
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Total Balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-[clamp(1.4rem,4.5vw,1.7rem)] leading-none font-black text-primary whitespace-nowrap tabular-nums" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{formatMoney(walletBalance)}</div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Withdrawals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-[clamp(1.4rem,4.5vw,1.7rem)] leading-none font-black text-foreground whitespace-nowrap tabular-nums" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{formatMoney(totalWithdrawal)}</div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Deposits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-[clamp(1.35rem,4.25vw,1.65rem)] leading-none font-black text-foreground whitespace-nowrap tabular-nums" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{formatMoney(totalDeposit)}</div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest">Total Played</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-[clamp(1.35rem,4.25vw,1.65rem)] leading-none font-black text-foreground whitespace-nowrap tabular-nums" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{formatMoney(totalPlayed)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-wide text-foreground">Balance Trend</CardTitle>
                <CardDescription>Daily net balance movement (Last 7 days).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  {balanceSeries.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={balanceSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={84}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => formatMoney(value as number)}
                        />
                        <Tooltip formatter={(value) => `₹${formatMoney(Number(value))}`} />
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
                    <div className="text-xl font-black text-emerald-600">{winPct === null ? "--" : `${winPct}%`}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Win rate</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-red-600">{lossPct === null ? "--" : `${lossPct}%`}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Loss rate</div>
                  </div>
                </div>
                <div className="text-center text-[10px] font-bold text-muted-foreground uppercase">
                  {totalWL ? `${totalWL} settled bets` : "No settled bets yet"}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

