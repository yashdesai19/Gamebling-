import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, ApiError } from "@/lib/api";

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const canSubmit = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return false;
    if (newPassword.length < 8) return false;
    return newPassword === confirmPassword;
  }, [confirmPassword, currentPassword, newPassword]);

  const m = useMutation({
    mutationFn: () =>
      apiFetch("/api/users/change_password", {
        method: "POST",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      }),
    onSuccess: () => {
      toast({ title: "Password changed" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => toast({ title: "Change password failed", description: (e as ApiError).message, variant: "destructive" }),
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-6 md:py-10 space-y-5 max-w-md">
          <div className="text-center">
            <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Change Password</h1>
            <p className="text-muted-foreground mt-1">Please enter your new password below. Make sure it is strong and secure.</p>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading uppercase tracking-wide">Security</CardTitle>
              <CardDescription>For safety, current password is required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-heading font-bold uppercase tracking-wide">Current Password</div>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter Current Password" />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-heading font-bold uppercase tracking-wide">New Password</div>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter New Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle new password visibility"
                  >
                    {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-heading font-bold uppercase tracking-wide">Confirm New Password</div>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-cricket text-primary-foreground hover:opacity-90 glow-cricket font-heading font-bold uppercase tracking-wide"
                disabled={!canSubmit || m.isPending}
                onClick={() => m.mutate()}
              >
                {m.isPending ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

