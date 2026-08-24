import { getEffectiveSession } from "@/lib/supabase/server";
import type { Currency, ShipmentStatus } from "@/types";

export type MonthlyPoint = {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
};

export type ReportingSummary = {
  active: number;
  completedThisMonth: number;
  revenue: number;
  costs: number;
  profit: number;
  averageMargin: number;
  shipmentCount: number;
  monthly: MonthlyPoint[];
  statuses: { name: ShipmentStatus; value: number }[];
  profitByClient: { name: string; profit: number }[];
  topClients: { name: string; revenue: number }[];
  topCarriers: { name: string; completed: number }[];
  recent: any[];
};

export type ReportData = ReportingSummary & { isDemo: boolean; currency: Currency };

export async function getProfile() {
  const session = await getEffectiveSession();
  if (!session) {
    return {
      isDemo: false,
      fullName: "Dhanbyte Seller",
      email: "seller@dhanbyte.me",
      reportingCurrency: "INR" as Currency,
    };
  }

  const { supabase, user } = session;
  const { data } = await supabase
    .from("profiles")
    .select("full_name,email,reporting_currency")
    .eq("id", user.id)
    .maybeSingle();

  return {
    isDemo: false,
    fullName: data?.full_name || "Dhanbyte Seller",
    email: data?.email || user.email || "seller@dhanbyte.me",
    reportingCurrency: (data?.reporting_currency as Currency) || ("INR" as Currency),
  };
}

export async function getReportingData(): Promise<ReportData> {
  const profile = await getProfile();
  const session = await getEffectiveSession();

  if (!session) {
    // Return clean zero baseline if not authenticated
    return {
      isDemo: false,
      currency: "INR" as Currency,
      active: 0,
      completedThisMonth: 0,
      revenue: 0,
      costs: 0,
      profit: 0,
      averageMargin: 0,
      shipmentCount: 0,
      monthly: generateEmptyMonthly(),
      statuses: [
        { name: "New", value: 0 },
        { name: "Accepted", value: 0 },
        { name: "In Transit", value: 0 },
        { name: "Delivered", value: 0 },
        { name: "Cancelled", value: 0 },
        { name: "Issue", value: 0 },
      ],
      profitByClient: [],
      topClients: [],
      topCarriers: [],
      recent: [],
    };
  }

  const { supabase, user } = session;

  // 1. Fetch all user orders
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, order_amount, cod_amount, payment_mode, channel_name, order_status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 2. Fetch all user shipments
  const { data: shipments } = await supabase
    .from("ecommerce_shipments")
    .select("id, order_id, awb_number, shipment_status, shipping_charge, courier_charge, created_at, courier_provider:courier_providers(name, code)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rawOrders = orders || [];
  const rawShipments = shipments || [];

  // Financial aggregates
  const totalRevenue = rawOrders.reduce((sum: number, o: any) => sum + Number(o.order_amount || 0), 0);
  const totalFreightCosts = rawShipments.reduce((sum: number, s: any) => sum + Number(s.shipping_charge || 0), 0);
  const netProfit = Math.max(0, totalRevenue - totalFreightCosts);
  const averageMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

  // Shipment status counts
  let active = 0;
  let delivered = 0;
  let newOrders = 0;
  let inTransit = 0;
  let cancelled = 0;
  let issue = 0;

  rawOrders.forEach((o: any) => {
    if (["READY_TO_SHIP", "DRAFT"].includes(o.order_status)) newOrders++;
    else if (["PENDING_PICKUP", "MANIFESTED"].includes(o.order_status)) active++;
    else if (["IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.order_status)) {
      active++;
      inTransit++;
    } else if (o.order_status === "DELIVERED") delivered++;
    else if (o.order_status === "CANCELLED") cancelled++;
    else if (["NDR", "RTO_INITIATED", "RTO_DELIVERED"].includes(o.order_status)) issue++;
  });

  const statuses: { name: ShipmentStatus; value: number }[] = [
    { name: "New", value: newOrders },
    { name: "Accepted", value: active - inTransit },
    { name: "In Transit", value: inTransit },
    { name: "Delivered", value: delivered },
    { name: "Cancelled", value: cancelled },
    { name: "Issue", value: issue },
  ];

  // Channel Profit & Revenue breakdown
  const channelMap = new Map<string, { revenue: number; costs: number }>();
  rawOrders.forEach((o: any) => {
    const ch = o.channel_name || "Direct / Manual";
    const cur = channelMap.get(ch) || { revenue: 0, costs: 0 };
    cur.revenue += Number(o.order_amount || 0);
    channelMap.set(ch, cur);
  });

  const topClients = Array.from(channelMap.entries()).map(([name, data]) => ({
    name,
    revenue: data.revenue,
  }));

  const profitByClient = Array.from(channelMap.entries()).map(([name, data]) => ({
    name,
    profit: Math.max(0, data.revenue - totalFreightCosts),
  }));

  // Courier partner performance
  const courierMap = new Map<string, number>();
  rawShipments.forEach((s: any) => {
    const courierName = s.courier_provider?.name || "Shadowfax Express";
    const cur = courierMap.get(courierName) || 0;
    courierMap.set(courierName, cur + 1);
  });

  const topCarriers = Array.from(courierMap.entries()).map(([name, count]) => ({
    name,
    completed: count,
  }));

  // Generate 6-month trajectory
  const monthly = generateMonthlyTrajectory(rawOrders, rawShipments);

  return {
    isDemo: false,
    currency: profile.reportingCurrency,
    active,
    completedThisMonth: delivered,
    revenue: totalRevenue,
    costs: totalFreightCosts,
    profit: netProfit,
    averageMargin,
    shipmentCount: rawShipments.length || rawOrders.length,
    monthly,
    statuses,
    profitByClient: profitByClient.length > 0 ? profitByClient : [{ name: "Manual Orders", profit: netProfit }],
    topClients: topClients.length > 0 ? topClients : [{ name: "Manual Orders", revenue: totalRevenue }],
    topCarriers: topCarriers.length > 0 ? topCarriers : [{ name: "Shadowfax Express", completed: rawShipments.length }],
    recent: [],
  };
}

function generateEmptyMonthly(): MonthlyPoint[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const res: MonthlyPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    res.push({
      month: months[d.getMonth()],
      revenue: 0,
      costs: 0,
      profit: 0,
    });
  }
  return res;
}

function generateMonthlyTrajectory(orders: any[], shipments: any[]): MonthlyPoint[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const res: MonthlyPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthName = months[d.getMonth()];

    const monthOrders = orders.filter((o) => o.created_at && o.created_at.startsWith(monthKey));
    const monthShipments = shipments.filter((s) => s.created_at && s.created_at.startsWith(monthKey));

    const rev = monthOrders.reduce((sum: number, o: any) => sum + Number(o.order_amount || 0), 0);
    const cost = monthShipments.reduce((sum: number, s: any) => sum + Number(s.shipping_charge || 0), 0);

    // If current month has data, include it
    if (i === 0 && orders.length > 0 && rev === 0) {
      const allRev = orders.reduce((sum: number, o: any) => sum + Number(o.order_amount || 0), 0);
      const allCost = shipments.reduce((sum: number, s: any) => sum + Number(s.shipping_charge || 0), 0);
      res.push({
        month: monthName,
        revenue: allRev,
        costs: allCost,
        profit: Math.max(0, allRev - allCost),
      });
    } else {
      res.push({
        month: monthName,
        revenue: rev,
        costs: cost,
        profit: Math.max(0, rev - cost),
      });
    }
  }

  return res;
}

export async function canCreateSampleWorkspace() {
  return false;
}
