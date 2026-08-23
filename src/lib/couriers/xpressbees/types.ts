/**
 * Xpressbees API Type Definitions
 * Strictly adhering to the official Xpressbees API Documentation PDF
 */

export interface XpressbeesLoginRequest {
  email: string;
  password: string;
}

export interface XpressbeesLoginResponse {
  status: boolean;
  data?: string; // Bearer token
  message?: string;
}

export interface XpressbeesServiceRateItem {
  id: string; // courier id, e.g. "1" (Surface), "3" (Air), "12938" (Same Day)
  name: string; // e.g. "Xpressbees Surface 0.5 Kg", "Xpressbees Air"
  freight_charges: number;
  cod_charges: number;
  total_charges: number;
  min_weight: number; // in grams, e.g. 500
  chargeable_weight: number; // in grams, e.g. 1000
  eddDays?: number;
  edd?: string;
  origin_city?: string;
  origin_state?: string;
  origin_pincode?: string;
  destination_city?: string;
  destination_state?: string;
  destination_pincode?: string;
}

export interface XpressbeesServiceabilityRequest {
  origin: string; // 6-digit PIN
  destination: string; // 6-digit PIN
  payment_type: "cod" | "prepaid";
  order_amount: string | number;
  weight?: string | number; // in grams (default 500)
  length?: string | number; // in cm (default 10)
  breadth?: string | number; // in cm (default 10)
  height?: string | number; // in cm (default 10)
}

export interface XpressbeesServiceabilityResponse {
  status: boolean;
  data?: XpressbeesServiceRateItem[];
  message?: string;
}

export interface XpressbeesConsignee {
  name: string;
  company_name?: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface XpressbeesPickup {
  warehouse_name: string;
  name: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  gst_umber?: string;
}

export interface XpressbeesRto {
  warehouse_name: string;
  name: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface XpressbeesOrderItem {
  name: string;
  qty: string | number;
  sku?: string;
  price?: string | number;
}

export interface XpressbeesShipmentRequest {
  order_number: string;
  unique_order_number?: "yes" | "no";
  payment_type: "cod" | "prepaid" | "reverse";
  package_weight?: number; // in grams
  package_length?: number; // in cm
  package_breadth?: number; // in cm
  package_height?: number; // in cm
  request_auto_pickup?: "yes" | "no";
  shipping_charges?: number;
  cod_charges?: number;
  discount?: number;
  order_amount: number;
  consignee: XpressbeesConsignee;
  pickup: XpressbeesPickup;
  is_rto_different?: "yes" | "no";
  rto?: XpressbeesRto;
  order_items: XpressbeesOrderItem[];
  courier_id?: string;
  collectable_amount: string | number; // 0 for prepaid, <= order_amount for COD
}

export interface XpressbeesShipmentData {
  order_id: number | string;
  shipment_id: number | string;
  awb_number: string;
  courier_id: string;
  courier_name: string;
  status: string; // e.g. "booked"
  additional_info?: string;
  payment_type: string;
  label?: string; // S3 URL to PDF label
}

export interface XpressbeesShipmentResponse {
  status: boolean;
  data?: XpressbeesShipmentData;
  message?: string;
}

export interface XpressbeesTrackingHistoryItem {
  status_code: string; // e.g. "IT", "PU", "OFD", "DL", "RT-IT", "RT-DL"
  location: string;
  event_time: string; // "YYYY-MM-DD HH:mm"
  message: string;
}

export interface XpressbeesTrackingData {
  id: string;
  order_id: string;
  order_number: string;
  created: string;
  awb_number: string;
  rto_awb?: string;
  courier_id: string;
  warehouse_id: string;
  rto_warehouse_id?: string;
  status: string; // e.g. "rto", "delivered", "in_transit"
  rto_status?: string;
  shipment_info?: string;
  history: XpressbeesTrackingHistoryItem[];
}

export interface XpressbeesTrackingResponse {
  status: boolean;
  data?: XpressbeesTrackingData;
  message?: string;
}

export interface XpressbeesCancelRequest {
  awb: string;
}

export interface XpressbeesCancelResponse {
  status: boolean;
  message: string;
}

export interface XpressbeesManifestRequest {
  awbs: string[];
}

export interface XpressbeesManifestResponse {
  status: boolean;
  data?: string; // S3 URL to manifest PDF
  message?: string;
}

export interface NormalizedXpressbeesRate {
  provider: "xpressbees";
  serviceable: boolean;
  service: string;
  courierId: string;
  freightCharges: number;
  codCharges: number;
  totalCharges: number;
  minimumWeight: number; // in grams
  chargeableWeight: number; // in grams
  rawResponse: XpressbeesServiceRateItem;
}
