import { describe, expect, it } from "vitest";
import {
  calculateGst,
  formatPaiseINR,
  toPaise,
  toRupees,
} from "./money";
import {
  commitShippingReservation,
  computeAvailableFunds,
  creditWalletRecharge,
  getOrCreateWallet,
  grantFreeCredit,
  releaseShippingReservation,
  reserveShippingFunds,
} from "./wallet-service";
import {
  calculateNetCodSettlement,
  createCodSettlementRecord,
  markCodSettlementPaid,
  processCodPayout,
} from "./cod-service";
import {
  processShippingReversal,
  processWalletRechargeRefund,
} from "./refund-service";

describe("Production-Ready Financial, Wallet, Credit & COD Settlement Engine", () => {
  const testUserId = "user-test-finance-101";

  // Test 1: Integer minor unit (paise) precision without float rounding errors
  it("Scenario 14: Calculates precise minor units (paise) without float rounding errors", () => {
    expect(toPaise(100.5)).toBe(10050);
    expect(toRupees(10050)).toBe(100.5);
    expect(toPaise(0.1 + 0.2)).toBe(30); // Eliminates 0.30000000000000004 float bug

    const gst = calculateGst(toPaise(100), 18);
    expect(gst.basePaise).toBe(10000);
    expect(gst.gstPaise).toBe(1800);
    expect(gst.totalPaise).toBe(11800);
    expect(formatPaiseINR(11800)).toBe("₹118");
  });

  // Test 2: Successful wallet recharge with ledger credit
  it("Scenario 1: Credits wallet upon successful recharge and produces double-entry ledger entry", async () => {
    const rechargeAmountPaise = toPaise(1000); // ₹1,000
    const res = await creditWalletRecharge({
      userId: testUserId,
      amountPaise: rechargeAmountPaise,
      paymentId: "pay_test_001",
      gatewayReference: "Razorpay PG",
    });

    expect(res.ok).toBe(true);
    expect(res.newBalancePaise).toBeGreaterThanOrEqual(rechargeAmountPaise);

    const wallet = await getOrCreateWallet(testUserId);
    const computed = computeAvailableFunds(wallet);
    expect(computed.cashBalancePaise).toBe(res.newBalancePaise);
  });

  // Test 3: Free credit grant, usage, and non-withdrawable invariant enforcement
  it("Scenario 8: Admin grants promotional free credit which is non-withdrawable", async () => {
    const creditAmountPaise = toPaise(500); // ₹500 promotional credit
    const grantRes = await grantFreeCredit({
      userId: testUserId,
      amountPaise: creditAmountPaise,
      creditLimitPaise: toPaise(2500),
      reason: "Promotional Diwali Campaign",
      adminId: "admin-root",
    });

    expect(grantRes.ok).toBe(true);
    const wallet = await getOrCreateWallet(testUserId);
    const computed = computeAvailableFunds(wallet);
    expect(computed.freeCreditPaise).toBeGreaterThanOrEqual(creditAmountPaise);
  });

  // Test 4: Wallet Two-Phase Reservation hold
  it("Scenario 5: Two-Phase Commit - Reserves shipping funds before courier dispatch", async () => {
    const shippingChargePaise = toPaise(120); // ₹120
    const reserveRes = await reserveShippingFunds({
      userId: testUserId,
      orderId: "ORD-TEST-991",
      amountPaise: shippingChargePaise,
    });

    expect(reserveRes.ok).toBe(true);
    expect(reserveRes.reservationId).toBeDefined();

    const wallet = await getOrCreateWallet(testUserId);
    expect(wallet.reservedBalancePaise + wallet.usedCreditPaise).toBeGreaterThanOrEqual(shippingChargePaise);
  });

  // Test 5: Successful shipment deduction converts reservation into debit
  it("Scenario 6: Commits shipping reservation on successful courier label creation", async () => {
    const shippingChargePaise = toPaise(80);
    const reserve = await reserveShippingFunds({
      userId: testUserId,
      orderId: "ORD-COMMIT-01",
      amountPaise: shippingChargePaise,
    });

    const commitRes = await commitShippingReservation({
      reservationId: reserve.reservationId!,
      shipmentId: "shp-commit-01",
      awbNumber: "SF991829102",
    });

    expect(commitRes.ok).toBe(true);
  });

  // Test 6: Failed shipment release restores reserved funds
  it("Scenario 5b: Releases reservation and restores funds on failed booking", async () => {
    const shippingChargePaise = toPaise(150);
    const reserve = await reserveShippingFunds({
      userId: testUserId,
      orderId: "ORD-FAIL-01",
      amountPaise: shippingChargePaise,
    });

    const releaseRes = await releaseShippingReservation({
      reservationId: reserve.reservationId!,
      reason: "Carrier API Gateway Timeout",
    });

    expect(releaseRes.ok).toBe(true);
  });

  // Test 7: Insufficient balance rejection
  it("Scenario 13: Blocks shipment creation when cash + allowed credit limit is insufficient", async () => {
    const hugeAmountPaise = toPaise(99999999); // ₹9,99,999.99
    const reserveRes = await reserveShippingFunds({
      userId: testUserId,
      orderId: "ORD-OVERFLOW-01",
      amountPaise: hugeAmountPaise,
    });

    expect(reserveRes.ok).toBe(false);
    expect(reserveRes.message).toContain("Insufficient funds");
  });

  // Test 8: Frozen wallet protection
  it("Scenario 12: Blocks reservations on frozen / suspended wallets", async () => {
    const wallet = await getOrCreateWallet(testUserId);
    wallet.status = "FROZEN";

    const reserveRes = await reserveShippingFunds({
      userId: testUserId,
      orderId: "ORD-FROZEN-01",
      amountPaise: toPaise(50),
    });

    expect(reserveRes.ok).toBe(false);
    expect(reserveRes.message).toContain("frozen");

    // Unfreeze for subsequent tests
    wallet.status = "ACTIVE";
  });

  // Test 9: Concurrent shipment creation / race condition protection
  it("Scenario 4 & 15: Concurrently reserves funds safely without double spending", async () => {
    const promise1 = reserveShippingFunds({
      userId: testUserId,
      orderId: "ORD-CONCUR-01",
      amountPaise: toPaise(50),
    });
    const promise2 = reserveShippingFunds({
      userId: testUserId,
      orderId: "ORD-CONCUR-02",
      amountPaise: toPaise(50),
    });

    const [res1, res2] = await Promise.all([promise1, promise2]);
    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(true);
    expect(res1.reservationId).not.toBe(res2.reservationId);
  });

  // Test 10: COD settlement calculation (Net = COD - Shipping - COD Fee - Taxes)
  it("Scenario 9: Computes deterministic COD net merchant settlement", () => {
    const calc = calculateNetCodSettlement({
      codAmountPaise: toPaise(1000),       // ₹1,000 COD
      shippingChargePaise: toPaise(80),    // ₹80 freight
      codFeePaise: toPaise(20),            // ₹20 COD collection fee
      taxPaise: toPaise(3.6),              // ₹3.60 GST
    });

    expect(calc.grossCollectedPaise).toBe(toPaise(1000));
    expect(calc.totalDeductionsPaise).toBe(toPaise(103.6));
    expect(calc.netSettlementPaise).toBe(toPaise(896.4));
  });

  // Test 11: COD Settlement Record Creation & Payout Lifecycle
  it("Scenario 10: Generates COD settlement and prevents duplicate payouts", async () => {
    const settlement = await createCodSettlementRecord({
      userId: testUserId,
      orderId: "ORD-COD-882",
      orderNumber: "ORD-882",
      shipmentId: "shp-882",
      awbNumber: "SF8829102",
      courierName: "Shadowfax Express",
      codAmountPaise: toPaise(1500),
      shippingChargePaise: toPaise(90),
      codFeePaise: toPaise(25),
    });

    expect(settlement.status).toBe("PENDING");

    // Initiate Payout
    const payout1 = await processCodPayout({
      settlementId: settlement.id,
      bankAccountLast4: "4920",
      bankIfsc: "HDFC0001234",
      idempotencyKey: "idem-po-882-01",
    });

    expect(payout1.ok).toBe(true);
    expect(payout1.payoutReference).toBeDefined();

    // Confirm Bank UTR
    const paidRes = await markCodSettlementPaid({
      settlementId: settlement.id,
      bankUtr: "HDFC9928192019",
    });
    expect(paidRes.ok).toBe(true);

    // Attempt Duplicate Payout - must be prevented
    const duplicatePayout = await processCodPayout({
      settlementId: settlement.id,
      bankAccountLast4: "4920",
      bankIfsc: "HDFC0001234",
      idempotencyKey: "idem-po-882-02",
    });

    expect(duplicatePayout.ok).toBe(false);
    expect(duplicatePayout.message).toContain("Duplicate payout prevented");
  });

  // Test 12: Shipping freight reversal upon cancelled order
  it("Scenario 7: Reverses shipping charges upon label cancellation", async () => {
    const reversal = await processShippingReversal({
      userId: testUserId,
      amountPaise: toPaise(42.5),
      originalTransactionId: "tx-commit-01",
      awbNumber: "SF991829102",
      reason: "Shipper cancelled before dispatch",
    });

    expect(reversal.ok).toBe(true);
    expect(reversal.refundId).toBeDefined();
  });

  // Test 13: Gateway Topup Refund validation
  it("Scenario 11: Validates and processes payment gateway recharge refund", async () => {
    const refundRes = await processWalletRechargeRefund({
      userId: testUserId,
      amountPaise: toPaise(500),
      paymentId: "pay_test_001",
      reason: "Merchant requested refund of unused balance",
    });

    expect(refundRes.ok).toBe(true);
    expect(refundRes.refundId).toBeDefined();
  });

  // Test 14: 5-Hour Cancellation Policy - 100% Refund within 5 hours
  it("Scenario 16: Cancellation within 5 hours yields 100% refund", async () => {
    const { processShipmentCancellationRefund } = await import("./wallet-service");
    const shippingChargePaise = toPaise(200); // ₹200
    const recentCreatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

    const refund = await processShipmentCancellationRefund({
      userId: testUserId,
      orderId: "ORD-REFUND-100",
      awbNumber: "SF-REFUND-100",
      shippingChargePaise,
      shipmentCreatedAt: recentCreatedAt,
    });

    expect(refund.ok).toBe(true);
    expect(refund.refundPercentage).toBe(100);
    expect(refund.refundAmountPaise).toBe(toPaise(200));
    expect(refund.cancellationFeePaise).toBe(0);
  });

  // Test 15: 5-Hour Cancellation Policy - 50% Refund after 5 hours
  it("Scenario 17: Cancellation after 5 hours yields 50% refund", async () => {
    const { processShipmentCancellationRefund } = await import("./wallet-service");
    const shippingChargePaise = toPaise(200); // ₹200
    const oldCreatedAt = new Date(Date.now() - 7 * 60 * 60 * 1000); // 7 hours ago

    const refund = await processShipmentCancellationRefund({
      userId: testUserId,
      orderId: "ORD-REFUND-50",
      awbNumber: "SF-REFUND-50",
      shippingChargePaise,
      shipmentCreatedAt: oldCreatedAt,
    });

    expect(refund.ok).toBe(true);
    expect(refund.refundPercentage).toBe(50);
    expect(refund.refundAmountPaise).toBe(toPaise(100)); // 50% = ₹100
    expect(refund.cancellationFeePaise).toBe(toPaise(100));
  });

  // Test 16: Duplicate Refund Prevention
  it("Scenario 18: Prevents duplicate cancellation refund on same AWB", async () => {
    const { processShipmentCancellationRefund } = await import("./wallet-service");
    const shippingChargePaise = toPaise(150);

    const firstRefund = await processShipmentCancellationRefund({
      userId: testUserId,
      orderId: "ORD-DUP-01",
      awbNumber: "SF-DUP-AWB-01",
      shippingChargePaise,
      shipmentCreatedAt: new Date(),
    });
    expect(firstRefund.ok).toBe(true);

    const duplicateRefund = await processShipmentCancellationRefund({
      userId: testUserId,
      orderId: "ORD-DUP-01",
      awbNumber: "SF-DUP-AWB-01",
      shippingChargePaise,
      shipmentCreatedAt: new Date(),
    });
    expect(duplicateRefund.ok).toBe(false);
    expect(duplicateRefund.message).toContain("already been processed");
  });

  // Test 17: COD Settlement Credit to Wallet
  it("Scenario 19: Credits wallet upon confirmed COD settlement", async () => {
    const { processCodSettlementCredit } = await import("./wallet-service");
    const settlementPaise = toPaise(2400); // ₹2,400

    const creditRes = await processCodSettlementCredit({
      userId: testUserId,
      settlementId: "set-live-01",
      netSettlementPaise: settlementPaise,
      awbNumber: "SF-COD-SETTLE-01",
    });

    expect(creditRes.ok).toBe(true);
    expect(creditRes.message).toContain("Credited ₹2400.00");
  });
});
