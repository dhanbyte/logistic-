"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Phone,
  ShieldCheck,
  User,
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
    document.cookie = "shipwave_demo=true; path=/; max-age=86400";
    toast.success("Entering Shipwave Workspace");

    router.push(destination);
    router.refresh();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setFormError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
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

        document.cookie = "shipwave_demo=; path=/; max-age=0";
        toast.success("Welcome back to Shipwave!");

        window.location.href = destination;
        return;
      }

      if (currentMode === "register") {
        if (!fullName) {
          setFormError("Please enter your full name.");
          toast.error("Full name is required");
          return;
        }
        if (!companyName) {
          setFormError("Please enter your business or store name.");
          toast.error("Business name is compulsory");
          return;
        }
        if (!phone || phone.replace(/\D/g, "").length < 10) {
          setFormError("Please enter a valid 10-digit mobile number.");
          toast.error("10-digit phone number is compulsory");
          return;
        }

        toast.info("Setting up your shipping account…");
        const regResult = await registerSellerAction({
          email,
          password,
          fullName,
          companyName,
          phone: phone.replace(/\D/g, "").slice(-10),
        });

        if (!regResult.ok) {
          setFormError(regResult.message);
          toast.error(regResult.message);
          return;
        }

        if (supabase) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (!signInErr) {
            document.cookie = "shipwave_demo=; path=/; max-age=0";

            toast.success("Account created successfully! Welcome to Shipwave.");
            window.location.href = "/dashboard";
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
        <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100/90 p-1 text-xs font-semibold text-slate-600 border border-slate-200/80">
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
            Sign up (Free)
          </button>
        </div>
      )}

      {/* 2. MAIN FORM */}
      <form onSubmit={submit} className="space-y-3">
        {formError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
            {formError}
          </div>
        )}

        {/* REGISTER-ONLY MANDATORY FIELDS */}
        {currentMode === "register" && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Business / Store Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  placeholder="e.g. Trendy Fashions Store"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Mobile Number (WhatsApp / OTP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500 font-semibold text-xs border-r border-slate-200 pr-2">
                  <Phone size={13} className="text-slate-400" />
                  <span>+91</span>
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  placeholder="9876543210"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-18 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </>
        )}

        {/* EMAIL FIELD */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Work or Personal Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="name@example.com"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* PASSWORD FIELD */}
        {currentMode !== "reset" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Password <span className="text-red-500">*</span>
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

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 px-4 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.005] active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Setting up your workspace…</span>
            </span>
          ) : (
            <>
              <span>
                {currentMode === "login"
                  ? "Sign in to Dashboard"
                  : currentMode === "register"
                  ? "Create Free Seller Account"
                  : "Send Password Reset Link"}
              </span>
              <ArrowRight size={14} />
            </>
          )}
        </button>

        {/* Trust Badges */}
        <div className="pt-2 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-600" /> Free Account
          </span>
          <span>•</span>
          <span>₹0 Monthly Fee</span>
          <span>•</span>
          <span>Instant Setup</span>
        </div>
      </form>
    </div>
  );
}
