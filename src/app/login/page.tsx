import Link from "next/link";
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
      <AuthForm mode="login" />
    </AuthShell>
  );
}
