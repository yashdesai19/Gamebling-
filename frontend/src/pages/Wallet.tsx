import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, ApiError } from "@/lib/api";
import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";

type WalletResponse = { wallet_balance: string };
type PayoutDetails = { bank_details: string | null; upi_id: string | null };
type Tx = {
  id: number;
  transaction_type: string;
  amount: string;
  payment_method: string | null;
  status: string;
  reference: string | null;
  created_at: string;
};

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return "0.00";
  return moneyFormatter.format(amount);
}

function parseSavedPayoutDetails(value: string | null) {
  const text = value ?? "";
  const read = (patterns: RegExp[]) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return "";
  };

  return {
    bankName: read([/Bank Name\s*[:\-]\s*([^|]+)(?:\||$)/i, /\bBank\s*[:\-]\s*([^|]+)(?:\||$)/i]),
    accountHolderName: read([/Account Holder\s*[:\-]\s*([^|]+)(?:\||$)/i, /\bHolder\s*[:\-]\s*([^|]+)(?:\||$)/i]),
    accountNumber: read([/Account Number\s*[:\-]\s*([^|]+)(?:\||$)/i, /\bAcc(?:ount)?\s*No\.?\s*[:\-]\s*([^|]+)(?:\||$)/i]),
    ifscCode: read([/IFSC(?: Code)?\s*[:\-]\s*([^|]+)(?:\||$)/i]),
  };
}

export default function WalletPage() {
  const { toast } = useToast();
  const isAuthed = Boolean(localStorage.getItem("access_token"));
  const [depositAmount, setDepositAmount] = useState("100");
  const [withdrawAmount, setWithdrawAmount] = useState("500");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [lastPaymentLinkId, setLastPaymentLinkId] = useState<string | null>(() => localStorage.getItem("last_payment_link_id"));
  const [screen, setScreen] = useState<"overview" | "deposit" | "withdraw">("overview");

  const walletQ = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<WalletResponse>("/api/users/wallet"),
  });

  const payoutQ = useQuery({
    queryKey: ["wallet-payout-details"],
    queryFn: () => apiFetch<PayoutDetails>("/api/users/bank_details"),
    enabled: isAuthed,
  });

  const historyQ = useQuery({
    queryKey: ["payments-history"],
    queryFn: () => apiFetch<Tx[]>("/api/payments/history"),
  });

  const depositM = useMutation({
    mutationFn: () =>
      apiFetch<{ tx_id: number; payment_link_id: string; short_url: string }>("/api/payments/deposit", {
        method: "POST",
        body: JSON.stringify({ amount: Number(depositAmount), payment_method: "razorpay" }),
      }),
    onSuccess: (data) => {
      localStorage.setItem("last_payment_link_id", data.payment_link_id);
      setLastPaymentLinkId(data.payment_link_id);
      window.location.href = data.short_url;
    },
    onError: (e) => {
      const err = e as ApiError;
      toast({ title: "Deposit failed", description: err.message, variant: "destructive" });
    },
  });

  const verifyM = useMutation({
    mutationFn: () => {
      if (!lastPaymentLinkId) throw new ApiError("No payment link to verify", 400, {});
      return apiFetch<Tx>(`/api/payments/razorpay/verify/${encodeURIComponent(lastPaymentLinkId)}`);
    },
    onSuccess: async (tx) => {
      if (tx.status === "succeeded") {
        toast({ title: "Payment verified", description: "Wallet updated." });
        localStorage.removeItem("last_payment_link_id");
        setLastPaymentLinkId(null);
      } else {
        toast({ title: "Not paid yet", description: `Current status: ${tx.status}` });
      }
      await walletQ.refetch();
      await historyQ.refetch();
    },
    onError: (e) => {
      const err = e as ApiError;
      toast({ title: "Verify failed", description: err.message, variant: "destructive" });
    },
  });

  const withdrawM = useMutation({
    mutationFn: () =>
      apiFetch("/api/payments/withdraw_request", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          bank_name: bankName.trim() || null,
          account_holder_name: accountHolderName.trim() || null,
          account_number: accountNumber.trim() || null,
          ifsc_code: ifscCode.trim() || null,
          upi_id: upiId.trim() || null,
        }),
      }),
    onSuccess: async () => {
      toast({ title: "Withdrawal requested" });
      await walletQ.refetch();
      await historyQ.refetch();
    },
    onError: (e) => {
      const err = e as ApiError;
      toast({ title: "Withdraw failed", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    const saved = payoutQ.data;
    if (!saved) return;

    const parsed = parseSavedPayoutDetails(saved.bank_details);

    if (!upiId && saved.upi_id) setUpiId(saved.upi_id);
    if (!bankName && parsed.bankName) setBankName(parsed.bankName);
    if (!accountHolderName && parsed.accountHolderName) setAccountHolderName(parsed.accountHolderName);
    if (!accountNumber && parsed.accountNumber) setAccountNumber(parsed.accountNumber);
    if (!ifscCode && parsed.ifscCode) setIfscCode(parsed.ifscCode);
  }, [accountHolderName, accountNumber, bankName, ifscCode, payoutQ.data, upiId]);

  const activeTab = screen === "withdraw" ? "withdraw" : "deposit";
  const isOverview = screen === "overview";
  const balance = walletQ.data?.wallet_balance ?? "0.00";
  const rows = useMemo(() => historyQ.data ?? [], [historyQ.data]);
  const filteredRows = useMemo(() => {
    return rows.filter((t) => {
      if (activeTab === "deposit") return t.transaction_type === "deposit";
      return t.transaction_type.startsWith("withdrawal_");
    });
  }, [activeTab, rows]);

  const historyTitle = activeTab === "deposit" ? "Deposit History" : "Withdraw History";
  const historyEmptyText = activeTab === "deposit" ? "No deposits yet." : "No withdrawals yet.";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container mx-auto max-w-4xl space-y-6 px-4 pb-8 pt-24">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-foreground" style={{ fontFamily: "Outfit, sans-serif" }}>
              Your <span className="text-primary">Wallet</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Add money, withdraw funds, and track everything separately.</p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,_#0b0f19_0%,_#111827_55%,_#1f2937_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.18)] sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.10),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.10),_transparent_30%)]" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">Available Balance</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl" style={{ fontFamily: "Outfit, sans-serif" }}>
                ₹{formatMoney(balance)}
              </h2>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setScreen("deposit")}
              className={`group rounded-[1.8rem] border p-4 text-left transition-all duration-200 ${
                activeTab === "deposit" && !isOverview
                  ? "border-emerald-200 bg-[linear-gradient(135deg,_#ecfdf5_0%,_#ffffff_100%)] shadow-[0_16px_40px_rgba(16,185,129,0.12)]"
                  : "border-border bg-white shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 flex-none items-center justify-center rounded-2xl ${
                    activeTab === "deposit" && !isOverview ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"
                  }`}
                >
                  <ArrowDownToLine className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-[0.28em] ${activeTab === "deposit" && !isOverview ? "text-emerald-700" : "text-muted-foreground"}`}>
                    Deposit
                  </p>
                  <h3 className="mt-1 text-lg font-black text-foreground">Add funds</h3>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Top up your wallet and keep deposit history separate.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScreen("withdraw")}
              className={`group rounded-[1.8rem] border p-4 text-left transition-all duration-200 ${
                activeTab === "withdraw" && !isOverview
                  ? "border-slate-300 bg-[linear-gradient(135deg,_#f8fafc_0%,_#ffffff_100%)] shadow-[0_16px_40px_rgba(15,23,42,0.10)]"
                  : "border-border bg-white shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 flex-none items-center justify-center rounded-2xl ${
                    activeTab === "withdraw" && !isOverview ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  <ArrowUpFromLine className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-[0.28em] ${activeTab === "withdraw" && !isOverview ? "text-slate-700" : "text-muted-foreground"}`}>
                    Withdraw
                  </p>
                  <h3 className="mt-1 text-lg font-black text-foreground">Send money out</h3>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Enter payout details and keep withdrawal history separate.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {!isOverview ? (
            <>
              <section className="rounded-[2rem] border border-border/60 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${activeTab === "deposit" ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"}`}>
                      {activeTab === "deposit" ? <ArrowDownToLine className="h-6 w-6" /> : <ArrowUpFromLine className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                        {activeTab === "deposit" ? "Deposit section" : "Withdraw section"}
                      </p>
                      <h3 className="text-xl font-black text-foreground">
                        {activeTab === "deposit" ? "Add money to wallet" : "Withdraw to bank or UPI"}
                      </h3>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full border-border px-4 font-black uppercase tracking-widest text-foreground"
                    onClick={() => setScreen("overview")}
                  >
                    Back
                  </Button>
                </div>

                {activeTab === "deposit" ? (
              <div className="mt-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-1">
                  <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">ENTER AMOUNT</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-foreground">₹</span>
                    <Input
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      inputMode="decimal"
                      placeholder="0.00"
                      className="h-14 rounded-xl border-none bg-muted/50 pl-10 text-xl font-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDepositAmount(String(v))}
                      className={`rounded-xl py-3 text-sm font-black transition-all ${
                        depositAmount === String(v) ? "bg-slate-900 text-white" : "bg-muted/70 text-foreground hover:bg-muted"
                      }`}
                    >
                      ₹{v}
                    </button>
                  ))}
                </div>

                <Button
                  className="mt-4 h-14 w-full rounded-xl bg-slate-900 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-95"
                  onClick={() => depositM.mutate()}
                  disabled={depositM.isPending}
                >
                  {depositM.isPending ? "Generating Link..." : "Add Funds Now"}
                </Button>

                {lastPaymentLinkId && (
                  <Button
                    variant="outline"
                    className="mt-2 h-12 w-full rounded-xl border-border font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted/40"
                    onClick={() => verifyM.mutate()}
                    disabled={verifyM.isPending}
                  >
                    {verifyM.isPending ? "Checking..." : "Verify Last Payment"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="mt-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">ENTER AMOUNT</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-foreground">₹</span>
                      <Input
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        inputMode="decimal"
                        placeholder="0.00"
                        className="h-14 rounded-xl border-none bg-muted/50 pl-10 text-xl font-black"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">UPI ID</label>
                    <Input
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="example@upi"
                      className="h-14 rounded-xl border-none bg-muted/50 px-4 font-bold"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">BANK NAME</label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Bank of India"
                      className="h-12 rounded-xl border-none bg-muted/50 px-4 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">ACCOUNT HOLDER NAME</label>
                    <Input
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Full name"
                      className="h-12 rounded-xl border-none bg-muted/50 px-4 font-bold"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">ACCOUNT NUMBER</label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="1234567890"
                      className="h-12 rounded-xl border-none bg-muted/50 px-4 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="pl-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">IFSC CODE</label>
                    <Input
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                      className="h-12 rounded-xl border-none bg-muted/50 px-4 font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  We will use these details for this withdrawal request. If you already saved payout info in Profile, we prefill what we can.
                </div>

                <Button
                  className="mt-2 h-14 w-full rounded-xl bg-slate-900 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-95"
                  onClick={() => withdrawM.mutate()}
                  disabled={withdrawM.isPending}
                >
                  {withdrawM.isPending ? "Submitting..." : "Withdraw Funds"}
                </Button>
              </div>
                )}
              </section>

              <section className="rounded-[2rem] border border-border/60 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">{historyTitle}</p>
                    <h3 className="text-lg font-black text-foreground">
                      {activeTab === "deposit" ? "Deposit activity only" : "Withdrawal activity only"}
                    </h3>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
              {filteredRows.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.transaction_type === "deposit" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-700"}`}>
                      {t.transaction_type === "deposit" ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase text-foreground">
                        {t.transaction_type === "deposit" ? "Deposit" : "Withdrawal"}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground">
                        {new Date(t.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black ${t.transaction_type === "deposit" ? "text-emerald-600" : "text-foreground"}`}>
                      {t.transaction_type === "deposit" ? "+" : "-"}₹{String(t.amount).replace(/^-/, "")}
                    </div>
                    <div
                      className={`text-[10px] font-black uppercase tracking-tight ${
                        t.status === "succeeded" ? "text-emerald-600" : t.status === "pending" ? "text-yellow-600" : "text-red-600"
                      }`}
                    >
                      {t.status}
                    </div>
                  </div>
                </div>
              ))}

              {filteredRows.length === 0 && <div className="py-6 text-center text-sm font-bold text-muted-foreground">{historyEmptyText}</div>}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
