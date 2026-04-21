import { useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, ApiError } from "@/lib/api";
import { fetchMe, type UserMe } from "@/lib/auth";

export default function EditProfilePage() {
  const { toast } = useToast();
  const meQ = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const me = meQ.data;

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!me) return;
    setUsername(me.username ?? "");
    setPhone(me.phone ?? "");
  }, [me?.id, me?.username, me?.phone]);

  const avatarLetter = useMemo(() => ((me?.username ?? "U").trim()[0] || "U").toUpperCase(), [me?.username]);

  const saveM = useMutation({
    mutationFn: () =>
      apiFetch<UserMe>("/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify({ username: username.trim() || null, phone: phone.trim() || null }),
      }),
    onSuccess: async () => {
      toast({ title: "Profile updated" });
      await meQ.refetch();
    },
    onError: (e) => toast({ title: "Update failed", description: (e as ApiError).message, variant: "destructive" }),
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-6 md:py-10 space-y-5 max-w-md">
          <div className="text-center">
            <h1 className="font-heading text-2xl font-bold uppercase tracking-wide">Edit Profile</h1>
          </div>

          <div className="flex justify-center">
            <div className="relative w-40 h-40 rounded-full overflow-hidden bg-primary/20 border border-border flex items-center justify-center">
              <div className="text-5xl font-heading font-bold text-primary">{avatarLetter}</div>
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-foreground/80 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border border-border/40 bg-background/10 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-background" />
                </div>
              </div>
            </div>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading uppercase tracking-wide">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
              <Input value={me?.email ?? ""} readOnly disabled placeholder="Email" />
              <Button
                className="w-full bg-gradient-cricket text-primary-foreground hover:opacity-90 glow-cricket font-heading font-bold uppercase tracking-wide"
                disabled={saveM.isPending}
                onClick={() => saveM.mutate()}
              >
                {saveM.isPending ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

