import { createClient } from "@/lib/supabase/server";
import { computeAvailableFunds, getOrCreateWallet } from "@/lib/finance/wallet-service";
import { toRupees } from "@/lib/finance/money";
import type { WalletTransaction } from "@/types";

export interface WalletSummary {
  currentBalance: number;
  cashBalance: number;
  freeCredit: number;
  creditLimit: number;
  usedCredit: number;
  reservedBalance: number;
  totalAvailableFunds: number;
  isLowBalance: boolean;
  codPending: number;
  totalShippingSpend: number;
  totalCreditThisMonth: number;
  totalDebitThisMonth: number;
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
        .select("shipping_charge, cod_amount, payment_mode, shipment_status")
        .eq("user_id", userId),
    ]);

    rawTxns = txnsResult.data ?? [];
    shipments = shipmentsResult.data ?? [];
  }

  let mappedTxns: WalletTransaction[] = rawTxns.map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    transactionType: t.transaction_type,
    category: t.category,
    amount: Number(t.amount),
    balanceAfter: Number(t.balance_after),
    referenceId: t.reference_id,
    description: t.description,
    paymentGatewayReference: t.payment_gateway_reference,
    createdAt: t.created_at,
  }));

  if (filterType && filterType !== "ALL") {
    mappedTxns = mappedTxns.filter((t) => t.transactionType === filterType);
  }

  const totalCreditThisMonth = mappedTxns
    .filter((t) => t.transactionType === "CREDIT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalDebitThisMonth = mappedTxns
    .filter((t) => t.transactionType === "DEBIT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalShippingSpend = shipments.reduce(
    (sum, s: any) => sum + Number(s.shipping_charge || 0),
    0,
  );

  const codPending = shipments
    .filter((s: any) => s.payment_mode === "COD" && s.shipment_status !== "DELIVERED")
    .reduce((sum, s: any) => sum + Number(s.cod_amount || 0), 0);

  return {
    currentBalance: toRupees(computed.cashBalancePaise),
    cashBalance: toRupees(computed.cashBalancePaise),
    freeCredit: toRupees(computed.freeCreditPaise),
    creditLimit: toRupees(computed.creditLimitPaise),
    usedCredit: toRupees(computed.usedCreditPaise),
    reservedBalance: toRupees(computed.reservedBalancePaise),
    totalAvailableFunds: toRupees(computed.totalAvailableFundsPaise),
    isLowBalance: computed.isLowBalance,
    codPending,
    totalShippingSpend,
    totalCreditThisMonth,
    totalDebitThisMonth,
    transactions: mappedTxns,
    isDemo: false,
  };
}
