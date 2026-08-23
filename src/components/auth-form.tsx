"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" | "reset" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);

  function handleEnterDemo() {
    // Set demo cookie so proxy middleware allows full access
    document.cookie = "shopwave_demo=true; path=/; max-age=86400";
    toast.success("Entering ShopWave Demo Workspace");
    router.push("/dashboard");
    router.refresh();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFormError("");
    setIsEmailUnconfirmed(false);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password") || "");
    const supabase = createClient();

    if (!supabase) {
      setLoading(false);
      const message = "Authentication is unavailable without Supabase credentials. You can explore the demo sandbox below.";
      setFormError(message);
      toast.info(message);
      return;
    }

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message?.toLowerCase().includes("email not confirmed")) {
            setIsEmailUnconfirmed(true);
            setFormError("Email not confirmed. Please click the confirmation link in your email, or turn off 'Confirm Email' in your Supabase Auth Dashboard.");
            toast.error("Email not confirmed yet.");
            return;
          }
          const message = error.message || "Unable to sign in with these credentials.";
          setFormError(message);
          toast.error(message);
          return;
        }

        // Clear any demo cookie upon real login
        document.cookie = "shopwave_demo=; path=/; max-age=0";
        toast.success("Welcome back to ShopWave");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) {
          const message = error.message || "The account could not be created. Check your details and try again.";
          setFormError(message);
          toast.error(message);
          return;
        }

        if (data.session) {
          document.cookie = "shopwave_demo=; path=/; max-age=0";
          toast.success("Account created successfully!");
          router.push("/dashboard");
          router.refresh();
        } else {
          toast.success("Account registered! Please verify your email or check Supabase Auth settings.");
          setIsEmailUnconfirmed(true);
        }
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        const message = error.message || "A recovery email could not be sent. Please try again later.";
        setFormError(message);
        toast.error(message);
        return;
      }
      toast.success("Check your inbox for the password reset link");
    } catch (err: any) {
      console.error("[AuthForm.submit] Error:", err);
      const isFetchError = err?.message?.includes("fetch") || err?.name === "TypeError";
      const message = isFetchError
        ? "Could not reach the Supabase server. Please verify your internet connection or enter Demo Mode."
        : "Authentication is temporarily unavailable. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {formError && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700 space-y-2">
          <p className="font-semibold">{formError}</p>
          {isEmailUnconfirmed && (
            <div className="pt-1 border-t border-red-200">
              <p className="text-[11px] text-red-600 mb-1">
                Tip: In Supabase Dashboard &rarr; Auth &rarr; Providers &rarr; Email &rarr; Turn OFF <strong>&quot;Confirm email&quot;</strong> to allow immediate login.
              </p>
              <button
                type="button"
                onClick={handleEnterDemo}
                className="text-xs font-bold text-indigo-700 underline hover:text-indigo-900"
              >
                Or Continue in Demo Mode &rarr;
              </button>
            </div>
          )}
        </div>
      )}
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="seller@brand.com"
        />
      </div>
      {mode !== "reset" && (
        <div>
          <div className="flex justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <Link href="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
        </div>
      )}
      <Button
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
      >
        {loading
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : mode === "register"
              ? "Create Seller Account"
              : "Send reset link"}
      </Button>

      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={handleEnterDemo}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Sparkles size={14} className="text-indigo-600" />
          <span>Explore ShopWave Demo Workspace</span>
          <ArrowRight size={13} className="text-slate-400" />
        </button>
      </div>
    </form>
  );
}
