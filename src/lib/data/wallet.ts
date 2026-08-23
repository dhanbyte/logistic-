import { mockEcommerceKpis, mockWalletTransactions } from "@/data/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { WalletTransaction } from "@/types";

export interface WalletSummary {
  currentBalance: number;
  codPending: number;
  totalShippingSpend: number;
  totalCreditThisMonth: number;
  totalDebitThisMonth: number;
  transactions: WalletTransaction[];
  isDemo: boolean;
}

export async function getWalletSummary(filterType?: string): Promise<WalletSummary> {
  const supabase = await createClient();
  if (!supabase) {
    let txns = [...mockWalletTransactions];
    if (filterType && filterType !== "ALL") {
      txns = txns.filter((t) => t.transactionType === filterType);
    }
    return {
      currentBalance: mockEcommerceKpis.walletBalance,
      codPending: mockEcommerceKpis.codPending,
      totalShippingSpend: mockEcommerceKpis.totalShippingSpend,
      totalCreditThisMonth: 9750,
      totalDebitThisMonth: 278.5,
      transactions: txns,
      isDemo: true,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      currentBalance: 0,
      codPending: 0,
      totalShippingSpend: 0,
      totalCreditThisMonth: 0,
      totalDebitThisMonth: 0,
      transactions: [],
      isDemo: false,
    };
  }

  const [profileResult, txnsResult] = await Promise.all([
    supabase.from("profiles").select("wallet_balance").eq("id", user.id).single(),
    supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const currentBalance = Number(profileResult.data?.wallet_balance ?? mockEcommerceKpis.walletBalance);
  const rawTxns = txnsResult.data ?? [];

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

  if (mappedTxns.length === 0) {
    mappedTxns = mockWalletTransactions;
  }

  if (filterType && filterType !== "ALL") {
    mappedTxns = mappedTxns.filter((t) => t.transactionType === filterType);
  }

  return {
    currentBalance,
    codPending: mockEcommerceKpis.codPending,
    totalShippingSpend: mockEcommerceKpis.totalShippingSpend,
    totalCreditThisMonth: 9750,
    totalDebitThisMonth: 278.5,
    transactions: mappedTxns,
    isDemo: !txnsResult.data || txnsResult.data.length === 0,
  };
}
