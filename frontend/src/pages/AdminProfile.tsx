import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import Navbar from "@/components/Navbar";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { adminFetch } from "@/lib/adminApi";

type AdminMe = { id: number; username: string };

export default function AdminProfilePage() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const meQ = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => adminFetch<AdminMe>("/api/admin/me"),
  });

  const changePwM = useMutation({
    mutationFn: () =>
      adminFetch("/api/admin/change_password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      }),
    onSuccess: () => {
      toast({ title: "Admin password updated" });
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (e) => toast({ title: "Change password failed", description: (e as ApiError).message, variant: "destructive" }),
  });

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-10 space-y-6">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wide">Admin Profile</h1>
            <p className="text-muted-foreground mt-1">{meQ.data ? `Username: ${meQ.data.username}` : "Loading..."}</p>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wide">Security</CardTitle>
              <CardDescription>Change admin password.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
              />
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
              <Button
                className="bg-gradient-cricket text-primary-foreground hover:opacity-90 glow-cricket font-heading font-bold uppercase tracking-wide"
                onClick={() => changePwM.mutate()}
                disabled={changePwM.isPending}
              >
                {changePwM.isPending ? "Updating..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

