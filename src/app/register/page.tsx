"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create Seller Account"
      description="Start shipping across India with Delhivery, Blue Dart, Xpressbees, and more."
      footer={
        <>
          Already registered?{" "}
          <Link className="font-semibold text-indigo-600 hover:text-indigo-800" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="py-8 text-center text-xs text-slate-500">Loading registration form…</div>}>
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
