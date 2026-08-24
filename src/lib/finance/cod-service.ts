import { getEffectiveSession } from "@/lib/supabase/server";
import type { CodSettlementRecord, CodSettlementStatus } from "@/types/finance";
import { addPaise, subPaise, toPaise, toRupees } from "./money";

// In-memory settlements store for demo & testing
const inMemoryCodSettlements = new Map<string, CodSettlementRecord>();

/**
 * Calculates net merchant payout for a COD delivery
 * Invariant: All values are in integer paise
 */
export function calculateNetCodSettlement(params: {
  codAmountPaise: number;
  shippingChargePaise: number;
  codFeePaise: number;
  otherChargesPaise?: number;
  taxPaise?: number;
  refundAmountPaise?: number;
}): {
  grossCollectedPaise: number;
  totalDeductionsPaise: number;
  netSettlementPaise: number;
} {
  const otherChargesPaise = params.otherChargesPaise || 0;
  const taxPaise = params.taxPaise || 0;
  const refundAmountPaise = params.refundAmountPaise || 0;

  const totalDeductionsPaise =
    params.shippingChargePaise +
    params.codFeePaise +
    otherChargesPaise +
    taxPaise +
    refundAmountPaise;

  const netSettlementPaise = subPaise(params.codAmountPaise, totalDeductionsPaise);

  return {
    grossCollectedPaise: params.codAmountPaise,
    totalDeductionsPaise,
    netSettlementPaise: Math.max(0, netSettlementPaise),
  };
}

/**
 * Generates a COD Settlement Record upon delivery partner POD confirmation
 */
export async function createCodSettlementRecord(params: {
  userId: string;
  orderId: string;
  orderNumber: string;
  shipmentId: string;
  awbNumber: string;
  courierName: string;
  codAmountPaise: number;
  shippingChargePaise: number;
  codFeePaise?: number;
  otherChargesPaise?: number;
  taxPaise?: number;
}): Promise<CodSettlementRecord> {
  const codFeePaise = params.codFeePaise !== undefined ? params.codFeePaise : toPaise(20); // Default ₹20 COD fee
  const otherChargesPaise = params.otherChargesPaise || 0;
  const taxPaise = params.taxPaise || toPaise(3.6); // 18% GST on COD fee

  const calculation = calculateNetCodSettlement({
    codAmountPaise: params.codAmountPaise,
    shippingChargePaise: params.shippingChargePaise,
    codFeePaise,
    otherChargesPaise,
    taxPaise,
  });

  const settlementId = `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record: CodSettlementRecord = {
    id: settlementId,
    userId: params.userId,
    orderId: params.orderId,
    orderNumber: params.orderNumber,
    shipmentId: params.shipmentId,
    awbNumber: params.awbNumber,
    courierName: params.courierName,
    codAmountPaise: params.codAmountPaise,
    shippingChargePaise: params.shippingChargePaise,
    codFeePaise,
    otherChargesPaise,
    taxPaise,
    refundAmountPaise: 0,
    netSettlementPaise: calculation.netSettlementPaise,
    status: "PENDING",
    settlementDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // T+2 Days
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryCodSettlements.set(settlementId, record);
  return record;
}

/**
 * Dispatches an automated or manual Bank Payout for a settled COD order
 */
export async function processCodPayout(params: {
  settlementId: string;
  bankAccountLast4: string;
  bankIfsc: string;
  idempotencyKey: string;
}): Promise<{ ok: boolean; message: string; payoutReference?: string }> {
  const settlement = inMemoryCodSettlements.get(params.settlementId);
  if (!settlement) {
    return { ok: false, message: "Settlement record not found." };
  }

  if (settlement.status === "PAID") {
    return {
      ok: false,
      message: "Settlement has already been paid out. Duplicate payout prevented.",
    };
  }

  const payoutRef = `PAYOUT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  settlement.status = "PROCESSING";
  settlement.payoutReference = payoutRef;
  settlement.bankAccountLast4 = params.bankAccountLast4;
  settlement.bankIfsc = params.bankIfsc;
  settlement.updatedAt = new Date().toISOString();

  inMemoryCodSettlements.set(params.settlementId, settlement);

  return {
    ok: true,
    payoutReference: payoutRef,
    message: `Payout initiated with reference ${payoutRef}`,
  };
}

/**
 * Confirms bank UTR receipt and finalizes the COD settlement as PAID
 */
export async function markCodSettlementPaid(params: {
  settlementId: string;
  bankUtr: string;
}): Promise<{ ok: boolean; message: string }> {
  const settlement = inMemoryCodSettlements.get(params.settlementId);
  if (!settlement) {
    return { ok: false, message: "Settlement record not found." };
  }

  settlement.status = "PAID";
  settlement.paymentReference = params.bankUtr;
  settlement.updatedAt = new Date().toISOString();

  inMemoryCodSettlements.set(params.settlementId, settlement);

  return {
    ok: true,
    message: `Settlement marked as PAID with Bank UTR: ${params.bankUtr}`,
  };
}

/**
 * Retrieves all COD settlements for a merchant
 */
export async function getMerchantCodSettlements(userId: string): Promise<CodSettlementRecord[]> {
  const all = Array.from(inMemoryCodSettlements.values()).filter((s) => s.userId === userId);
  if (all.length > 0) return all;

  // Initial realistic sample settlements
  return [
    {
      id: "set-cod-101",
      userId,
      orderId: "ord-101",
      orderNumber: "ORD-564240",
      shipmentId: "shp-101",
      awbNumber: "SF37164698496",
      courierName: "Shadowfax Express",
      codAmountPaise: toPaise(1999),
      shippingChargePaise: toPaise(42.5),
      codFeePaise: toPaise(20),
      otherChargesPaise: 0,
      taxPaise: toPaise(3.6),
      refundAmountPaise: 0,
      netSettlementPaise: toPaise(1932.9),
      status: "PAID",
      paymentReference: "HDFC2910291039",
      payoutReference: "PO-RZP-99210",
      bankAccountLast4: "1920",
      bankIfsc: "HDFC0001234",
      settlementDate: "2026-08-24",
      createdAt: "2026-08-22 18:00",
      updatedAt: "2026-08-24 14:00",
    },
    {
      id: "set-cod-102",
      userId,
      orderId: "ord-102",
      orderNumber: "ORD-564241",
      shipmentId: "shp-102",
      awbNumber: "XB3910291029",
      courierName: "Xpressbees Surface",
      codAmountPaise: toPaise(2890),
      shippingChargePaise: toPaise(68),
      codFeePaise: toPaise(25),
      otherChargesPaise: 0,
      taxPaise: toPaise(4.5),
      refundAmountPaise: 0,
      netSettlementPaise: toPaise(2792.5),
      status: "PROCESSING",
      payoutReference: "PO-RZP-99211",
      bankAccountLast4: "1920",
      bankIfsc: "HDFC0001234",
      settlementDate: "2026-08-25",
      createdAt: "2026-08-23 11:30",
      updatedAt: "2026-08-24 09:15",
    },
  ];
}
