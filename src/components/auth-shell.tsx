import Link from "next/link";
import { Waves } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-2.5 font-bold">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Waves size={22} />
            </span>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                ShopWave
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-600">
                Logistics Aggregator
              </span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mb-8 mt-2 text-sm text-slate-500">{description}</p>
          {children}
          <div className="mt-7 text-center text-sm text-slate-500">{footer}</div>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-indigo-500/10 blur-2xl" />
        <p className="text-sm font-semibold tracking-wide text-indigo-300">
          INDIAN E-COMMERCE SHIPPING ENGINE
        </p>
        <div>
          <blockquote className="max-w-xl text-3xl font-semibold leading-tight text-slate-100">
            &ldquo;ShopWave connects all major Indian couriers with automated rate optimization, NDR workflows, and instant COD payouts.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-indigo-200">
            Delhivery &bull; Blue Dart &bull; Xpressbees &bull; Ekart &bull; Shadowfax &bull; DTDC
          </p>
        </div>
        <p className="text-xs text-slate-400">ShopWave Logistics &bull; Made for Indian D2C Brands.</p>
      </section>
    </main>
  );
}
