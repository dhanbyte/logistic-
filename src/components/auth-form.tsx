"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

import { toast } from "sonner";
import { registerSellerAction } from "@/app/ecommerce-actions";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({
  mode: initialMode = "login",
  onModeChange,
  showModeToggle = true,
}: {
  mode?: "login" | "register" | "reset";
  onModeChange?: (mode: "login" | "register") => void;
  showModeToggle?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const [currentMode, setCurrentMode] = useState<"login" | "register" | "reset">(initialMode);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sync mode switch
  function setTab(mode: "login" | "register") {
    setCurrentMode(mode);
    setFormError("");
    onModeChange?.(mode);
  }

  function handleEnterDemo(destination = nextParam || "/dashboard") {
    document.cookie = "shopwave_demo=true; path=/; max-age=86400";
    toast.success("Entering ShopWave Workspace");
    router.push(destination);
    router.refresh();
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
      if (currentMode === "login") {
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

      if (currentMode === "register") {
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
        setTab("login");
        return;
      }

      if (currentMode === "reset" && supabase) {
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
    <div className="w-full">
      {/* 1. SEGMENTED TAB SWITCHER (SIGN IN | SIGN UP) */}
      {showModeToggle && currentMode !== "reset" && (
        <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100/90 p-1 text-xs font-semibold text-slate-600 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`rounded-lg py-2 transition-all cursor-pointer ${
              currentMode === "login"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`rounded-lg py-2 transition-all cursor-pointer ${
              currentMode === "register"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "hover:text-slate-900"
            }`}
          >
            Sign up
          </button>
        </div>
      )}

      {/* 2. MAIN FORM (EMAIL & PASSWORD) */}
      <form onSubmit={submit} className="space-y-3.5">
        {formError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
            {formError}
          </div>
        )}

        {currentMode === "register" && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="9876543210"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Store / Brand Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                placeholder="e.g. Trendy Fashions"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {currentMode !== "reset" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Password
              </label>
              {currentMode === "login" && (
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={currentMode === "register" ? "new-password" : "current-password"}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        )}

        {/* 3. SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 px-4 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
        >
          {loading ? (
            <span>Setting up your workspace…</span>
          ) : (
            <>
              <span>
                {currentMode === "login"
                  ? "Sign in to workspace"
                  : currentMode === "register"
                  ? "Create account"
                  : "Send reset link"}
              </span>
              <ArrowRight size={14} />
            </>
          )}
        </button>



      </form>
    </div>
  );
}

