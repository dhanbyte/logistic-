import type { OrderStatus, PaymentMode, SettlementStatus } from "@/types";

export type AdminRole = "SUPER_ADMIN" | "FINANCE_ADMIN" | "OPERATIONS_ADMIN" | "SUPPORT_ADMIN" | "VIEWER";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AdminKycRecord {
  id: string;
  userId: string;
  userName: string;
  businessName: string;
  panNumber: string;
  gstin?: string;
  bankAccountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName: string;
  businessProofUrl?: string;
  addressProofUrl?: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AdminWalletLedgerItem {
  id: string;
  userId: string;
  userName: string;
  orderId?: string;
  type:
    | "WALLET_RECHARGE"
    | "SHIPPING_CHARGE"
    | "COD_SETTLEMENT"
    | "PREPAID_SETTLEMENT"
    | "REFUND"
    | "MANUAL_CREDIT"
    | "MANUAL_DEBIT"
    | "REMITTANCE"
    | "REMITTANCE_FEE"
    | "RTO_CHARGE"
    | "ADJUSTMENT";
  creditDebit: "CREDIT" | "DEBIT";
  amount: number;
  fee: number;
  gst: number;
  netAmount: number;
  previousBalance: number;
  newBalance: number;
  status: "SUCCESS" | "PENDING" | "FAILED" | "REVERSED";
  referenceId?: string;
  createdAt: string;
  createdBy: string;
}

export interface AdminCodSettlement {
  id: string;
  userId: string;
  userName: string;
  orderId: string;
  orderNumber: string;
  awbNumber: string;
  codAmount: number;
  courierName: string;
  courierCharges: number;
  codFee: number;
  platformFee: number;
  otherCharges: number;
  finalSettlementAmount: number;
  settlementDate: string;
  status: "PENDING" | "PROCESSING" | "SETTLED" | "FAILED" | "REVERSED";
  bankUtr?: string;
}

export interface AdminRemittanceRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  bankAccount: string;
  ifsc: string;
  beneficiary: string;
  processingFee: number;
  gst: number;
  netAmount: number;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "PROCESSING" | "SUCCESS" | "FAILED" | "REVERSED";
  approvalLevelRequired: "AUTO" | "OPERATIONS_ADMIN" | "SUPER_ADMIN";
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  bankUtr?: string;
}

export interface AdminCourierPartner {
  id: string;
  code: string;
  name: string;
  apiStatus: "HEALTHY" | "DEGRADED" | "DOWN";
  isActive: boolean;
  codAvailable: boolean;
  prepaidAvailable: boolean;
  totalShipments: number;
  successRate: number;
  avgDeliveryDays: number;
  lastPingMs: number;
  environment: "PRODUCTION" | "SANDBOX";
  webhookUrl: string;
}

export interface AdminShippingRateSlab {
  id: string;
  courierCode: string;
  courierName: string;
  zone: "ZONE_A" | "ZONE_B" | "ZONE_C" | "ZONE_D" | "ZONE_E";
  weightSlab: "0-500g" | "500g-1kg" | "1kg-2kg" | "ADDITIONAL_500g";
  courierBaseCost: number;
  userPrepaidPrice: number;
  userCodPrice: number;
  platformMarginPrepaid: number;
  platformMarginCod: number;
}

export interface AdminSupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: "PAYMENT" | "WALLET" | "COD" | "SHIPMENT" | "COURIER" | "REFUND" | "REMITTANCE" | "TECHNICAL" | "OTHER";
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedAdmin?: string;
  createdAt: string;
  updatedAt: string;
  replies: {
    id: string;
    sender: "USER" | "ADMIN";
    senderName: string;
    message: string;
    createdAt: string;
    isInternal?: boolean;
  }[];
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: "USER" | "WALLET" | "KYC" | "COURIER" | "RATE" | "REMITTANCE" | "SETTINGS" | "ORDER";
  targetId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface AdminDashboardKpis {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalOrders: number;
  todaysOrders: number;
  pendingOrders: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  rto: number;
  ndr: number;
  codOrders: number;
  prepaidOrders: number;
  totalCodCollection: number;
  totalPrepaidValue: number;
  totalShippingRevenue: number;
  platformRevenue: number;
  pendingSettlements: number;
  completedSettlements: number;
  totalWalletBalance: number;
  pendingWalletRequests: number;
  pendingRemittance: number;
  failedPayments: number;
}
