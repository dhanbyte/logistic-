import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function Forgot() {
  return (
    <AuthShell
      title="Reset your password"
      description="We will email you a secure recovery link."
      footer={
        <Link className="font-semibold text-emerald-700" href="/login">
          Back to sign in
        </Link>
      }
    >
      <Suspense fallback={<div className="py-8 text-center text-xs text-slate-500">Loading reset form…</div>}>
        <AuthForm mode="reset" />
      </Suspense>
    </AuthShell>
  );
}
