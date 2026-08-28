import { describe, expect, it } from "vitest";
import {
  approveSettlementBatch,
  calculateNetCodSettlement,
  calculateSettlementDate,
  executeBankPayoutWithUtr,
  generateCodSettlementCsv,
  getAdminCodBatches,
  getMerchantCodBatches,
  getUserBankDetails,
  recordPayoutFailure,
  rejectSettlementBatch,
  retryCodPayout,
  saveUserBankDetails,
  submitBatchForApproval,
} from "./cod-service";

import { toPaise } from "./money";

describe("COD Remittance & Bank Settlement System", () => {
  describe("1. Delivery + 2 Days Settlement Calculation", () => {
    it("calculates exact Delivery + 2 Days for standard weekday delivery", () => {
      // 10 August 2026 is Monday -> +2 days = 12 August 2026 (Wednesday)
      const settlementDate = calculateSettlementDate("2026-08-10", 2);
      expect(settlementDate).toBe("2026-08-12");
    });

    it("calculates Delivery + 2 Days for 24 August", () => {
      // 24 August 2026 is Monday -> +2 days = 26 August 2026 (Wednesday)
      const settlementDate = calculateSettlementDate("2026-08-24", 2);
      expect(settlementDate).toBe("2026-08-26");
    });

    it("rolls over to Monday when settlement date lands on a weekend", () => {
      // 2026-08-06 is Thursday -> +2 days = Saturday 2026-08-08 -> rolls over to Monday 2026-08-10
      const settlementDate = calculateSettlementDate("2026-08-06", 2);
      expect(settlementDate).toBe("2026-08-10");
    });

    it("rolls over when settlement date lands on a configured bank holiday", () => {
      // 2026-08-13 is Thursday -> +2 days = Saturday 2026-08-15 (Holiday) -> Sunday 16 -> Monday 2026-08-17
      const settlementDate = calculateSettlementDate("2026-08-13", 2);
      expect(settlementDate).toBe("2026-08-17");
    });
  });

  describe("2. Itemized Net Deduction Formula", () => {
    it("calculates exact net payout for ₹1,999 COD order with freight and fees", () => {
      const calc = calculateNetCodSettlement({
        codAmountPaise: toPaise(1999),
        shippingChargePaise: toPaise(65),
        codFeePaise: toPaise(20),
        taxPaise: toPaise(3.6),
        otherChargesPaise: 0,
      });

      expect(calc.grossCollectedPaise).toBe(199900);
      expect(calc.totalDeductionsPaise).toBe(8860); // 65 + 20 + 3.60 = 88.60 (8860 paise)
      expect(calc.netSettlementPaise).toBe(191040); // 1910.40 (191040 paise)
    });

    it("clamps negative net payout to 0 if deductions exceed collection", () => {
      const calc = calculateNetCodSettlement({
        codAmountPaise: toPaise(50),
        shippingChargePaise: toPaise(65),
        codFeePaise: toPaise(20),
        taxPaise: toPaise(3.6),
      });

      expect(calc.netSettlementPaise).toBe(0);
    });
  });

  describe("3. Verified User Bank Profile", () => {
    it("returns verified bank details with masked account number", () => {
      saveUserBankDetails("user-123", {
        accountHolderName: "Dhananjay",
        bankName: "HDFC Bank Ltd",
        accountNumber: "50200049281920",
        ifsc: "HDFC0001234",
      });
      const bank = getUserBankDetails("user-123");
      expect(bank.isVerified).toBe(true);
      expect(bank.bankName).toBe("HDFC Bank Ltd");
      expect(bank.maskedAccountNumber).toBe("••••1920");
      expect(bank.ifsc).toBe("HDFC0001234");
      expect(bank.beneficiaryStatus).toBe("ACTIVE");
    });
  });


  describe("4. Merchant and Admin Batch Retrieval", () => {
    it("computes merchant batches and top summary metrics", async () => {
      const data = await getMerchantCodBatches("user-demo-123");
      expect(Array.isArray(data.batches)).toBe(true);
      expect(Array.isArray(data.allOrders)).toBe(true);
      expect(data.summary.totalCodCollected).toBeGreaterThanOrEqual(0);
      expect(data.summary.totalFreightAndFees).toBeGreaterThanOrEqual(0);
      expect(data.summary.nextSettlementDate).toBeTruthy();
    });

    it("computes 10 admin KPIs and queue batches", async () => {
      const { batches, kpis } = await getAdminCodBatches();
      expect(Array.isArray(batches)).toBe(true);
      expect(kpis.pendingCod).toBeGreaterThanOrEqual(0);
      expect(kpis.upcoming).toBeGreaterThanOrEqual(0);
      expect(kpis.totalPayable).toBeGreaterThanOrEqual(0);
    });
  });

  describe("5. Two-Level Admin Approval Flow and Bank Payout Execution", () => {
    const testBatchId = "SET-TEST-APPROVAL-01";

    it("completes full lifecycle: submit -> approve -> execute with UTR -> mark paid", async () => {
      // Step 1: Submit for approval
      const submitRes = await submitBatchForApproval(testBatchId, "Finance Admin Aakash");
      expect(submitRes.ok).toBe(true);

      // Step 2: Super Admin approves
      const approveRes = await approveSettlementBatch(testBatchId, "Super Admin Priya");
      expect(approveRes.ok).toBe(true);

      // Step 3: Reject empty UTR
      const emptyUtrRes = await executeBankPayoutWithUtr({
        batchId: testBatchId,
        bankUtr: "",
      });
      expect(emptyUtrRes.ok).toBe(false);

      // Step 4: Execute valid UTR payout
      const payoutRes = await executeBankPayoutWithUtr({
        batchId: testBatchId,
        bankUtr: "HDFC99182371",
        paymentMode: "NEFT",
      });
      expect(payoutRes.ok).toBe(true);
      expect(payoutRes.reconciliation).toBe("MATCHED");
    });

    it("handles failure and retry workflow", async () => {
      const failBatchId = "SET-TEST-FAIL-02";
      await submitBatchForApproval(failBatchId);

      // Mark Failed
      const failRes = await recordPayoutFailure(failBatchId, "Bank IFSC server timeout");
      expect(failRes.ok).toBe(true);

      // Retry
      const retryRes = await retryCodPayout(failBatchId);
      expect(retryRes.ok).toBe(true);
    });
  });

  describe("6. Excel CSV Reconciliation Generator", () => {
    it("generates 13-column CSV with headers and AWB details", async () => {
      const sampleBatches = [
        {
          id: "SET-20260824-001",
          batchReference: "ESCROW-SFX-901",
          userId: "user-1",
          userName: "Test User",
          bankAccountLast4: "5421",
          settlementDate: "2026-08-26",
          status: "PAID" as const,
          orderCount: 1,
          totalCodCollected: 1999,
          totalFreight: 65,
          totalCodFee: 20,
          totalTax: 3.6,
          totalOtherCharges: 0,
          totalDeductions: 88.6,
          netPayable: 1910.4,
          bankUtr: "HDFC99182371",
          orders: [
            {
              id: "item-1",
              orderId: "ord-1",
              orderNumber: "ORD-90241",
              shipmentId: "shp-1",
              awbNumber: "SF37164698128",
              courierName: "Shadowfax Express",
              deliveryDate: "2026-08-24",
              settlementDate: "2026-08-26",
              codAmount: 1999,
              freightCharge: 65,
              codFee: 20,
              tax: 3.6,
              otherCharges: 0,
              totalDeductions: 88.6,
              netPayable: 1910.4,
              status: "PAID" as const,
              bankUtr: "HDFC99182371",
            },
          ],
        },
      ];
      const csv = generateCodSettlementCsv(sampleBatches);

      expect(csv).toContain("Settlement ID,Order ID,AWB,Courier,Delivery Date,Settlement Date,COD Amount,Freight,COD Fee,Other Charges,Net Payable,Status,UTR");
      expect(csv).toContain("SF37164698128");
    });
  });
});
