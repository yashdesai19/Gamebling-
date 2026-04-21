import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import Navbar from "@/components/Navbar";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { adminFetch, clearAdminToken } from "@/lib/adminApi";
import { Link } from "react-router-dom";

type Team = { id: number; name: string; short_name: string };
type Match = {
  id: number;
  match_date: string;
  venue: string;
  match_status: string;
  team1: Team;
  team2: Team;
  toss_winner: Team | null;
  match_winner: Team | null;
};

type Withdrawal = {
  id: number;
  user_id: number;
  amount: string;
  status: string;
  upi_id: string | null;
  bank_details: string | null;
  created_at: string;
};

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [newVenue, setNewVenue] = useState("");
  const [newDate, setNewDate] = useState("");
  const [team1, setTeam1] = useState<number | null>(null);
  const [team2, setTeam2] = useState<number | null>(null);

  const teamsQ = useQuery({
    queryKey: ["admin-teams"],
    queryFn: () => adminFetch<Team[]>("/api/matches/teams/"),
  });

  const matchesQ = useQuery({
    queryKey: ["admin-matches"],
    queryFn: () => adminFetch<Match[]>("/api/admin/matches"),
  });

  const withdrawalsQ = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: () => adminFetch<Withdrawal[]>("/api/admin/withdrawals"),
  });

  const createMatchM = useMutation({
    mutationFn: () =>
      adminFetch<Match>("/api/admin/matches", {
        method: "POST",
        body: JSON.stringify({
          team1_id: team1,
          team2_id: team2,
          match_date: new Date(newDate).toISOString(),
          venue: newVenue,
          match_status: "open",
        }),
      }),
    onSuccess: async () => {
      toast({ title: "Match created" });
      setNewVenue("");
      setNewDate("");
      setTeam1(null);
      setTeam2(null);
      await matchesQ.refetch();
    },
    onError: (e) => {
      const err = e as ApiError;
      toast({ title: "Create match failed", description: err.message, variant: "destructive" });
    },
  });

  const approveW = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/withdrawals/${id}/approve`, { method: "POST" }),
    onSuccess: async () => {
      toast({ title: "Withdrawal approved" });
      await withdrawalsQ.refetch();
    },
    onError: (e) => toast({ title: "Approve failed", description: (e as ApiError).message, variant: "destructive" }),
  });

  const rejectW = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/withdrawals/${id}/reject`, { method: "POST" }),
    onSuccess: async () => {
      toast({ title: "Withdrawal rejected" });
      await withdrawalsQ.refetch();
    },
    onError: (e) => toast({ title: "Reject failed", description: (e as ApiError).message, variant: "destructive" }),
  });

  const teams = teamsQ.data ?? [];
  const matches = matchesQ.data ?? [];
  const withdrawals = withdrawalsQ.data ?? [];

  const canCreate = team1 && team2 && newVenue.trim().length > 2 && newDate;

  const onLogoutAdmin = () => {
    clearAdminToken();
    toast({ title: "Admin logged out" });
    window.location.href = "/admin/login";
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wide">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Matches + withdrawals.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/admin/profile">My Profile</Link>
              </Button>
              <Button variant="outline" onClick={onLogoutAdmin}>
                Logout Admin
              </Button>
            </div>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wide">Create Match</CardTitle>
              <CardDescription>Add a new match.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-2">Team 1</div>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={team1 ?? ""}
                  onChange={(e) => setTeam1(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.short_name} — {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-2">Team 2</div>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={team2 ?? ""}
                  onChange={(e) => setTeam2(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.short_name} — {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-2">Venue</div>
                <Input value={newVenue} onChange={(e) => setNewVenue(e.target.value)} placeholder="Venue" />
              </div>
              <div>
                <div className="text-xs font-heading font-semibold uppercase tracking-wider text-muted-foreground mb-2">Match Date/Time</div>
                <Input value={newDate} onChange={(e) => setNewDate(e.target.value)} placeholder="2026-04-14 19:30" />
              </div>

              <div className="md:col-span-2">
                <Button
                  className="w-full bg-gradient-cricket text-primary-foreground hover:opacity-90 glow-cricket font-heading font-bold uppercase tracking-wide"
                  disabled={!canCreate || createMatchM.isPending}
                  onClick={() => createMatchM.mutate()}
                >
                  {createMatchM.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wide">Matches</CardTitle>
              <CardDescription>All matches.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {matches.map((m) => (
                  <div key={m.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-heading font-bold">
                        {m.team1.short_name} vs {m.team2.short_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{m.venue}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(m.match_date).toLocaleString()}</div>
                  </div>
                ))}
                {matches.length === 0 ? <div className="text-muted-foreground">No matches.</div> : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wide">Withdrawal Requests</CardTitle>
              <CardDescription>Approve or reject.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {withdrawals.map((w) => (
                  <div key={w.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-heading font-bold">#{w.id} — User {w.user_id} — ₹{w.amount}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {w.upi_id ? `UPI: ${w.upi_id}` : w.bank_details ? `Bank: ${w.bank_details}` : "No payout details"}
                      </div>
                      <div className="text-xs text-muted-foreground">Status: {w.status}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => approveW.mutate(w.id)} disabled={approveW.isPending}>
                        Approve
                      </Button>
                      <Button variant="destructive" onClick={() => rejectW.mutate(w.id)} disabled={rejectW.isPending}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                {withdrawals.length === 0 ? <div className="text-muted-foreground">No withdrawal requests.</div> : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

