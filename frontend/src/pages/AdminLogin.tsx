import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

import Navbar from "@/components/Navbar";
import heroStadium from "@/assets/hero-stadium.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { adminFetch, setAdminToken } from "@/lib/adminApi";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLoginPage() {
  const nav = useNavigate();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });

  const errors = useMemo(() => {
    const r = schema.safeParse(form);
    if (r.success) return {};
    const out: Record<string, string> = {};
    for (const issue of r.error.issues) out[String(issue.path[0])] = issue.message;
    return out;
  }, [form]);

  const canSubmit = !loading && Object.keys(errors).length === 0 && form.username && form.password;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) return;
    setLoading(true);
    try {
      const res = await adminFetch<{ access_token: string; token_type: string }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(r.data),
      });
      setAdminToken(res.access_token);
      toast({ title: "Admin logged in" });
      nav("/admin", { replace: true });
    } catch (e) {
      const err = e as ApiError;
      toast({ title: "Admin login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroStadium} alt="Cricket stadium" className="w-full h-full object-cover" width={1920} height={800} />
          <div className="absolute inset-0 bg-gradient-to-r from-cricket-dark/95 via-cricket-dark/85 to-cricket-dark/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="container relative z-10 py-10">
          <div className="mx-auto max-w-md">
            <Card className="border-border/60 bg-card/90 backdrop-blur-xl shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="font-heading uppercase tracking-wide">Admin Login</CardTitle>
                <CardDescription>Authorized admins only.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Username</label>
                    <Input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
                    {errors.username ? <div className="text-xs text-destructive">{errors.username}</div> : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Input
                        value={form.password}
                        onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                        type={showPw ? "text" : "password"}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password ? <div className="text-xs text-destructive">{errors.password}</div> : null}
                  </div>

                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full bg-gradient-cricket text-primary-foreground hover:opacity-90 glow-cricket font-heading font-bold uppercase tracking-wide"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

