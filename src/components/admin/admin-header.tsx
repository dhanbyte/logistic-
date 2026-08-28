"use client";

import Link from "next/link";
import { Bell, CheckCircle2, Globe, Search, ShieldCheck, User } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md">
      {/* Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Global search by User ID, Order, AWB, Phone or UTR…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Switch to Seller App */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <span>📦 Seller Workspace</span>
        </Link>

        {/* Environment Badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SHADOWFAX PROD</span>
        </div>


        {/* Quick Help / Docs */}
        <Link
          href="/admin/settings"
          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          title="System Settings"
        >
          <ShieldCheck size={16} />
        </Link>

        {/* Notifications */}
        <Link
          href="/admin/support/tickets"
          className="relative rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 size-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </Link>

        {/* Profile Card & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="grid size-8 place-items-center rounded-full bg-indigo-600 font-bold text-white text-xs">
            SA
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">Dhananjay</p>
            <p className="text-[10px] font-semibold text-rose-600">Super Admin</p>
          </div>
          <SignOutButton className="ml-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50">
            Sign out
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}
