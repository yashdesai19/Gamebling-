import { useMemo, useState } from "react";
import Logo from "@/components/Logo";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { login } from "@/lib/auth";
import heroStadium from "@/assets/hero-stadium.jpg";

const schema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ usernameOrEmail: "", password: "", remember: true });

  const errors = useMemo(() => {
    const r = schema.safeParse(form);
    if (r.success) return {};
    const out: Record<string, string> = {};
    for (const issue of r.error.issues) out[String(issue.path[0])] = issue.message;
    return out;
  }, [form]);

  const canSubmit = !loading && Object.keys(errors).length === 0 && form.usernameOrEmail && form.password;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) return;
    setLoading(true);
    try {
      const res = await login(r.data.usernameOrEmail, r.data.password);
      toast({ title: "Logged in", description: res.isAdmin ? "Welcome Admin!" : "Welcome back!" });
      
      if (res.isAdmin) {
        nav("/admin/dashboard", { replace: true });
      } else {
        const to = loc?.state?.from ?? "/";
        nav(to, { replace: true });
      }
    } catch (e) {
      const err = e as ApiError;
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
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
          <div className="absolute inset-0 bg-white/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-white/40 to-white/10" />
        </div>

        <div className="container relative z-10 py-10">
          <div className="mx-auto max-w-md">
            <Card className="border-border shadow-2xl bg-white rounded-2xl overflow-hidden">
            <CardHeader className="space-y-2 pt-8 text-center border-b border-border mb-6">
              <CardTitle className="flex items-center justify-center gap-2 text-3xl font-black text-foreground tracking-tight">
                Login to <Logo size="lg" />
              </CardTitle>
              <CardDescription>Enter your credentials to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Username / Email</label>
                  <Input
                    value={form.usernameOrEmail}
                    onChange={(e) => setForm((s) => ({ ...s, usernameOrEmail: e.target.value }))}
                    placeholder="Enter username or email"
                    autoComplete="username"
                  />
                  {errors.usernameOrEmail ? <div className="text-xs text-destructive">{errors.usernameOrEmail}</div> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Input
                      value={form.password}
                      onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                      placeholder="Enter password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password ? <div className="text-xs text-destructive">{errors.password}</div> : null}
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => setForm((s) => ({ ...s, remember: e.target.checked }))}
                  />
                  Remember me
                </label>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest py-6 rounded-xl shadow-lg shadow-primary/20 mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>

                <div className="text-sm text-muted-foreground text-center">
                  Don’t have an account?{" "}
                  <Link to="/register" className="text-primary hover:underline">
                    Register
                  </Link>
                </div>
              </form>
            </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

