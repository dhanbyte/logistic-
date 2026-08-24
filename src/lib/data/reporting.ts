import { carriers as demoCarriers } from "@/data/mock-data";
import { getShipments } from "@/lib/data/shipments";
import {
  aggregateReportingData,
  type MonthlyPoint,
  type ReportingSummary,
} from "@/lib/reporting-calculations";
import { getEffectiveSession } from "@/lib/supabase/server";
import type { Currency } from "@/types";

export type { MonthlyPoint };
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
  const [profile, result] = await Promise.all([getProfile(), getShipments()]);
  const carrierNames = result.isDemo
    ? demoCarriers.map((carrier) => carrier.companyName)
    : [...new Set(result.shipments.map((shipment) => shipment.carrier))];

  return {
    isDemo: result.isDemo,
    currency: profile.reportingCurrency,
    ...aggregateReportingData(result.shipments, new Date(), carrierNames),
  };
}

export async function canCreateSampleWorkspace() {
  const supabase = await createClient();
  if (!supabase) return false;
  const [clients, carriers] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("carriers").select("id", { count: "exact", head: true }),
  ]);
  if (clients.error || carriers.error) throw new Error("Unable to inspect sample workspace");
  return clients.count === 0 && carriers.count === 0;
}
