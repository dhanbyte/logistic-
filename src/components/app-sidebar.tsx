"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  BarChart3,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Package,
  RotateCcw,
  Settings,
  Truck,
  Undo2,
  Wallet,
  Warehouse,
  Waves,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/shipments", label: "Shipments", icon: Truck },
  { href: "/manifest", label: "Manifest", icon: FileText },
  { href: "/ndr", label: "NDR", icon: AlertTriangle },
  { href: "/rto", label: "RTO", icon: RotateCcw },
  { href: "/returns", label: "Returns", icon: Undo2 },
  { href: "/cod", label: "COD Remittance", icon: IndianRupee },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/warehouses", label: "Warehouses", icon: Warehouse },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  open,
  close,
  walletBalance = 0,
  isDemo,
  email,
}: {
  open: boolean;
  close: () => void;
  walletBalance?: number;
  isDemo: boolean;
  email?: string;
}) {

  const path = usePathname();
  const sidebar = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [
        ...(sidebar.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close, open]);

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        tabIndex={-1}
        onClick={close}
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/30 lg:hidden print:hidden",
          open ? "block" : "hidden",
        )}
      />
      <aside
        id="app-navigation"
        ref={sidebar}
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-slate-900">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Waves size={20} aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                Shipwave
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-600">
                Logistics OS
              </span>
            </div>
          </Link>

          <button
            ref={closeButton}
            type="button"
            aria-label="Close navigation"
            onClick={close}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Dynamic Real Prepaid Wallet Balance */}
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
          <Link
            href="/wallet"
            onClick={close}
            className="flex items-center justify-between text-xs hover:opacity-80 transition-opacity"
          >
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Wallet size={13} className="text-slate-400" /> Prepaid Wallet
            </span>
            <span className="font-bold text-emerald-700">
              {formatINR(walletBalance)}
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-3 overflow-y-auto" aria-label="Workspace">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = path === item.href || (item.href !== "/dashboard" && path.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    aria-hidden="true"
                    className={cn(
                      "transition-colors",
                      active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}

          {email === "dhananjay.win2004@gmail.com" && (
            <div className="pt-3 mt-3 border-t border-slate-100">
              <Link
                href="/admin"
                onClick={close}
                className="group flex items-center justify-between rounded-xl bg-slate-900 text-white px-3 py-2.5 text-xs font-bold hover:bg-slate-800 transition-all shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">🛡️</span>
                  <span>Super Admin Portal</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">&rarr;</span>
              </Link>
            </div>
          )}
        </nav>
      </aside>
    </>

  );
}
