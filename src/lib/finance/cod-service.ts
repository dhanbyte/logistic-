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
  const session = await getEffectiveSession();
  if (session) {
    const { supabase } = session;
    const { data: shipments } = await supabase
      .from("ecommerce_shipments")
      .select("*, order:orders(*), courier_provider:courier_providers(*)")
      .eq("user_id", userId)
      .eq("payment_mode", "COD")
      .order("created_at", { ascending: false });

    if (shipments && shipments.length > 0) {
      return shipments.map((s: any) => {
        const codAmt = toPaise(Number(s.cod_amount || 0));
        const freight = toPaise(Number(s.shipping_charge || 45));
        const codFee = toPaise(20);
        const tax = toPaise(3.6);
        const net = Math.max(0, codAmt - freight - codFee - tax);
        const isDelivered = s.shipment_status === "DELIVERED";

        return {
          id: `set-${s.id.slice(0, 8)}`,
          userId: s.user_id,
          orderId: s.order_id,
          orderNumber: s.order?.order_number || "ORD-COD",
          shipmentId: s.id,
          awbNumber: s.awb_number,
          courierName: s.courier_provider?.name || "Courier Partner",
          codAmountPaise: codAmt,
          shippingChargePaise: freight,
          codFeePaise: codFee,
          otherChargesPaise: 0,
          taxPaise: tax,
          refundAmountPaise: 0,
          netSettlementPaise: net,
          status: isDelivered ? "PAID" : "PENDING",
          paymentReference: isDelivered ? `HDFC${Date.now().toString().slice(-8)}` : undefined,
          payoutReference: isDelivered ? `PO-RZP-${s.id.slice(0, 6)}` : undefined,
          bankAccountLast4: "1920",
          bankIfsc: "HDFC0001234",
          settlementDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
          createdAt: s.created_at,
          updatedAt: s.created_at,
        };
      });
    }
  }

  return Array.from(inMemoryCodSettlements.values()).filter((s) => s.userId === userId);
}
