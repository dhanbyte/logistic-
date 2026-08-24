import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your ShopWave Logistics seller dashboard."
      footer={
        <>
          New to ShopWave?{" "}
          <Link className="font-semibold text-indigo-600 hover:text-indigo-800" href="/register">
            Create account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="py-8 text-center text-xs text-slate-500">Loading sign in form…</div>}>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
