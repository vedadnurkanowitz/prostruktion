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
    <div className="relative group w-full max-w-md">
      <div className="absolute -inset-1 bg-gradient-to-r from-gray-700/20 to-gray-900/20 rounded-2xl blur-2xl opacity-60"></div>
      <Card className="relative w-full bg-gray-900/60 backdrop-blur-2xl border-gray-700/30 text-white shadow-2xl rounded-2xl p-6 sm:p-8">
        <CardHeader className="space-y-4 pb-8 p-0">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.15)] backdrop-blur-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-yellow-400"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7" />
                <path d="M19 21V11" />
                <path d="M10 21V4" />
                <path d="M14 21V14" />
              </svg>
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-base text-neutral-400">
              Enter your credentials to access the workspace
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-6 p-0">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-neutral-300 ml-1"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-yellow-400/50 focus-visible:border-yellow-400/50 focus-visible:ring-offset-0 rounded-xl transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-neutral-300 ml-1"
                >
                  Password
                </Label>
                <a
                  href="#"
                  className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-yellow-400/50 focus-visible:border-yellow-400/50 focus-visible:ring-offset-0 rounded-xl transition-all duration-200"
              />
            </div>
            {error && (
              <div className="flex items-center gap-3 text-sm text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              className="w-full h-11 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-base rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.1)] hover:shadow-[0_0_25px_rgba(250,204,21,0.2)] transition-all duration-300 mt-2"
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
          </CardContent>
          <CardFooter className="flex flex-col gap-6 p-0 mt-8">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-950 px-4 text-neutral-500 font-medium tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300"
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
