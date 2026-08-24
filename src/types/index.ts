// Standard action response type
export type ActionResult<T = unknown> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

// Legacy Freight types (kept for backwards compatibility until UI phase)
export const shipmentStatuses = ["New", "Accepted", "In Transit", "Delivered", "Cancelled", "Issue"] as const;
export const currencies = ["PLN", "EUR", "USD"] as const;
export const supportedCurrencies = ["INR", "PLN", "EUR", "USD"] as const;
export type ShipmentStatus = (typeof shipmentStatuses)[number];
export type Currency = (typeof currencies)[number];
export type SupportedCurrency = (typeof supportedCurrencies)[number];

export interface Shipment {
  id: string; referenceNumber: string; pickupCity: string; deliveryCity: string;
  clientId: string; client: string; carrierId: string; carrier: string;
  pickupDate: string; deliveryDate: string; clientPrice: number; carrierCost: number;
  additionalCosts: number; profit: number; marginPercent: number; currency: Currency;
  exchangeRateToBase: number; status: ShipmentStatus; notes?: string;
}

export interface ShipmentStatusEvent {
  id: string; shipmentId: string; fromStatus: ShipmentStatus | null; toStatus: ShipmentStatus;
  kind: "created" | "changed" | "baseline"; changedAt: string;
  actor: { fullName: string; email: string } | null;
}

export type ShipmentDocumentMime = "application/pdf" | "image/jpeg" | "image/png";
export interface ShipmentDocument {
  id: string; shipmentId: string; storagePath: string; originalName: string;
  mimeType: ShipmentDocumentMime; sizeBytes: number; status: "pending" | "ready";
  createdAt: string; uploadedAt: string | null;
}

export interface Client { id: string; companyName: string; taxId: string; contactPerson: string; email: string; phone: string; totalShipments: number; totalRevenue: number; averageMargin: number; }
export interface Carrier { id: string; companyName: string; country: string; contactPerson: string; email: string; phone: string; vehicleType: string; rating: number; completedShipments: number; }

// ============================================================================
// ShopWave Logistics — Indian E-Commerce Shipping Aggregator Domain Types
// ============================================================================

export const orderStatuses = [
  "DRAFT",
  "PENDING_PICKUP",
  "READY_TO_SHIP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "NDR",
  "RTO_INITIATED",
  "RTO_DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
] as const;

export const ecommerceShipmentStatuses = [
  "MANIFESTED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "UNDELIVERED_ATTEMPT",
  "NDR",
  "RTO_INITIATED",
  "RTO_IN_TRANSIT",
  "RTO_DELIVERED",
  "CANCELLED",
  "LOST",
  "DAMAGED",
] as const;

export const paymentModes = ["PREPAID", "COD"] as const;
export const shippingZones = ["ZONE_A", "ZONE_B", "ZONE_C", "ZONE_D", "ZONE_E"] as const;
export const ndrStatuses = ["OPEN", "ACTION_REQUESTED", "REATTEMPT_SCHEDULED", "RTO_REQUESTED", "RESOLVED", "CLOSED"] as const;
export const rtoStatuses = ["INITIATED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "DISPUTED"] as const;
export const returnStatuses = ["REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "PICKED_UP", "IN_TRANSIT", "RECEIVED", "REJECTED", "REFUNDED"] as const;
export const settlementStatuses = ["PENDING", "PROCESSING", "REMITTED", "FAILED", "ON_HOLD"] as const;
export const documentKinds = ["LABEL", "MANIFEST", "TAX_INVOICE", "EWAY_BILL", "POD", "CMR", "OTHER"] as const;

export type OrderStatusType = (typeof orderStatuses)[number];
export type OrderStatus = OrderStatusType;
export type EcommerceShipmentStatusType = (typeof ecommerceShipmentStatuses)[number];
export type EcommerceShipmentStatus = EcommerceShipmentStatusType;
export type PaymentModeType = (typeof paymentModes)[number];
export type PaymentMode = PaymentModeType;
export type ShippingZoneType = (typeof shippingZones)[number];
export type ShippingZone = ShippingZoneType;
export type NdrStatusType = (typeof ndrStatuses)[number];
export type NdrStatus = NdrStatusType;
export type RtoStatusType = (typeof rtoStatuses)[number];
export type RtoStatus = RtoStatusType;
export type ReturnStatusType = (typeof returnStatuses)[number];
export type ReturnStatus = ReturnStatusType;
export type SettlementStatusType = (typeof settlementStatuses)[number];
export type SettlementStatus = SettlementStatusType;
export type DocumentKindType = (typeof documentKinds)[number];
export type DocumentKind = DocumentKindType;

export interface SellerAccount {
  id: string;
  userId: string;
  companyName: string;
  brandName: string;
  gstin?: string | null;
  pan?: string | null;
  billingAddress: string;
  city: string;
  state: string;
  pincode: string;
  email: string;
  phone: string;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  userId: string;
  warehouseName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  gstin?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  fullName: string;
  email?: string | null;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productName: string;
  sku?: string | null;
  hsnCode?: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  weightGrams: number;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  channelOrderId?: string | null;
  channelName: string;
  customerId: string;
  customer?: Customer;
  warehouseId: string;
  warehouse?: Warehouse;
  paymentMode: PaymentModeType;
  orderAmount: number;
  codAmount: number;
  orderStatus: OrderStatusType;
  totalWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  ewayBillNumber?: string | null;
  notes?: string | null;
  items?: OrderItem[];
  shipment?: EcommerceShipment;
  createdAt: string;
  updatedAt: string;
}

export interface CourierProvider {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  supportsCod: boolean;
  supportsPrepaid: boolean;
  supportsReversePickup: boolean;
  trackingUrlTemplate?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourierRate {
  id: string;
  courierProviderId: string;
  zone: ShippingZoneType;
  minWeightKg: number;
  additionalWeightSlabKg: number;
  forwardBaseRate: number;
  forwardAdditionalRate: number;
  codFixedCharge: number;
  codPercentage: number;
  rtoRate: number;
  reverseRate: number;
  isActive: boolean;
}

export interface EcommerceShipment {
  id: string;
  userId: string;
  orderId: string;
  order?: Order;
  warehouseId: string;
  warehouse?: Warehouse;
  courierProviderId: string;
  courierProvider?: CourierProvider;
  courierAccountId?: string | null;
  awbNumber: string;
  trackingNumber?: string | null;
  shipmentStatus: EcommerceShipmentStatusType;
  pickupPincode: string;
  deliveryPincode: string;
  paymentMode: PaymentModeType;
  codAmount: number;
  declaredValue: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  shippingCharge: number;
  courierCharge: number;
  sellerMargin: number;
  pickupScheduledDate?: string | null;
  estimatedDeliveryDate?: string | null;
  actualDeliveryDate?: string | null;
  labelUrl?: string | null;
  manifestUrl?: string | null;
  routingCode?: string | null;
  trackingUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  userId: string;
  status: EcommerceShipmentStatusType;
  activity: string;
  location?: string | null;
  scanDatetime: string;
  courierStatusCode?: string | null;
  rawPayload?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NdrCase {
  id: string;
  shipmentId: string;
  userId: string;
  attemptNumber: number;
  reasonCode: string;
  reasonDescription: string;
  ndrStatus: NdrStatusType;
  customerAction?: string | null;
  reattemptDate?: string | null;
  remark?: string | null;
  escalatedAt?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RtoShipment {
  id: string;
  originalShipmentId: string;
  userId: string;
  rtoAwbNumber?: string | null;
  reason: string;
  rtoStatus: RtoStatusType;
  initiatedAt: string;
  deliveredAt?: string | null;
  rtoShippingCharge: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnShipment {
  id: string;
  originalOrderId: string;
  userId: string;
  customerId: string;
  warehouseId: string;
  courierProviderId: string;
  returnAwbNumber?: string | null;
  returnReason: string;
  returnStatus: ReturnStatusType;
  qualityCheckStatus?: string | null;
  refundAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CodSettlement {
  id: string;
  userId: string;
  settlementReference: string;
  totalCodCollected: number;
  courierDeductions: number;
  netSettlementAmount: number;
  settlementStatus: SettlementStatusType;
  remittedAt?: string | null;
  bankUtr?: string | null;
  invoiceUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  transactionType: "CREDIT" | "DEBIT";
  category:
    | "WALLET_RECHARGE"
    | "SHIPPING_CHARGE"
    | "SHIPPING_DEDUCTION"
    | "COD_FEE"
    | "RTO_CHARGE"
    | "NDR_CHARGE"
    | "FULL_REFUND"
    | "PARTIAL_REFUND"
    | "CANCELLATION_REFUND"
    | "COD_SETTLEMENT"
    | "COD_REMITTANCE"
    | "MANUAL_CREDIT"
    | "MANUAL_DEBIT"
    | "ADJUSTMENT"
    | "REVERSAL"
    | "REFUND"
    | "WEIGHT_DISCREPANCY"
    | "PENALTY"
    | "FREE_CREDIT_GRANTED"
    | "FREE_CREDIT_USED"
    | "PROMO_CREDIT_GRANTED"
    | "WELCOME_BONUS"
    | "PAYOUT"
    | "ADMIN_ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  referenceId?: string | null;
  description: string;
  awbNumber?: string | null;
  orderNumber?: string | null;
  breakdown?: {
    baseFreight?: number;
    additionalWeight?: number;
    codFee?: number;
    otherCharges?: number;
    gst?: number;
  };
  paymentGatewayReference?: string | null;
  createdAt: string;
}
