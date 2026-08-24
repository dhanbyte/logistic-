"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset Password"
      description="Enter your registered email address and we'll send you a password reset link."
      footer={
        <>
          Remembered your password?{" "}
          <Link className="font-semibold text-indigo-600 hover:text-indigo-800" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="py-8 text-center text-xs text-slate-500">Loading reset form…</div>}>
        <AuthForm mode="reset" />
      </Suspense>
    </AuthShell>
  );
}
