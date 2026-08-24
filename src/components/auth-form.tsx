"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Building2, Phone, ShieldCheck, Sparkles, User, Zap } from "lucide-react";
import { toast } from "sonner";
import { registerSellerAction } from "@/app/ecommerce-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" | "reset" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  function handleEnterDemo(destination = nextParam || "/dashboard") {
    document.cookie = "shopwave_demo=true; path=/; max-age=86400";
    toast.success("Entering ShopWave Workspace");
    router.push(destination);
    router.refresh();
  }

  async function handleQuickAdminLogin() {
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      handleEnterDemo("/admin");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: "dhananjay.win2004@gmail.com",
        password: "Admin@123456",
      });

      if (error) {
        handleEnterDemo("/admin");
        return;
      }

      document.cookie = "shopwave_demo=; path=/; max-age=0";
      toast.success("Welcome, Super Admin!");
      router.push("/admin");
      router.refresh();
    } catch {
      handleEnterDemo("/admin");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFormError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || "").trim();
    const companyName = String(form.get("companyName") || "").trim();
    const phone = String(form.get("phone") || "").trim();

    const supabase = createClient();
    const destination = nextParam || (email === "dhananjay.win2004@gmail.com" ? "/admin" : "/dashboard");

    try {
      if (mode === "login") {
        if (!supabase) {
          handleEnterDemo(destination);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const message = error.message || "Unable to sign in with these credentials.";
          setFormError(message);
          toast.error(message);
          return;
        }

        document.cookie = "shopwave_demo=; path=/; max-age=0";
        toast.success("Welcome back to ShopWave!");
        router.push(destination);
        router.refresh();
        return;
      }

      if (mode === "register") {
        toast.info("Creating and setting up your shipping account…");
        const regResult = await registerSellerAction({
          email,
          password,
          fullName: fullName || "Merchant Seller",
          companyName: companyName || "My Store",
          phone: phone || "9876543210",
        });

        if (!regResult.ok) {
          setFormError(regResult.message);
          toast.error(regResult.message);
          return;
        }

        if (supabase) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (!signInErr) {
            document.cookie = "shopwave_demo=; path=/; max-age=0";
            toast.success("Account created! ₹500 welcome shipping credit added.");
            router.push("/dashboard");
            router.refresh();
            return;
          }
        }

        toast.success("Account created successfully! Please sign in.");
        router.push("/login");
        return;
      }

      if (mode === "reset" && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) {
          setFormError(error.message);
          toast.error(error.message);
          return;
        }
        toast.success("Check your inbox for the password reset link");
      }
    } catch (err: any) {
      console.error("[AuthForm.submit] Error:", err);
      setFormError(err.message || "Authentication error. Please try again.");
      toast.error(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {formError && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700 font-semibold">
          {formError}
        </div>
      )}

      {mode === "register" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Rahul Sharma"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="9876543210"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="companyName">Store / Brand Name</Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              required
              placeholder="e.g. Trendy Fashions"
            />
          </div>
        </>
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
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
      >
        {loading
          ? "Setting up your workspace…"
          : mode === "login"
            ? "Sign in to Shipping Hub"
            : mode === "register"
              ? "Create Seller Account & Get ₹500 Credit"
              : "Send reset link"}
      </Button>

      {mode === "login" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-white shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              <span>Super Admin Portal Access</span>
            </span>
            <span className="rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 text-[9px] font-extrabold">
              ROOT
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Account: <strong className="text-slate-200">dhananjay.win2004@gmail.com</strong>
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={handleQuickAdminLogin}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
          >
            <ShieldCheck size={14} />
            <span>1-Click Launch Super Admin Panel &rarr;</span>
          </button>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => handleEnterDemo("/dashboard")}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Sparkles size={14} className="text-indigo-600" />
          <span>Explore ShopWave Demo Workspace</span>
          <ArrowRight size={13} className="text-slate-400" />
        </button>
      </div>
    </form>
  );
}
