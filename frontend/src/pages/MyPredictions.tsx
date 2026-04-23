import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@/lib/types";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays, Search, Copy, Ticket } from "lucide-react";

type PrimaryTab = "ipl" | "color";
type StatusTab = "active" | "settled";
type DatePreset = "today" | "7d" | "30d";

type IPLBetApi = {
  id: number;
  match_id: number;
  bet_type: string;
  predicted_winner_team_id: number;
  bet_amount: string;
  odds: string;
  potential_payout: string;
  bet_status: string;
  created_at: string;
  settled_at: string | null;
};

type ColorChoice = "red" | "green" | "violet";
type ColorBetApi = {
  id: number;
  round_id: number;
  chosen_color: ColorChoice;
  bet_amount: string;
  status: string;
  actual_payout?: string | null;
  commission?: string | null;
  created_at: string;
};

type ColorRoundHistoryItem = {
  id: number;
  round_number: number;
  result_color: ColorChoice;
  status: string;
};

type IplBetView = {
  kind: "ipl";
  id: number;
  statusGroup: StatusTab;
  statusLabel: string;
  title: string;
  subtitle: string;
  selection: "W1" | "W2" | "X";
  stake: number;
  odds: number;
  potential: number;
  createdAt: string;
  settledAt: string | null;
  match?: Match;
  raw: IPLBetApi;
};

type ColorBetView = {
  kind: "color";
  id: number;
  statusGroup: StatusTab;
  statusLabel: string;
  title: string;
  subtitle: string;
  selection: string;
  stake: number;
  potential: number | null;
  createdAt: string;
  settledAt: string | null;
  raw: ColorBetApi;
};

type BetView = IplBetView | ColorBetView;

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatInr(value: number) {
  return `\u20b9${value.toFixed(2)}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function inDatePreset(iso: string, preset: DatePreset) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);

  if (preset === "today") return date >= startToday;
  const lookbackDays = preset === "7d" ? 7 : 30;
  const lookback = new Date(now);
  lookback.setDate(now.getDate() - lookbackDays);
  return date >= lookback;
}

function statusClass(status: string) {
  if (status === "won") return "bg-green-100 text-green-700";
  if (status === "lost") return "bg-red-100 text-red-700";
  if (status === "cancelled") return "bg-gray-100 text-gray-700";
  return "bg-blue-100 text-blue-700";
}

export default function MyPredictionsPage() {
  const { toast } = useToast();
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("ipl");
  const [statusTab, setStatusTab] = useState<StatusTab>("active");
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("7d");
  const [selectedBet, setSelectedBet] = useState<BetView | null>(null);

  const isIpl = primaryTab === "ipl";
  const isColor = primaryTab === "color";
  const shouldPoll = statusTab === "active";

  const betsQ = useQuery({
    queryKey: ["bets-history"],
    queryFn: () => apiFetch<IPLBetApi[]>("/api/bets/history"),
    enabled: isIpl,
    refetchInterval: isIpl && shouldPoll ? 20000 : false,
  });

  const matchesQ = useQuery({
    queryKey: ["matches"],
    queryFn: () => apiFetch<Match[]>("/api/matches/"),
    enabled: isIpl,
    refetchInterval: false,
  });

  const colorBetsQ = useQuery({
    queryKey: ["color-my-bets"],
    queryFn: () => apiFetch<ColorBetApi[]>("/api/color/my-bets"),
    enabled: isColor,
    refetchInterval: isColor && shouldPoll ? 20000 : false,
  });

  const colorHistoryQ = useQuery({
    queryKey: ["color-history"],
    queryFn: () => apiFetch<ColorRoundHistoryItem[]>("/api/color/history"),
    enabled: isColor,
    refetchInterval: false,
  });

  const matchMap = useMemo(() => {
    const map = new Map<number, Match>();
    (matchesQ.data ?? []).forEach((m) => map.set(m.id, m));
    return map;
  }, [matchesQ.data]);

  const roundMap = useMemo(() => {
    const map = new Map<number, number>();
    (colorHistoryQ.data ?? []).forEach((r) => map.set(r.id, r.round_number));
    return map;
  }, [colorHistoryQ.data]);

  const iplRows = useMemo<IplBetView[]>(() => {
    const rows = betsQ.data ?? [];
    return rows.map((bet) => {
      const match = matchMap.get(bet.match_id);
      const team1 = match?.team1;
      const team2 = match?.team2;
      let selection: "W1" | "W2" | "X" = "X";
      if (team1 && bet.predicted_winner_team_id === team1.id) selection = "W1";
      if (team2 && bet.predicted_winner_team_id === team2.id) selection = "W2";

      const statusGroup: StatusTab =
        bet.bet_status === "won" || bet.bet_status === "lost" || bet.bet_status === "cancelled"
          ? "settled"
          : "active";

      const statusLabel =
        statusGroup === "active" && match?.match_status === "completed"
          ? "Awaiting settlement"
          : bet.bet_status;

      const title = match
        ? `${match.team1.short_name} vs ${match.team2.short_name}`
        : `Match #${bet.match_id}`;
      const subtitle = bet.bet_type === "match_winner" ? "Match Winner" : "Toss";

      return {
        kind: "ipl",
        id: bet.id,
        statusGroup,
        statusLabel,
        title,
        subtitle,
        selection,
        stake: toNumber(bet.bet_amount),
        odds: toNumber(bet.odds),
        potential: toNumber(bet.potential_payout),
        createdAt: bet.created_at,
        settledAt: bet.settled_at,
        match,
        raw: bet,
      };
    });
  }, [betsQ.data, matchMap]);

  const colorRows = useMemo<ColorBetView[]>(() => {
    const rows = colorBetsQ.data ?? [];
    return rows.map((bet) => {
      const settled =
        bet.status === "won" ||
        bet.status === "lost" ||
        bet.status === "cancelled" ||
        bet.actual_payout !== null;
      const roundNumber = roundMap.get(bet.round_id);
      const payout = bet.actual_payout !== undefined && bet.actual_payout !== null ? toNumber(bet.actual_payout) : null;
      return {
        kind: "color",
        id: bet.id,
        statusGroup: settled ? "settled" : "active",
        statusLabel: bet.status,
        title: `Color Round #${roundNumber ?? bet.round_id}`,
        subtitle: "Color Trade",
        selection: bet.chosen_color.toUpperCase(),
        stake: toNumber(bet.bet_amount),
        potential: payout,
        createdAt: bet.created_at,
        settledAt: null,
        raw: bet,
      };
    });
  }, [colorBetsQ.data, roundMap]);

  const rows = useMemo<BetView[]>(() => {
    const base = isIpl ? iplRows : colorRows;
    const keyword = search.trim().toLowerCase();
    return base
      .filter((row) => row.statusGroup === statusTab)
      .filter((row) => inDatePreset(row.createdAt, datePreset))
      .filter((row) => {
        if (!keyword) return true;
        const haystack = `${row.title} ${row.subtitle} ${row.selection} ${row.id}`.toLowerCase();
        return haystack.includes(keyword);
      });
  }, [isIpl, iplRows, colorRows, statusTab, datePreset, search]);

  const isLoading = isIpl
    ? betsQ.isLoading || matchesQ.isLoading
    : colorBetsQ.isLoading || colorHistoryQ.isLoading;
  const isError = isIpl
    ? betsQ.isError || matchesQ.isError
    : colorBetsQ.isError || colorHistoryQ.isError;

  const retryLoad = async () => {
    if (isIpl) {
      await betsQ.refetch();
      await matchesQ.refetch();
      return;
    }
    await colorBetsQ.refetch();
    await colorHistoryQ.refetch();
  };

  const copyBetId = async (id: number) => {
    const text = String(id);
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!copied) throw new Error("copy command failed");
      }
      toast({ title: "Bet ID copied", description: `#${id}` });
    } catch {
      try {
        window.prompt("Copy Bet ID", text);
      } finally {
        toast({ title: "Copy failed", description: "Tap and hold the value to copy it.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 pt-20 sm:pt-24">
      <main className="container max-w-lg mx-auto px-4 space-y-4">
        <div className="pt-2">
          <h1 className="text-3xl font-black text-foreground tracking-tight">My Bets</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your IPL bets and Color trades in one place.</p>
        </div>

        <div className="rounded-2xl bg-white border border-border p-1.5 grid grid-cols-2 gap-1">
          <button
            onClick={() => {
              setPrimaryTab("ipl");
              setStatusTab("active");
            }}
            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${
              isIpl ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/40"
            }`}
          >
            IPL Bets
          </button>
          <button
            onClick={() => {
              setPrimaryTab("color");
              setStatusTab("active");
            }}
            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${
              isColor ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/40"
            }`}
          >
            Color Trades
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-border p-1.5 flex items-stretch gap-1 w-full overflow-hidden">
          <button
            onClick={() => setStatusTab("active")}
            className={`flex-1 min-w-0 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-center whitespace-nowrap ${
              statusTab === "active" ? "bg-[#1f232b] text-white shadow-sm" : "bg-[#f5f7fb] text-[#64748b] hover:bg-[#e9eef7]"
            }`}
          >
            Active
          </button>
          <div className="w-px self-stretch bg-border/70" />
          <button
            onClick={() => setStatusTab("settled")}
            className={`flex-1 min-w-0 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-center whitespace-nowrap ${
              statusTab === "settled" ? "bg-[#1f232b] text-white shadow-sm" : "bg-[#f5f7fb] text-[#64748b] hover:bg-[#e9eef7]"
            }`}
          >
            Settled
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-border p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isIpl ? "Search by team or bet id" : "Search by round or bet id"}
              className="pl-9 bg-muted/40 border-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["today", "7d", "30d"] as DatePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`rounded-lg py-2 text-[11px] font-black uppercase tracking-wider border ${
                  datePreset === preset
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-muted-foreground border-border"
                }`}
              >
                {preset === "today" ? "Today" : preset === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-2xl bg-white border border-border animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-2xl bg-white border border-border p-6 text-center">
            <p className="text-sm font-bold text-muted-foreground">Couldn&apos;t load your bets right now.</p>
            <Button onClick={retryLoad} className="mt-3">
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <div className="rounded-2xl bg-white border border-border p-6 text-center">
            <p className="text-sm font-bold text-muted-foreground">
              {isIpl ? "No bets yet for this filter." : "No color trades yet for this filter."}
            </p>
            <Link
              to={isIpl ? "/ipl" : "/color-game"}
              className="inline-flex mt-3 px-4 py-2 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-wider"
            >
              {isIpl ? "Go to IPL" : "Go to Color Game"}
            </Link>
          </div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((row) => (
              <button
                key={`${row.kind}-${row.id}`}
                onClick={() => setSelectedBet(row)}
                className="w-full text-left rounded-2xl bg-white border border-border p-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-foreground">{row.title}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{row.subtitle}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${statusClass(row.statusLabel)}`}>
                    {row.statusLabel}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Selection</p>
                    <p className="text-sm font-black">{row.selection}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Stake</p>
                    <p className="text-sm font-black">{formatInr(row.stake)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">
                      {row.kind === "ipl" ? "Potential" : row.potential !== null ? "Payout" : "Potential"}
                    </p>
                    <p className="text-sm font-black text-primary">
                      {row.potential !== null ? formatInr(row.potential) : "-"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                  <span>Placed: {formatDate(row.createdAt)}</span>
                  {row.statusGroup === "settled" && <span>Settled: {formatDate(row.settledAt)}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <Sheet open={Boolean(selectedBet)} onOpenChange={(open) => (!open ? setSelectedBet(null) : null)}>
        <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-[calc(env(safe-area-inset-bottom)+14px)]">
          {selectedBet && (
            <div className="max-w-lg mx-auto px-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black">Bet Details</h3>
                <button
                  type="button"
                  onClick={() => copyBetId(selectedBet.id)}
                  className="inline-flex items-center gap-1 text-xs font-black uppercase text-primary"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy ID
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-foreground">{selectedBet.title}</p>
                    <p className="text-xs font-bold text-muted-foreground">{selectedBet.subtitle}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${statusClass(selectedBet.statusLabel)}`}>
                    {selectedBet.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Bet ID</p>
                    <p className="font-black">#{selectedBet.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Selection</p>
                    <p className="font-black">{selectedBet.selection}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Stake</p>
                    <p className="font-black">{formatInr(selectedBet.stake)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">
                      {selectedBet.kind === "ipl" ? "Potential Payout" : "Payout"}
                    </p>
                    <p className="font-black text-primary">
                      {selectedBet.potential !== null ? formatInr(selectedBet.potential) : "-"}
                    </p>
                  </div>
                </div>

                {selectedBet.kind === "ipl" ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Bet Type</p>
                      <p className="font-black">{selectedBet.raw.bet_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Odds</p>
                      <p className="font-black">{selectedBet.odds.toFixed(3)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Commission</p>
                      <p className="font-black">{selectedBet.raw.commission ? formatInr(toNumber(selectedBet.raw.commission)) : "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Actual Payout</p>
                      <p className="font-black text-primary">
                        {selectedBet.raw.actual_payout ? formatInr(toNumber(selectedBet.raw.actual_payout)) : "-"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs font-bold text-muted-foreground pt-2 border-t border-border">
                  <div className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Placed: {formatDate(selectedBet.createdAt)}
                  </div>
                  <div className="text-right">
                    Settled: {formatDate(selectedBet.settledAt)}
                  </div>
                </div>
              </div>

              <Button className="w-full mt-4" onClick={() => setSelectedBet(null)}>
                Close
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
