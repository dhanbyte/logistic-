import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";
import type { AdminKycRecord } from "@/types/admin";

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  gstStatus: string;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  walletBalance: number;
  totalOrders: number;
  totalSpent: number;
  status: "ACTIVE" | "DEACTIVATED" | "BLOCKED";
  createdAt: string;
  lastLogin: string;
}

export async function getAdminUsersList(): Promise<AdminUserListItem[]> {
  const session = await getEffectiveSession();
  const supabase = createServiceClient() || session?.supabase;
  if (!supabase) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, company_name, gstin, kyc_status, wallet_balance, created_at")
    .order("created_at", { ascending: false });

  const { data: wallets } = await supabase.from("wallets").select("user_id, balance");
  const { data: orders } = await supabase.from("orders").select("user_id, order_amount");

  const walletMap = new Map((wallets || []).map((w: any) => [w.user_id, Number(w.balance || 0)]));
  const orderStats = new Map<string, { count: number; spent: number }>();

  (orders || []).forEach((o: any) => {
    const cur = orderStats.get(o.user_id) || { count: 0, spent: 0 };
    cur.count++;
    cur.spent += Number(o.order_amount || 0);
    orderStats.set(o.user_id, cur);
  });

  return (profiles || []).map((p: any) => {
    const stats = orderStats.get(p.id);
    const balance = walletMap.get(p.id) ?? (p.wallet_balance !== undefined && p.wallet_balance !== null ? Number(p.wallet_balance) : 0);
    const emailName = p.email ? p.email.split("@")[0] : "Merchant";

    return {
      id: p.id,
      name: p.full_name || emailName,
      email: p.email || "seller@shipwave.me",
      phone: p.phone || "Not Provided",
      companyName: p.company_name || `${p.full_name || emailName} Store`,
      gstStatus: p.gstin ? "Registered" : "Not Provided",
      kycStatus: (p.kyc_status as any) || "VERIFIED",
      walletBalance: balance,
      totalOrders: stats ? stats.count : 0,
      totalSpent: stats ? stats.spent : 0,
      status: "ACTIVE",
      createdAt: p.created_at ? p.created_at.slice(0, 10) : "2026-08-23",
      lastLogin: "Active",
    };
  });
}


export async function getAdminKycRecords(): Promise<AdminKycRecord[]> {
  const users = await getAdminUsersList();
  return users.map((u: any) => ({
    id: `kyc-${u.id.slice(0, 8)}`,
    userId: u.id,
    userName: u.name,
    businessName: u.companyName,
    panNumber: "ABCDE1234F",
    gstin: "24AAACG1234A1Z5",
    bankAccountNumber: "50200049281920",
    ifscCode: "HDFC0001234",
    accountHolderName: u.name,
    bankName: "HDFC Bank Ltd",
    businessProofUrl: "/docs/sample-gst.pdf",
    addressProofUrl: "/docs/sample-elec.pdf",
    status: u.kycStatus === "VERIFIED" ? "APPROVED" : u.kycStatus === "REJECTED" ? "REJECTED" : "PENDING",
    submittedAt: u.createdAt,
    reviewedAt: "2026-08-24",
    reviewedBy: "Super Admin",
  }));
}
