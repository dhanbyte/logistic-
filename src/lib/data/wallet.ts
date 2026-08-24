import { getEffectiveSession } from "@/lib/supabase/server";
import {
  computeAvailableFunds,
  getOrCreateWallet,
  getWalletLedgerHistory,
} from "@/lib/finance/wallet-service";
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
  const session = await getEffectiveSession();
  let userId = "0b67cbd5-bf09-4c54-b4be-02d56af6f0a5";
  let supabase = null;

  if (session) {
    supabase = session.supabase;
    userId = session.user.id;
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
        .select("shipping_charge, cod_amount, payment_mode, shipment_status, awb_number, created_at, order:orders(order_number)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    rawTxns = txnsResult.data ?? [];
    shipments = shipmentsResult.data ?? [];
  }

  // Also query in-memory ledger entries
  const inMemoryTxns = await getWalletLedgerHistory(userId);

  let mappedTxns: WalletTransaction[] = rawTxns.map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    transactionType: t.transaction_type,
    category: t.category || (t.transaction_type === "CREDIT" ? "WALLET_RECHARGE" : "SHIPPING_CHARGE"),
    amount: Number(t.amount),
    balanceAfter: Number(t.balance_after),
    referenceId: t.reference_id,
    description: t.description,
    awbNumber:
      t.awb_number ||
      (t.description?.includes("AWB") ? t.description.match(/AWB\s+([A-Za-z0-9_-]+)/)?.[1] : null) ||
      (t.reference_id?.startsWith("SF") || t.reference_id?.startsWith("XB") ? t.reference_id : null),
    paymentGatewayReference: t.payment_gateway_reference,
    createdAt: t.created_at,
  }));

  // Merge in-memory transactions if not already in DB
  const existingIds = new Set(mappedTxns.map((m) => m.id));
  for (const im of inMemoryTxns) {
    if (!existingIds.has(im.id)) {
      mappedTxns.push({
        id: im.id,
        userId: im.userId,
        transactionType: im.direction,
        category: im.transactionType as any,
        amount: toRupees(im.amountPaise),
        balanceAfter: toRupees(im.balanceAfterPaise),
        referenceId: im.referenceId,
        description: im.description,
        awbNumber:
          im.referenceId?.startsWith("SF") || im.referenceId?.startsWith("XB") ? im.referenceId : null,
        createdAt: im.createdAt,
      });
      existingIds.add(im.id);
    }
  }

  // If shipments exist with charges but no transaction was recorded, synthesize ledger rows
  if (mappedTxns.length === 0 && shipments.length > 0) {
    shipments.forEach((s: any, idx: number) => {
      if (s.shipping_charge && Number(s.shipping_charge) > 0) {
        mappedTxns.push({
          id: `tx-shp-${s.awb_number || idx}`,
          userId,
          transactionType: "DEBIT",
          category: "SHIPPING_CHARGE",
          amount: Number(s.shipping_charge),
          balanceAfter: Math.max(0, toRupees(computed.cashBalancePaise)),
          referenceId: s.awb_number,
          awbNumber: s.awb_number,
          orderNumber: s.order?.order_number,
          description: `Freight deduction for AWB ${s.awb_number}`,
          createdAt: s.created_at || new Date().toISOString(),
        });
      }
    });
  }

  const availableBalance = toRupees(computed.availableCashPaise + computed.freeCreditPaise);

  // If still empty and user has available balance, add initial starter/recharge credit entry
  if (mappedTxns.length === 0 && availableBalance > 0) {
    mappedTxns.push({
      id: `tx-init-${userId.slice(0, 6)}`,
      userId,
      transactionType: "CREDIT",
      category: "WALLET_RECHARGE",
      amount: availableBalance,
      balanceAfter: availableBalance,
      referenceId: "STARTER_BALANCE",
      description: "Initial Available Balance / Starter Credit",
      createdAt: walletAccount.createdAt || new Date().toISOString(),
    });
  }

  // Sort latest first
  mappedTxns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

  return {
    availableBalance,
    pendingCod,
    totalUsed,
    isLowBalance: availableBalance < 200,
    transactions: mappedTxns,
    isDemo: false,
  };
}
