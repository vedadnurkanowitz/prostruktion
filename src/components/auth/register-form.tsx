"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createUserProfile } from "@/app/actions-users";
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
import { AlertCircle, Users, Briefcase, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type RoleOption = "partner" | "broker";

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: selectedRole,
            },
          },
        },
      );

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // 2. Create profile with role using server action (bypasses RLS)
      if (authData.user) {
        const result = await createUserProfile({
          userId: authData.user.id,
          email: formData.email,
          fullName: formData.fullName,
          companyName: formData.companyName,
          phone: formData.phone,
          role: selectedRole,
        });

        if (result.error) {
          console.error("Profile creation error:", result.error);
          // Continue anyway - user can still login, profile might be created by trigger
        }
      }

      // 3. Auto sign-in (works when email confirmation is disabled in Supabase)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        // If auto sign-in fails (e.g., email confirmation required), show success and redirect to login
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      // Auto sign-in successful, redirect to appropriate dashboard
      router.refresh();
      if (selectedRole === "partner") {
        router.push("/partner/dashboard");
      } else {
        router.push("/broker/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during registration");
      setLoading(false);
    }
  };

  // Success State (shown when email confirmation is required)
  if (success) {
    return (
      <div className="relative group w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-700/20 to-green-900/20 rounded-2xl blur-2xl opacity-60"></div>
        <Card className="relative w-full bg-gray-900/60 backdrop-blur-2xl border-gray-700/30 text-white shadow-2xl rounded-2xl p-6 sm:p-8">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              Registration Successful!
            </h3>
            <p className="text-neutral-400 mb-4">
              Your account has been created. Please check your email to verify
              your account, then sign in.
            </p>
            <Link href="/login">
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Role Selection
  if (step === 1) {
    return (
      <div className="relative group w-full max-w-lg">
        <div className="absolute -inset-1 bg-gradient-to-r from-gray-700/20 to-gray-900/20 rounded-2xl blur-2xl opacity-60"></div>
        <Card className="relative w-full bg-gray-900/60 backdrop-blur-2xl border-gray-700/30 text-white shadow-2xl rounded-2xl p-6 sm:p-8">
          <CardHeader className="space-y-4 pb-8 p-0">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.15)] backdrop-blur-md">
                <Users className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                Join Prostruktion
              </CardTitle>
              <CardDescription className="text-base text-neutral-400">
                Select your role to get started
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-0">
            <button
              onClick={() => handleRoleSelect("partner")}
              className="group relative flex flex-col items-start p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-yellow-400/30 transition-all duration-300 text-left"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Partner</h3>
                  <p className="text-sm text-neutral-400">
                    Regional sales partner
                  </p>
                </div>
              </div>
              <p className="text-sm text-neutral-500">
                Manage regional projects, oversee mediators, and track sales
                performance.
              </p>
            </button>

            <button
              onClick={() => handleRoleSelect("broker")}
              className="group relative flex flex-col items-start p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-yellow-400/30 transition-all duration-300 text-left"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Mediator</h3>
                  <p className="text-sm text-neutral-400">Deal broker</p>
                </div>
              </div>
              <p className="text-sm text-neutral-500">
                Facilitate deals, earn commissions, and manage your pipeline.
              </p>
            </button>
          </CardContent>
          <CardFooter className="flex justify-center p-0 mt-8">
            <p className="text-sm text-neutral-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-yellow-400 hover:text-yellow-300 font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Step 2: Registration Form
  return (
    <div className="relative group w-full max-w-md">
      <div className="absolute -inset-1 bg-gradient-to-r from-gray-700/20 to-gray-900/20 rounded-2xl blur-2xl opacity-60"></div>
      <Card className="relative w-full bg-gray-900/60 backdrop-blur-2xl border-gray-700/30 text-white shadow-2xl rounded-2xl p-6 sm:p-8">
        <CardHeader className="space-y-4 pb-6 p-0">
          <button
            onClick={() => setStep(1)}
            className="text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            ← Change role
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  selectedRole === "partner"
                    ? "bg-orange-500/20"
                    : "bg-purple-500/20",
                )}
              >
                {selectedRole === "partner" ? (
                  <Briefcase
                    className={cn(
                      "h-5 w-5",
                      selectedRole === "partner"
                        ? "text-orange-400"
                        : "text-purple-400",
                    )}
                  />
                ) : (
                  <Users className="h-5 w-5 text-purple-400" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Register as{" "}
                  {selectedRole === "partner" ? "Partner" : "Mediator"}
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-neutral-400">
              Fill in your details to create your account
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4 p-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-sm font-medium text-neutral-300"
                >
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="John Doe"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-yellow-400/50 focus-visible:border-yellow-400/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="companyName"
                  className="text-sm font-medium text-neutral-300"
                >
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="Acme GmbH"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-yellow-400/50 focus-visible:border-yellow-400/50 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-neutral-300"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="name@company.com"
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-yellow-400/50 focus-visible:border-yellow-400/50 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-neutral-300"
              >
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+49 123 456789"
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-yellow-400/50 focus-visible:border-yellow-400/50 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-neutral-300"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Min. 6 characters"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-yellow-400/50 focus-visible:border-yellow-400/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-neutral-300"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm password"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus-visible:ring-yellow-400/50 focus-visible:border-yellow-400/50 rounded-xl"
                />
              </div>
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
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center p-0 mt-6">
          <p className="text-sm text-neutral-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-yellow-400 hover:text-yellow-300 font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
