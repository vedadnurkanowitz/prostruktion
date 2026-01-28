"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // 1. Fetch profile to know where to redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = profile?.role;

        router.refresh(); // Sync server state

        if (role === "super_admin") {
          router.push("/admin/dashboard");
        } else if (role === "partner") {
          router.push("/partner/dashboard");
        } else if (role === "broker") {
          router.push("/broker/dashboard");
        } else {
          router.push("/");
        }
      }
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: "New User",
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Auto-login or verify email message?
      // Usually signUp auto-logs in if email confirmation is disabled or if configured.
      // If enabled, they need to verify. Assuming dev env might be loose.
      // Let's try to sign in immediately after, or just let them try.
      setError("Account created! Please Sign In.");
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      <Card className="relative w-full max-w-sm bg-black/40 backdrop-blur-xl border-white/10 text-white shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-yellow-400"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7" />
                <path d="M19 21V11" />
                <path d="M10 21V4" />
                <path d="M14 21V14" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-white/40">
            Enter your credentials to access the workspace
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-white/70">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-yellow-400/50 focus-visible:border-yellow-400/50 transition-all duration-300"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-white/70">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-yellow-400/50 focus-visible:border-yellow-400/50 transition-all duration-300"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-200 bg-red-500/10 p-3 rounded-md border border-red-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold shadow-[0_0_20px_rgba(250,204,21,0.15)] hover:shadow-[0_0_25px_rgba(250,204,21,0.25)] transition-all duration-300"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign in"
              )}
            </Button>
            <div className="relative w-full py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-white/30 backdrop-blur-xl">
                  Or
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white transition-all duration-300"
              onClick={handleSignUp}
              disabled={loading}
            >
              Create Account
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
