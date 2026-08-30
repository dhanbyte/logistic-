"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  Banknote,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  History,
  IndianRupee,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Radio,
  Receipt,
  RotateCcw,
  Scale,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Truck,
  Undo2,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

interface MenuItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
  children?: { title: string; href: string; badge?: string }[];
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Users: true,
    Orders: true,
    Shipments: true,
    Couriers: true,
    Finance: true,
  });

  function toggleGroup(title: string) {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  const menuSections: MenuItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      children: [
        { title: "All Users", href: "/admin/users" },
        { title: "KYC Verification", href: "/admin/users/kyc", badge: "1" },
        { title: "User Wallets", href: "/admin/users/wallets" },
      ],
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: Package,
      children: [
        { title: "All Orders", href: "/admin/orders" },
        { title: "Prepaid Orders", href: "/admin/orders/prepaid" },
        { title: "COD Orders", href: "/admin/orders/cod" },
      ],
    },
    {
      title: "Shipments",
      href: "/admin/shipments",
      icon: Truck,
      children: [
        { title: "All Shipments", href: "/admin/shipments" },
        { title: "NDR Exceptions", href: "/admin/shipments/ndr", badge: "3" },
        { title: "RTO Management", href: "/admin/shipments/rto" },
      ],
    },
    {
      title: "Couriers",
      href: "/admin/couriers",
      icon: Radio,
      children: [
        { title: "Courier Partners", href: "/admin/couriers" },
        { title: "API Health & Logs", href: "/admin/couriers/api" },
        { title: "Serviceability Matrix", href: "/admin/couriers/serviceability" },
        { title: "Shipping Rates & Margin", href: "/admin/couriers/rates" },
      ],
    },
    {
      title: "Finance",
      href: "/admin/finance",
      icon: IndianRupee,
      children: [
        { title: "Finance Dashboard", href: "/admin/finance" },
        { title: "Wallet Adjustments", href: "/admin/finance/wallet" },
        { title: "Immutable Ledger", href: "/admin/finance/ledger" },
        { title: "Payment Gateway", href: "/admin/finance/payments" },
        { title: "COD Settlements", href: "/admin/finance/cod-settlements" },
        { title: "Prepaid Settlements", href: "/admin/finance/prepaid-settlements" },
        { title: "Bank Remittance", href: "/admin/finance/remittance", badge: "1" },
        { title: "Refund Management", href: "/admin/finance/refunds" },
        { title: "Reconciliation Engine", href: "/admin/finance/reconciliation" },
      ],
    },
    {
      title: "Blogs & SEO",
      href: "/admin/blogs",
      icon: BookOpen,
      children: [
        { title: "All Articles", href: "/admin/blogs" },
        { title: "Write New Post", href: "/admin/blogs/new" },
      ],
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: FileSpreadsheet,
    },
    {
      title: "Support",
      href: "/admin/support/tickets",
      icon: LifeBuoy,
      children: [
        { title: "Helpdesk Tickets", href: "/admin/support/tickets", badge: "2" },
        { title: "Notifications Log", href: "/admin/support/notifications" },
      ],
    },
    {
      title: "Admins",
      href: "/admin/admins",
      icon: ShieldCheck,
      children: [
        { title: "Admin Users", href: "/admin/admins" },
        { title: "RBAC Roles", href: "/admin/admins/roles" },
        { title: "Audit Trail", href: "/admin/admins/audit-logs" },
      ],
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
      children: [
        { title: "General Settings", href: "/admin/settings" },
        { title: "Global Courier Rates", href: "/admin/couriers/rates" },
      ],
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-300">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 px-5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-linear-to-tr from-indigo-600 to-indigo-400 text-white shadow-md shadow-indigo-500/20">
            <Zap size={20} className="fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-white tracking-tight">ShipWave.in</span>
              <span className="rounded bg-rose-500/20 border border-rose-500/30 px-1 py-0.2 text-[9px] font-extrabold text-rose-400">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Platform Control Center</p>
          </div>
        </div>
      </div>

      {/* Navigation Tree */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {menuSections.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const isGroupOpen = openGroups[item.title] ?? false;
          const isActive =
            pathname === item.href ||
            (item.children && item.children.some((c) => pathname === c.href));

          if (!hasChildren) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  pathname === item.href
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <div key={item.title} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleGroup(item.title)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "text-white bg-slate-900/90 font-bold"
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={isActive ? "text-indigo-400" : "text-slate-400"} />
                  <span>{item.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                  {isGroupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {isGroupOpen && (
                <div className="ml-5 pl-2.5 border-l border-slate-800/80 space-y-0.5 pt-0.5">
                  {item.children?.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                          isChildActive
                            ? "bg-indigo-600/90 text-white font-semibold shadow-xs"
                            : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                        }`}
                      >
                        <span>{child.title}</span>
                        {child.badge && (
                          <span className="rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 text-[9px] font-bold">
                            {child.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Quick Switch */}
      <div className="shrink-0 border-t border-slate-800/80 p-3 bg-slate-950/60">
        <Link
          href="/dashboard"
          className="flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Switch to Seller View</span>
          </div>
          <ChevronRight size={14} className="text-slate-500" />
        </Link>
      </div>
    </aside>
  );
}
