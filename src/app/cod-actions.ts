"use server";

import { revalidatePath } from "next/cache";
import {
  approveSettlementBatch,
  executeBankPayoutWithUtr,
  holdSettlementBatch,
  recordPayoutFailure,
  rejectSettlementBatch,
  retryCodPayout,
  submitBatchForApproval,
} from "@/lib/finance/cod-service";
import { recordAdminAuditLog } from "./admin-actions";

function refreshCodPaths() {
  try {
    revalidatePath("/cod");
    revalidatePath("/admin/finance/cod-settlements");
    revalidatePath("/admin/finance/reconciliation");
    revalidatePath("/admin/finance/ledger");
    revalidatePath("/dashboard");
    revalidatePath("/wallet");
  } catch {
    // Outside active request context
  }
}

/**
 * Step 1: Finance Admin reviews and submits batch for approval
 */
export async function submitSettlementForApprovalAction(
  batchId: string,
  adminName: string = "Finance Admin",
) {
  const res = await submitBatchForApproval(batchId, adminName);

  if (res.ok) {
    await recordAdminAuditLog({
      action: "COD_SETTLEMENT_SUBMITTED",
      targetType: "REMITTANCE",
      targetId: batchId,
      details: `Settlement batch ${batchId} reviewed and submitted for Super Admin approval by ${adminName}`,
    });
    refreshCodPaths();
  }

  return res;
}

/**
 * Step 2: Super Admin approves settlement batch
 */
export async function approveCodSettlementAction(
  batchId: string,
  approverName: string = "Super Admin",
) {
  const res = await approveSettlementBatch(batchId, approverName);

  if (res.ok) {
    await recordAdminAuditLog({
      action: "COD_SETTLEMENT_APPROVED",
      targetType: "REMITTANCE",
      targetId: batchId,
      details: `Settlement batch ${batchId} approved for bank payout by ${approverName}`,
    });
    refreshCodPaths();
  }

  return res;
}

/**
 * Step 3: Reject settlement batch
 */
export async function rejectCodSettlementAction(batchId: string, reason: string) {
  const res = await rejectSettlementBatch(batchId, reason);

  if (res.ok) {
    await recordAdminAuditLog({
      action: "COD_SETTLEMENT_REJECTED",
      targetType: "REMITTANCE",
      targetId: batchId,
      details: `Settlement batch ${batchId} rejected. Reason: ${reason}`,
    });
    refreshCodPaths();
  }

  return res;
}

/**
 * Step 4: Put settlement batch on hold
 */
export async function holdCodSettlementAction(batchId: string, reason: string) {
  const res = await holdSettlementBatch(batchId, reason);

  if (res.ok) {
    await recordAdminAuditLog({
      action: "COD_SETTLEMENT_ON_HOLD",
      targetType: "REMITTANCE",
      targetId: batchId,
      details: `Settlement batch ${batchId} put on hold. Reason: ${reason}`,
    });
    refreshCodPaths();
  }

  return res;
}

/**
 * Step 5: Execute Bank Payout with UTR Number
 */
export async function executeCodBankPayoutAction(params: {
  batchId: string;
  bankUtr: string;
  paymentDate?: string;
  paymentMode?: string;
  actualPaidAmount?: number;
}) {
  const res = await executeBankPayoutWithUtr(params);

  if (res.ok) {
    await recordAdminAuditLog({
      action: "COD_PAYOUT_EXECUTED",
      targetType: "REMITTANCE",
      targetId: params.batchId,
      details: `Bank payout completed for batch ${params.batchId}. UTR: ${params.bankUtr}. Reconciliation: ${res.reconciliation}`,
    });
    refreshCodPaths();
  }

  return res;
}

/**
 * Step 6: Mark Payout Failed
 */
export async function recordPayoutFailureAction(batchId: string, reason: string) {
  const res = await recordPayoutFailure(batchId, reason);

  if (res.ok) {
    await recordAdminAuditLog({
      action: "COD_PAYOUT_FAILED",
      targetType: "REMITTANCE",
      targetId: batchId,
      details: `Bank payout failed for batch ${batchId}. Reason: ${reason}`,
    });
    refreshCodPaths();
  }

  return res;
}

/**
 * Step 7: Retry Payout
 */
export async function retryCodPayoutAction(batchId: string) {
  const res = await retryCodPayout(batchId);

  if (res.ok) {
    await recordAdminAuditLog({
      action: "COD_PAYOUT_RETRIED",
      targetType: "REMITTANCE",
      targetId: batchId,
      details: `Payout reset to APPROVED for retry on batch ${batchId}`,
    });
    refreshCodPaths();
  }

  return res;
}
