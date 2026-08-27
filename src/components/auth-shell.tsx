"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Compass, Mail, Phone, Truck, X } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [activeModal, setActiveModal] = useState<"about" | "contact" | "terms" | "privacy" | null>(null);

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Top Navbar */}
      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Truck size={20} />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">
                Shipwave
              </span>
              <span className="text-[9px] font-semibold tracking-wider uppercase text-indigo-600">
                Logistics OS
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <Link href="/#platform" className="hover:text-slate-900 transition-colors hidden sm:inline-block">
              Platform
            </Link>
            <Link href="/#tracking" className="hover:text-slate-900 transition-colors hidden sm:inline-block">
              Track shipment
            </Link>
            <Link href="/blog" className="hover:text-slate-900 transition-colors hidden sm:inline-block">
              Blog
            </Link>
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Hero & Auth Container */}
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
        {/* Subtle Watermarked Background Text */}
        <div className="pointer-events-none absolute -left-10 top-12 select-none text-[120px] sm:text-[180px] font-black tracking-tighter text-slate-200/35 leading-none z-0">
          SHIPWAVE
        </div>

        <div className="relative z-10 grid w-full items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Hero Text & Visual */}
          <div className="lg:col-span-7 space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              <span>Logistics operations, brought into focus</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]">
              Run every shipment with clarity.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Keep orders, courier movement, public tracking, and finance in one calm operating workspace built for growing logistics teams.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
              >
                <span>Start with Shipwave</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/#tracking"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
              >
                <Compass size={15} className="text-indigo-600" />
                <span>Track a shipment</span>
              </Link>
            </div>

            {/* Courier Partners */}
            <div className="pt-6 border-t border-slate-200/70">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Integrated Carrier Network
              </p>
              <p className="text-xs font-medium text-slate-600 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">Delhivery</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-800">Blue Dart</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-800">Xpressbees</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-800">Ekart</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-800">Shadowfax</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-800">DTDC</span>
              </p>
            </div>
          </div>

          {/* Right Column: Floating Auth Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/60">
              <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {description}
                </p>
              </div>

              {children}

              {footer && (
                <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modern Minimalist Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 Shipwave. Logistics operations with clarity.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link href="/#platform" className="hover:text-slate-800 transition-colors">
              Platform
            </Link>
            <Link href="/#tracking" className="hover:text-slate-800 transition-colors">
              Track shipment
            </Link>
            <Link href="/forgot-password" className="hover:text-slate-800 transition-colors">
              Account recovery
            </Link>
            <button
              type="button"
              onClick={() => setActiveModal("about")}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("contact")}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("terms")}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL DIALOGS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {activeModal === "about"
                  ? "About Shipwave Logistics"
                  : activeModal === "contact"
                  ? "Contact & Support Desk"
                  : activeModal === "terms"
                  ? "Terms of Service"
                  : "Privacy Policy"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {activeModal === "about" && (
                <>
                  <p>
                    <strong>Shipwave</strong> is an automated logistics shipping engine connecting Indian sellers with premier courier networks like Shadowfax, Xpressbees, Delhivery, and Blue Dart.
                  </p>
                  <p>
                    Built to eliminate manual dispatch friction, reduce RTO losses, and accelerate cashflow with instant COD remittances.
                  </p>
                </>
              )}

              {activeModal === "contact" && (
                <>
                  <p>Reach out to our operations team directly:</p>
                  <div className="rounded-xl bg-slate-50 p-3 space-y-2 border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-indigo-600" />
                      <span>Email: <strong>support@dhanbyte.me</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-emerald-600" />
                      <span>Helpline: <strong>+91 98765 43210</strong> (9 AM - 8 PM IST)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-indigo-600" />
                      <span>Office: New Delhi, India</span>
                    </div>
                  </div>
                </>
              )}

              {activeModal === "terms" && (
                <p>
                  All shipments adhere to Indian standard logistics carrier agreements, freight weight measurements, and secure COD escrow settlements.
                </p>
              )}

              {activeModal === "privacy" && (
                <p>
                  We ensure strict confidentiality of seller credentials, customer delivery phone numbers, and financial transaction records.
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
