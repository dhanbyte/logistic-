import { createClient } from "@/lib/supabase/server";
import { computeAvailableFunds, getOrCreateWallet } from "@/lib/finance/wallet-service";
import { toRupees } from "@/lib/finance/money";
import type { WalletTransaction } from "@/types";

export interface WalletSummary {
  availableBalance: number; // Actual amount currently available for creating shipments
  pendingCod: number;       // Amount expected from COD settlements
  totalUsed: number;        // Total amount spent on shipping charges
  isLowBalance: boolean;
  transactions: WalletTransaction[];
  isDemo: boolean;
}

export async function getWalletSummary(filterType?: string): Promise<WalletSummary> {
  const supabase = await createClient();
  let userId = "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5";

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userId = user.id;
  }

  // Get multi-asset wallet state
  const walletAccount = await getOrCreateWallet(userId);
  const computed = computeAvailableFunds(walletAccount);

  let rawTxns: any[] = [];
  let shipments: any[] = [];

  if (supabase) {
    const [txnsResult, shipmentsResult] = await Promise.all([
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("ecommerce_shipments")
        .select("shipping_charge, cod_amount, payment_mode, shipment_status, awb_number, order:orders(order_number)")
        .eq("user_id", userId),
    ]);

    rawTxns = txnsResult.data ?? [];
    shipments = shipmentsResult.data ?? [];
  }

  let mappedTxns: WalletTransaction[] = rawTxns.map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    transactionType: t.transaction_type,
    category: t.category || (t.transaction_type === "CREDIT" ? "WALLET_RECHARGE" : "SHIPPING_CHARGE"),
    amount: Number(t.amount),
    balanceAfter: Number(t.balance_after),
    referenceId: t.reference_id,
    description: t.description,
    awbNumber: t.awb_number || (t.description?.includes("AWB") ? t.description.match(/AWB\s+([A-Za-z0-9_-]+)/)?.[1] : null) || t.reference_id,
    paymentGatewayReference: t.payment_gateway_reference,
    createdAt: t.created_at,
  }));

  if (filterType && filterType !== "ALL") {
    mappedTxns = mappedTxns.filter((t) => t.transactionType === filterType || t.category === filterType);
  }

  const totalUsed = shipments.reduce(
    (sum, s: any) => sum + Number(s.shipping_charge || 0),
    0,
  );

  const pendingCod = shipments
    .filter((s: any) => s.payment_mode === "COD" && s.shipment_status !== "DELIVERED")
    .reduce((sum, s: any) => sum + Number(s.cod_amount || 0), 0);

  const availableBalance = toRupees(computed.availableCashPaise + computed.freeCreditPaise);

  return {
    availableBalance,
    pendingCod,
    totalUsed,
    isLowBalance: availableBalance < 200,
    transactions: mappedTxns,
    isDemo: false,
  };
}
