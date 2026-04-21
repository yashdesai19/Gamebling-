import { useMemo, useState } from "react";
import Logo from "@/components/Logo";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";
import { register, login } from "@/lib/auth";
import heroStadium from "@/assets/hero-stadium.jpg";

const schema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const nav = useNavigate();
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const errors = useMemo(() => {
    const r = schema.safeParse(form);
    if (r.success) return {};
    const out: Record<string, string> = {};
    for (const issue of r.error.issues) out[String(issue.path[0])] = issue.message;
    return out;
  }, [form]);

  const canSubmit =
    !loading &&
    Object.keys(errors).length === 0 &&
    form.username &&
    form.email &&
    form.password &&
    form.confirmPassword;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) return;
    setLoading(true);
    try {
      await register({ username: r.data.username, email: r.data.email, password: r.data.password });
      await login(r.data.email, r.data.password);
      toast({ title: "Account created", description: "You’re now logged in." });
      nav("/", { replace: true });
    } catch (e) {
      const err = e as ApiError;
      toast({ title: "Register failed", description: err.message, variant: "destructive" });
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
                Join <Logo size="lg" />
              </CardTitle>
              <CardDescription>Create your account and start trading</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Username</label>
                  <Input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
                  {errors.username ? <div className="text-xs text-destructive">{errors.username}</div> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
                  {errors.email ? <div className="text-xs text-destructive">{errors.email}</div> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Input
                      value={form.password}
                      onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
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

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Confirm Password</label>
                  <div className="relative">
                    <Input
                      value={form.confirmPassword}
                      onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                      type={showPw2 ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw2((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword ? <div className="text-xs text-destructive">{errors.confirmPassword}</div> : null}
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest py-6 rounded-xl shadow-lg shadow-primary/20 mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>

                <div className="text-sm text-muted-foreground text-center">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Login
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

