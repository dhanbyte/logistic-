export interface Dimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface WeightDetails {
  deadWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface CalculatedWeight {
  deadWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
}

export interface ServiceabilityRequest {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  paymentMode: "PREPAID" | "COD";
  declaredValue?: number;
}

export interface ServiceabilityResult {
  courierCode: string;
  courierName: string;
  isServiceable: boolean;
  supportsCod: boolean;
  supportsPrepaid: boolean;
  estimatedDeliveryDays: number;
  zone: "ZONE_A" | "ZONE_B" | "ZONE_C" | "ZONE_D" | "ZONE_E";
  reason?: string;
}

export interface CourierRateQuote {
  courierCode: string;
  courierName: string;
  zone: "ZONE_A" | "ZONE_B" | "ZONE_C" | "ZONE_D" | "ZONE_E";
  chargeableWeightKg: number;
  freightCharge: number;
  codCharge: number;
  gstAmount: number;
  totalShippingCost: number;
  estimatedDeliveryDays: number;
  rating: number;
  isRecommended?: boolean;
}

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  warehouseId: string;
  courierCode: string;
  pickupPincode: string;
  deliveryPincode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  productName: string;
  productSku?: string;
  quantity: number;
  paymentMode: "PREPAID" | "COD";
  orderAmount: number;
  codAmount: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  warehouseName?: string;
  warehouseAddress?: string;
  warehouseCity?: string;
  warehouseState?: string;
  warehousePhone?: string;
}

export interface ShipmentBookingResult {
  success: boolean;
  awbNumber: string;
  courierCode: string;
  courierName: string;
  shippingCharge: number;
  courierCharge: number;
  sellerMargin: number;
  labelUrl: string;
  manifestUrl: string;
  routingCode: string;
  trackingUrl: string;
  estimatedDeliveryDate: string;
  pickupScheduledDate: string;
}

export interface TrackingScanCheckpoint {
  status: string;
  activity: string;
  location: string;
  timestamp: string;
  rawCode?: string;
}

export interface TrackingDetails {
  awbNumber: string;
  courierCode: string;
  courierName: string;
  currentStatus: string;
  originCity: string;
  destinationCity: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string | null;
  checkpoints: TrackingScanCheckpoint[];
}

export interface ICourierProvider {
  code: string;
  name: string;
  checkServiceability(req: ServiceabilityRequest): Promise<ServiceabilityResult>;
  calculateRate(
    req: ServiceabilityRequest,
    weight: CalculatedWeight,
  ): Promise<CourierRateQuote | null>;
  createShipment(input: CreateShipmentInput): Promise<ShipmentBookingResult>;
  generateLabel(awbNumber: string): Promise<string>;
  generateManifest(awbNumbers: string[]): Promise<string>;
  trackAwb(awbNumber: string): Promise<TrackingDetails>;
  cancelShipment(awbNumber: string): Promise<{ success: boolean; message: string }>;
}
