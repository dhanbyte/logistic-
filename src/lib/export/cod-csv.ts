import type { CodSettlementBatch } from "@/types/finance";

/**
 * Generates formatted CSV string for COD settlement reconciliation
 */
export function generateCodSettlementCsv(batches: CodSettlementBatch[]): string {
  const headers = [
    "Settlement ID",
    "Order ID",
    "AWB",
    "Courier",
    "Delivery Date",
    "Settlement Date",
    "COD Amount",
    "Freight",
    "COD Fee",
    "Other Charges",
    "Net Payable",
    "Status",
    "UTR",
  ];

  const rows: string[] = [headers.join(",")];

  for (const batch of batches) {
    for (const order of batch.orders) {
      rows.push(
        [
          batch.id,
          order.orderNumber,
          order.awbNumber,
          `"${order.courierName}"`,
          order.deliveryDate,
          order.settlementDate,
          order.codAmount.toFixed(2),
          order.freightCharge.toFixed(2),
          (order.codFee + order.tax).toFixed(2),
          order.otherCharges.toFixed(2),
          order.netPayable.toFixed(2),
          order.status,
          batch.bankUtr || order.bankUtr || "PENDING",
        ].join(","),
      );
    }
  }

  return rows.join("\n");
}
