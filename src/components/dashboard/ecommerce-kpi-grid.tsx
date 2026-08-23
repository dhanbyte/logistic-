import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  IndianRupee,
  Package,
  RotateCcw,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { formatINR } from "@/lib/calculations";

interface KpiData {
  totalOrders: number;
  readyToShip: number;
  inTransit: number;
  delivered: number;
  ndr: number;
  rto: number;
  codPending: number;
  walletBalance: number;
  totalShippingSpend: number;
  deliverySuccessRate: number;
}

export function EcommerceKpiGrid({ kpis }: { kpis: KpiData }) {
  const cards = [
    {
      label: "Total Orders",
      value: kpis.totalOrders.toLocaleString(),
      subtext: "Lifetime processed",
      icon: Package,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Ready to Ship",
      value: kpis.readyToShip.toLocaleString(),
      subtext: "Awaiting courier pickup",
      icon: Clock,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "In Transit",
      value: kpis.inTransit.toLocaleString(),
      subtext: "Live on road / air",
      icon: Truck,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Delivered",
      value: kpis.delivered.toLocaleString(),
      subtext: "Successful handovers",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "NDR Cases",
      value: kpis.ndr.toLocaleString(),
      subtext: "Action required",
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50",
      highlight: kpis.ndr > 0,
    },
    {
      label: "RTO Shipments",
      value: kpis.rto.toLocaleString(),
      subtext: "Returned to warehouse",
      icon: RotateCcw,
      color: "text-orange-600 bg-orange-50",
    },
    {
      label: "COD Pending",
      value: formatINR(kpis.codPending),
      subtext: "To be remitted",
      icon: Banknote,
      color: "text-teal-600 bg-teal-50",
    },
    {
      label: "Wallet Balance",
      value: formatINR(kpis.walletBalance),
      subtext: "Available freight balance",
      icon: Wallet,
      color: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Shipping Spend",
      value: formatINR(kpis.totalShippingSpend),
      subtext: "Courier freight costs",
      icon: IndianRupee,
      color: "text-slate-700 bg-slate-100",
    },
    {
      label: "Delivery Success Rate",
      value: `${kpis.deliverySuccessRate}%`,
      subtext: "Industry benchmark > 90%",
      icon: TrendingUp,
      color: "text-indigo-700 bg-indigo-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-xl border p-4 shadow-xs transition-all ${
              card.highlight
                ? "border-rose-300 bg-rose-50/40"
                : "border-slate-200/80 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 truncate">{card.label}</span>
              <span className={`grid size-7 place-items-center rounded-lg ${card.color}`}>
                <Icon size={15} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900 tracking-tight">{card.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 truncate">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
