import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, ApiError } from "@/lib/api";
import { ArrowDownToLine, ArrowUpFromLine, History, Wallet as WalletIcon } from "lucide-react";

type WalletResponse = { wallet_balance: string };
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

export default function WalletPage() {
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState("100");
  const [withdrawAmount, setWithdrawAmount] = useState("500");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [lastPaymentLinkId, setLastPaymentLinkId] = useState<string | null>(() => localStorage.getItem("last_payment_link_id"));

  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  const walletQ = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<WalletResponse>("/api/users/wallet"),
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
          upi_id: upiId || null,
          bank_details: bankDetails || null,
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

  const balance = walletQ.data?.wallet_balance ?? "0.00";
  const rows = useMemo(() => historyQ.data ?? [], [historyQ.data]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container max-w-lg mx-auto px-4 py-8 space-y-6">
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Your <span className="text-primary">Wallet</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Add or withdraw funds instantly.</p>
          </div>

          {/* Balance Card */}
          <div className="rounded-3xl p-8 glass-card bg-primary text-white text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <WalletIcon className="w-32 h-32" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/70 mb-1 relative z-10">Available Balance</p>
            <h2 className="text-5xl font-black tracking-tight relative z-10" style={{ fontFamily: 'Outfit, sans-serif' }}>₹{balance}</h2>
          </div>

          {/* Action Tabs */}
          <div className="flex bg-muted/60 rounded-2xl p-1 shadow-inner">
            <button
              onClick={() => setActiveTab("deposit")}
              className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${
                activeTab === "deposit" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownToLine className="w-4 h-4" /> Deposit
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${
                activeTab === "withdraw" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpFromLine className="w-4 h-4" /> Withdraw
            </button>
          </div>

          <div className="rounded-3xl p-6 glass-card bg-white shadow-sm">
            {activeTab === "deposit" ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">ENTER AMOUNT</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-black text-xl">₹</span>
                    <Input 
                      value={depositAmount} 
                      onChange={(e) => setDepositAmount(e.target.value)} 
                      inputMode="decimal" 
                      placeholder="0.00" 
                      className="h-14 pl-10 bg-muted/50 border-none font-black text-xl rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      onClick={() => setDepositAmount(String(v))}
                      className={`py-3 rounded-xl text-sm font-black transition-all ${
                        depositAmount === String(v) ? "bg-primary text-white" : "bg-muted/70 text-foreground hover:bg-muted"
                      }`}
                    >
                      ₹{v}
                    </button>
                  ))}
                </div>

                <Button
                  className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 mt-4 transition-all hover:scale-[1.02] active:scale-95"
                  onClick={() => depositM.mutate()}
                  disabled={depositM.isPending}
                >
                  {depositM.isPending ? "Generating Link..." : "Add Funds Now"}
                </Button>

                {lastPaymentLinkId && (
                  <Button
                    variant="outline"
                    className="w-full h-12 mt-2 font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 rounded-xl transition-all"
                    onClick={() => verifyM.mutate()}
                    disabled={verifyM.isPending}
                  >
                    {verifyM.isPending ? "Checking..." : "Verify Last Payment"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">ENTER AMOUNT</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-black text-xl">₹</span>
                    <Input 
                      value={withdrawAmount} 
                      onChange={(e) => setWithdrawAmount(e.target.value)} 
                      inputMode="decimal" 
                      placeholder="0.00" 
                      className="h-14 pl-10 bg-muted/50 border-none font-black text-xl rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="UPI ID (optional if saved)" className="h-12 bg-muted/50 border-none font-bold rounded-xl px-4" />
                  <Input value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} placeholder="Bank Details (optional if saved)" className="h-12 bg-muted/50 border-none font-bold rounded-xl px-4" />
                </div>

                <Button
                  className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 mt-4 transition-all hover:scale-[1.02] active:scale-95"
                  onClick={() => withdrawM.mutate()}
                  disabled={withdrawM.isPending}
                >
                  {withdrawM.isPending ? "Submitting..." : "Withdraw Funds"}
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-3xl p-6 glass-card bg-white shadow-sm mt-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Recent Transactions</h3>
            </div>
            
            <div className="space-y-3">
              {rows.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.transaction_type === "deposit" ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                      {t.transaction_type === "deposit" ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase text-foreground">{t.transaction_type}</div>
                      <div className="text-[10px] font-bold text-muted-foreground">{new Date(t.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black ${t.transaction_type === 'deposit' ? 'text-emerald-600' : 'text-foreground'}`}>
                      {t.transaction_type === 'deposit' ? '+' : '-'}₹{t.amount}
                    </div>
                    <div className={`text-[10px] font-black uppercase tracking-tight ${
                      t.status === 'succeeded' ? 'text-emerald-600' : 
                      t.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {t.status}
                    </div>
                  </div>
                </div>
              ))}

              {rows.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm font-bold">
                  No transactions yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
