import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, ApiError } from "@/lib/api";
import { fetchMe, type UserMe } from "@/lib/auth";
import { User, ShieldCheck, CreditCard, Lock } from "lucide-react";

type BankDetails = { bank_details: string | null; upi_id: string | null };

export default function ProfilePage() {
  const { toast } = useToast();

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const bankQ = useQuery({
    queryKey: ["bank-details"],
    queryFn: () => apiFetch<BankDetails>("/api/users/bank_details"),
  });

  const me = meQ.data;
  const bank = bankQ.data;

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (me) {
      setUsername(me.username ?? "");
      setPhone(me.phone ?? "");
    }
    if (bank) {
      setUpiId(bank.upi_id ?? "");
      setBankDetails(bank.bank_details ?? "");
    }
  }, [me?.id, me?.username, me?.phone, bank?.upi_id, bank?.bank_details]);

  const saveProfileM = useMutation({
    mutationFn: () =>
      apiFetch<UserMe>("/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify({ username: username.trim() || null, phone: phone.trim() || null }),
      }),
    onSuccess: async () => {
      toast({ title: "Profile updated" });
      await meQ.refetch();
    },
    onError: (e) => {
      const err = e as ApiError;
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const saveBankM = useMutation({
    mutationFn: () =>
      apiFetch<BankDetails>("/api/users/bank_details", {
        method: "PUT",
        body: JSON.stringify({ upi_id: upiId.trim() || null, bank_details: bankDetails.trim() || null }),
      }),
    onSuccess: async () => {
      toast({ title: "Withdrawal details saved" });
      await bankQ.refetch();
    },
    onError: (e) => {
      const err = e as ApiError;
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const changePwM = useMutation({
    mutationFn: () =>
      apiFetch("/api/users/change_password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      }),
    onSuccess: () => {
      toast({ title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (e) => {
      const err = e as ApiError;
      toast({ title: "Change password failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container max-w-3xl mx-auto px-4 py-8 space-y-8">
          
          <div className="text-center mb-10 mt-4">
            <h1 className="text-4xl font-black text-foreground tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              My <span className="text-primary">Profile</span>
            </h1>
            <div className="mt-4 inline-flex items-center gap-4 text-sm bg-white/60 dark:bg-black/10 px-6 py-2 rounded-full border border-border backdrop-blur-sm shadow-sm">
              <span className="font-bold text-muted-foreground">{me?.email || "Loading..."}</span>
              {me && (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  me.kyc_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {me.kyc_status === 'verified' ? 'KYC Verified' : 'KYC Pending'}
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="rounded-3xl p-6 glass-card bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Basic Info</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Update personal details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Username</label>
                  <Input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Username" 
                    className="h-12 bg-muted/50 border-none font-bold rounded-xl px-4"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Phone Number</label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="Phone (optional)" 
                    className="h-12 bg-muted/50 border-none font-bold rounded-xl px-4"
                  />
                </div>
                <Button
                  className="w-full mt-2 h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  onClick={() => saveProfileM.mutate()}
                  disabled={saveProfileM.isPending}
                >
                  {saveProfileM.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </div>

            {/* Withdrawal Details */}
            <div className="rounded-3xl p-6 glass-card bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Payout Methods</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Where we send you money</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">UPI ID</label>
                  <Input 
                    value={upiId} 
                    onChange={(e) => setUpiId(e.target.value)} 
                    placeholder="example@upi" 
                    className="h-12 bg-muted/50 border-none font-bold rounded-xl px-4"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Bank Account</label>
                  <Input 
                    value={bankDetails} 
                    onChange={(e) => setBankDetails(e.target.value)} 
                    placeholder="Acc no / IFSC" 
                    className="h-12 bg-muted/50 border-none font-bold rounded-xl px-4"
                  />
                </div>
                <Button
                  className="w-full mt-2 h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  onClick={() => saveBankM.mutate()}
                  disabled={saveBankM.isPending}
                >
                  {saveBankM.isPending ? "Saving..." : "Save Payout Details"}
                </Button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="rounded-3xl p-6 glass-card bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Security</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Change your password</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 bg-muted/50 border-none font-bold rounded-xl px-4"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">New Password</label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="h-12 bg-muted/50 border-none font-bold rounded-xl px-4"
                />
              </div>
              <Button
                className="w-full h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                onClick={() => changePwM.mutate()}
                disabled={changePwM.isPending}
              >
                {changePwM.isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
