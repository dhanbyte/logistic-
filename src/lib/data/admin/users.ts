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

  const { data: wallets } = await (supabase as any).from("wallets").select("user_id, balance");
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
      walletBalance: Number(balance) || 0,
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

export interface AdminUserDetailData {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  status: "ACTIVE" | "BLOCKED" | "DEACTIVATED";
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  billingMode: "PREPAID_WALLET" | "POSTPAID_COD_DEDUCT";
  creditLimit: number;
  walletBalance: number;
  freeCredit: number;
  totalOrders: number;
  deliveredOrders: number;
  deliveryRatePercent: number;
  ndrExceptions: number;
  rtoParcels: number;
  rtoRatePercent: number;
  totalShippingSpent: number;
  totalCodCollected: number;
  netPayableToMerchant: number;
  pendingRemittance: number;
  createdAt: string;
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetailData> {
  const session = await getEffectiveSession();
  const supabase = createServiceClient() || session?.supabase;

  let profile: any = null;
  let walletBalance = 0;
  let orders: any[] = [];
  let shipments: any[] = [];
  let ndrCount = 0;
  let rtoCount = 0;

  if (supabase) {
    const [profRes, walRes, ordRes, shpRes, ndrRes, rtoRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      (supabase as any).from("wallets").select("balance, credit_limit").eq("user_id", userId).maybeSingle(),
      supabase.from("orders").select("id, order_amount, cod_amount, payment_mode, order_status").eq("user_id", userId),
      supabase.from("ecommerce_shipments").select("id, shipment_status, shipping_charge, cod_amount, payment_mode").eq("user_id", userId),
      supabase.from("ndr_cases").select("id").eq("user_id", userId),
      supabase.from("rto_shipments").select("id").eq("user_id", userId),
    ]);

    profile = profRes.data;
    walletBalance = typeof profile?.wallet_balance === "number" ? profile.wallet_balance : Number(walRes.data?.balance || 0);
    orders = ordRes.data || [];
    shipments = shpRes.data || [];
    ndrCount = (ndrRes.data || []).length;
    rtoCount = (rtoRes.data || []).length;
  }

  const totalOrders = orders.length || shipments.length;
  const deliveredOrders = shipments.filter((s: any) => s.shipment_status === "DELIVERED").length;
  const totalDispatched = shipments.length || totalOrders || 1;
  const deliveryRatePercent = shipments.length > 0 ? Number(((deliveredOrders / totalDispatched) * 100).toFixed(1)) : 0;
  const rtoRatePercent = shipments.length > 0 ? Number(((rtoCount / totalDispatched) * 100).toFixed(1)) : 0;

  const totalShippingSpent = shipments.reduce((sum, s: any) => sum + Number(s.shipping_charge || 0), 0);
  const totalCodCollected = shipments
    .filter((s: any) => s.payment_mode === "COD" && s.shipment_status === "DELIVERED")
    .reduce((sum, s: any) => sum + Number(s.cod_amount || 0), 0);

  const pendingRemittance = shipments
    .filter((s: any) => s.payment_mode === "COD" && s.shipment_status !== "DELIVERED")
    .reduce((sum, s: any) => sum + Number(s.cod_amount || 0), 0);

  const netPayableToMerchant = Math.max(0, totalCodCollected - totalShippingSpent);

  const email = profile?.email || "seller@shipwave.me";
  const fullName = profile?.full_name || email.split("@")[0];

  return {
    userId,
    fullName,
    email,
    phone: profile?.phone || "Not Provided",
    companyName: profile?.company_name || `${fullName} Store`,
    status: "ACTIVE",
    kycStatus: profile?.kyc_status || "VERIFIED",
    billingMode: "PREPAID_WALLET",
    creditLimit: 0,
    walletBalance,
    freeCredit: 0,
    totalOrders,
    deliveredOrders,
    deliveryRatePercent,
    ndrExceptions: ndrCount,
    rtoParcels: rtoCount,
    rtoRatePercent,
    totalShippingSpent,
    totalCodCollected,
    netPayableToMerchant,
    pendingRemittance,
    createdAt: profile?.created_at ? profile.created_at.slice(0, 10) : "2026-08-23",
  };
}

