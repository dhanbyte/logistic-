import type { RefundRecord } from "@/types/finance";
import { addPaise, subPaise, toPaise, toRupees } from "./money";
import { getOrCreateWallet, recordLedgerEntry } from "./wallet-service";

const inMemoryRefunds = new Map<string, RefundRecord>();

/**
 * Reverses a shipping freight deduction upon cancelled parcel / voided label
 */
export async function processShippingReversal(params: {
  userId: string;
  amountPaise: number;
  originalTransactionId: string;
  awbNumber: string;
  reason: string;
}): Promise<{ ok: boolean; message: string; refundId?: string }> {
  if (params.amountPaise <= 0) {
    return { ok: false, message: "Invalid refund amount." };
  }

  const wallet = await getOrCreateWallet(params.userId);
  const prevBalance = wallet.cashBalancePaise;
  wallet.cashBalancePaise = addPaise(wallet.cashBalancePaise, params.amountPaise);

  const refundId = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const record: RefundRecord = {
    id: refundId,
    originalTransactionId: params.originalTransactionId,
    userId: params.userId,
    amountPaise: params.amountPaise,
    reason: params.reason,
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
  };

  inMemoryRefunds.set(refundId, record);

  await recordLedgerEntry({
    userId: params.userId,
    walletId: wallet.id,
    transactionType: "REVERSAL",
    amountPaise: params.amountPaise,
    direction: "CREDIT",
    balanceBeforePaise: prevBalance,
    balanceAfterPaise: wallet.cashBalancePaise,
    creditBeforePaise: wallet.freeCreditPaise,
    creditAfterPaise: wallet.freeCreditPaise,
    referenceType: "REFUND",
    referenceId: refundId,
    shipmentId: params.awbNumber,
    status: "SUCCESS",
    description: `Shipping charge reversal for AWB ${params.awbNumber}: ${params.reason}`,
  });

  return {
    ok: true,
    refundId,
    message: `Recredited ₹${toRupees(params.amountPaise).toFixed(2)} to wallet for cancelled shipment.`,
  };
}

/**
 * Inbound payment gateway recharge refund
 */
export async function processWalletRechargeRefund(params: {
  userId: string;
  amountPaise: number;
  paymentId: string;
  gatewayRefundRef?: string;
  reason: string;
}): Promise<{ ok: boolean; message: string; refundId?: string }> {
  const wallet = await getOrCreateWallet(params.userId);

  if (wallet.cashBalancePaise < params.amountPaise) {
    return {
      ok: false,
      message: "Insufficient cash balance in wallet to process gateway refund.",
    };
  }

  const prevBalance = wallet.cashBalancePaise;
  wallet.cashBalancePaise = subPaise(wallet.cashBalancePaise, params.amountPaise);

  const refundId = `ref-gw-${Date.now()}`;
  const record: RefundRecord = {
    id: refundId,
    originalTransactionId: params.paymentId,
    userId: params.userId,
    amountPaise: params.amountPaise,
    reason: params.reason,
    status: "COMPLETED",
    gatewayReference: params.gatewayRefundRef,
    createdAt: new Date().toISOString(),
  };

  inMemoryRefunds.set(refundId, record);

  await recordLedgerEntry({
    userId: params.userId,
    walletId: wallet.id,
    transactionType: "REFUND",
    amountPaise: params.amountPaise,
    direction: "DEBIT",
    balanceBeforePaise: prevBalance,
    balanceAfterPaise: wallet.cashBalancePaise,
    creditBeforePaise: wallet.freeCreditPaise,
    creditAfterPaise: wallet.freeCreditPaise,
    referenceType: "REFUND",
    referenceId: refundId,
    paymentId: params.paymentId,
    status: "SUCCESS",
    description: `Wallet topup refund via payment gateway: ${params.reason}`,
  });

  return {
    ok: true,
    refundId,
    message: `Processed gateway refund of ₹${toRupees(params.amountPaise).toFixed(2)}.`,
  };
}
