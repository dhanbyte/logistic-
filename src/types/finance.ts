export type WalletStatus = "ACTIVE" | "FROZEN" | "SUSPENDED";

export type TransactionDirection = "CREDIT" | "DEBIT";

export type TransactionType =
  | "WALLET_RECHARGE"
  | "SHIPPING_RESERVE"
  | "SHIPPING_DEBIT"
  | "SHIPPING_REVERSAL"
  | "FREE_CREDIT_GRANTED"
  | "FREE_CREDIT_USED"
  | "FREE_CREDIT_RELEASED"
  | "PROMO_CREDIT_GRANTED"
  | "COD_CHARGE"
  | "REFUND"
  | "PAYOUT"
  | "ADMIN_ADJUSTMENT"
  | "REVERSAL";

export type ReservationStatus = "PENDING" | "COMMITTED" | "RELEASED" | "EXPIRED";

export type CodSettlementStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "ON_HOLD"
  | "REVERSED";

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
  paymentReference?: string;
  payoutReference?: string;
  bankAccountLast4?: string;
  bankIfsc?: string;
  settlementDate: string;
  createdAt: string;
  updatedAt: string;
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
