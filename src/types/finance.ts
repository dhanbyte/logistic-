export type WalletStatus = "ACTIVE" | "FROZEN" | "SUSPENDED";

export type TransactionDirection = "CREDIT" | "DEBIT";

export type TransactionType =
  | "WALLET_RECHARGE"
  | "SHIPPING_CHARGE"
  | "SHIPPING_RESERVE"
  | "SHIPPING_DEBIT"
  | "SHIPPING_REVERSAL"
  | "COD_FEE"
  | "RTO_CHARGE"
  | "NDR_CHARGE"
  | "FULL_REFUND"
  | "PARTIAL_REFUND"
  | "CANCELLATION_REFUND"
  | "COD_SETTLEMENT"
  | "MANUAL_CREDIT"
  | "MANUAL_DEBIT"
  | "ADJUSTMENT"
  | "REVERSAL"
  | "FREE_CREDIT_GRANTED"
  | "FREE_CREDIT_USED"
  | "FREE_CREDIT_RELEASED"
  | "PROMO_CREDIT_GRANTED"
  | "COD_CHARGE"
  | "REFUND"
  | "PAYOUT"
  | "ADMIN_ADJUSTMENT";

export type ReservationStatus = "PENDING" | "COMMITTED" | "RELEASED" | "EXPIRED";

export type CodSettlementStatus =
  | "COD_PENDING"
  | "DELIVERED"
  | "SETTLEMENT_SCHEDULED"
  | "PAYABLE"
  | "PROCESSING"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "BANK_PROCESSING"
  | "PAID"
  | "FAILED"
  | "REVERSED"
  | "ON_HOLD"
  | "PENDING"
  | "SETTLED";

export type PaymentState =
  | "CREATED"
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface WalletAccount {
  id: string;
  userId: string;
  cashBalancePaise: number;
  freeCreditPaise: number;
  promoCreditPaise: number;
  reservedBalancePaise: number;
  creditLimitPaise: number;
  usedCreditPaise: number;
  currency: string;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ComputedWalletBalance {
  cashBalancePaise: number;
  freeCreditPaise: number;
  promoCreditPaise: number;
  reservedBalancePaise: number;
  creditLimitPaise: number;
  usedCreditPaise: number;
  availableCreditPaise: number;
  availableCashPaise: number;
  totalAvailableFundsPaise: number;
  isLowBalance: boolean;
  status: WalletStatus;
}

export interface WalletLedgerEntry {
  id: string;
  userId: string;
  walletId: string;
  transactionType: TransactionType;
  amountPaise: number;
  direction: TransactionDirection;
  currency: string;
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  creditBeforePaise: number;
  creditAfterPaise: number;
  referenceType?: "ORDER" | "SHIPMENT" | "PAYMENT" | "SETTLEMENT" | "ADMIN" | "REFUND";
  referenceId?: string;
  paymentId?: string;
  orderId?: string;
  shipmentId?: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface WalletReservation {
  id: string;
  userId: string;
  walletId: string;
  orderId: string;
  amountPaise: number;
  fromCreditPaise: number;
  fromCashPaise: number;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface CodSettlementOrderItem {
  id: string;
  orderId: string;
  orderNumber: string;
  shipmentId: string;
  awbNumber: string;
  courierName: string;
  deliveryDate: string;
  settlementDate: string;
  codAmount: number;
  freightCharge: number;
  codFee: number;
  tax: number;
  otherCharges: number;
  netPayable: number;
  status: CodSettlementStatus;
  bankUtr?: string;
}

export interface CodSettlementBatch {
  id: string;
  batchReference: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  settlementDate: string;
  orderCount: number;
  totalCodCollected: number;
  totalFreight: number;
  totalCodFees: number;
  totalTaxes: number;
  otherCharges: number;
  totalDeductions: number;
  netPayable: number;
  status: CodSettlementStatus;
  bankAccountLast4: string;
  bankIfsc: string;
  bankName: string;
  accountHolderName: string;
  isBankVerified: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  bankUtr?: string;
  paymentDate?: string;
  paymentMode?: string;
  failureReason?: string;
  isReconciled: boolean;
  reconciliationDiff?: number;
  orders: CodSettlementOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CodSettlementRecord {
  id: string;
  userId: string;
  orderId: string;
  orderNumber: string;
  shipmentId: string;
  awbNumber: string;
  courierName: string;
  codAmountPaise: number;
  shippingChargePaise: number;
  codFeePaise: number;
  otherChargesPaise: number;
  taxPaise: number;
  refundAmountPaise: number;
  netSettlementPaise: number;
  status: CodSettlementStatus;
  deliveryDate?: string;
  settlementDays?: number;
  paymentReference?: string;
  payoutReference?: string;
  bankAccountLast4?: string;
  bankIfsc?: string;
  bankName?: string;
  accountHolderName?: string;
  settlementDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserBankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  maskedAccountNumber: string;
  ifsc: string;
  isVerified: boolean;
  beneficiaryStatus: "ACTIVE" | "PENDING" | "REJECTED";
}

export interface RefundRecord {
  id: string;
  originalTransactionId: string;
  userId: string;
  amountPaise: number;
  reason: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  gatewayReference?: string;
  createdAt: string;
}
