import { createServiceClient, getEffectiveSession } from "@/lib/supabase/server";
import type {
  AdminCodSettlement,
  AdminRemittanceRequest,
  AdminWalletLedgerItem,
} from "@/types/admin";

export async function getAdminWalletLedger(): Promise<AdminWalletLedgerItem[]> {
  const session = await getEffectiveSession();
  const supabase = createServiceClient() || session?.supabase;
  if (!supabase) return [];

  const { data: transactions } = await supabase
    .from("wallet_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (transactions && transactions.length > 0) {
    return transactions.map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      userName: "Merchant Shipper",
      orderId: t.reference_id?.startsWith("ORD") ? t.reference_id : undefined,
      type: (t.category as any) || "SHIPPING_CHARGE",
      creditDebit: t.transaction_type as "CREDIT" | "DEBIT",
      amount: t.amount,
      fee: Math.round(t.amount * 0.02),
      gst: Math.round(t.amount * 0.02 * 0.18),
      netAmount: t.amount,
      previousBalance: t.balance_after + (t.transaction_type === "DEBIT" ? t.amount : -t.amount),
      newBalance: t.balance_after,
      status: "SUCCESS",
      referenceId: t.reference_id || t.id,
      createdAt: t.created_at,
      createdBy: "System / Gateway",
    }));
  }

  return [];
}

export async function getAdminCodSettlements(): Promise<AdminCodSettlement[]> {
  const session = await getEffectiveSession();
  const supabase = createServiceClient() || session?.supabase;
  if (!supabase) return [];


  const { data: shipments } = await supabase
    .from("ecommerce_shipments")
    .select("*, order:orders(*), courier_provider:courier_providers(*)")
    .eq("payment_mode", "COD")
    .order("created_at", { ascending: false });

  if (shipments && shipments.length > 0) {
    return shipments.map((s: any) => {
      const isDelivered = s.shipment_status === "DELIVERED";
      const codAmt = Number(s.cod_amount || 0);
      const freight = Number(s.shipping_charge || 45);
      const codFee = 20;
      const finalAmt = Math.max(0, codAmt - freight - codFee);

      return {
        id: `set-${s.id.slice(0, 8)}`,
        userId: s.user_id,
        userName: s.order?.customer_name || "Merchant Shipper",
        orderId: s.order_id,
        orderNumber: s.order?.order_number || "ORD-COD",
        awbNumber: s.awb_number,
        codAmount: codAmt,
        courierName: s.courier_provider?.name || "Courier Partner",
        courierCharges: freight,
        codFee,
        platformFee: 5,
        otherCharges: 0,
        finalSettlementAmount: finalAmt,
        settlementDate: s.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        status: isDelivered ? "SETTLED" : "PROCESSING",
        bankUtr: isDelivered ? `HDFC${Date.now().toString().slice(-8)}` : undefined,
      };
    });
  }

  return [];
}

export async function getAdminRemittances(): Promise<AdminRemittanceRequest[]> {
  return [];
}
