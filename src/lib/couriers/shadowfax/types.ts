/**
 * Shadowfax API Types & Interfaces
 * Compatible with Shadowfax Logistics & Reverse Pickup / Forward APIs
 */

export interface ShadowfaxServiceabilityItem {
  code: number | string;
  services: string[]; // e.g. ["Regular", "Surface", "customer_pickup", "customer_delivery"]
}

export interface ShadowfaxAwbGenerateResponse {
  message: string;
  awb_numbers: string[];
}

export interface ShadowfaxSkuAttribute {
  name: string;
  client_sku_id?: string;
  price: number;
  brand?: string;
  category?: string;
  return_reason?: string;
  qc_required?: string; // "true" | "false"
  qc_rules?: Array<{
    question: string;
    is_mandatory: number;
    value?: string;
  }>;
  seller_details?: {
    regd_name: string;
    regd_address: string;
    state: string;
    gstin: string;
  };
  taxes?: {
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
    total_tax_amount: number;
  };
  hsn_code?: string;
  invoice_id?: string;
}

export interface ShadowfaxOrderCreateRequest {
  client_order_number: string;
  warehouse_name?: string;
  warehouse_address: string;
  destination_pincode: number | string;
  unique_code?: string;
  total_amount?: number;
  price: number;
  eway_bill?: number;
  pickup_type: "regular" | "slot" | "surface";
  address_attributes: {
    address_line: string;
    city: string;
    country?: string;
    pincode: number | string;
    name: string;
    phone_number: string;
    alternate_contact?: string;
    sms_contact?: string;
    latitude?: string;
    longitude?: string;
    location_accuracy?: "H" | "M" | "L";
    location_type?: "residential" | "commercial";
  };
  weight_details?: {
    actual_weight: number;
    volumetric_weight: number;
  };
  skus_attributes: ShadowfaxSkuAttribute[];
}

export interface ShadowfaxOrderCreateResponse {
  message: string;
  client_order_number: string;
  request_type: string;
  client_request_id: string;
  client_id: number;
  destination_pincode: number;
  status: string;
  scheduled_date?: number;
  date_created?: number;
}

export interface ShadowfaxLabelResponse {
  message: string;
  data: {
    label_url: string;
  };
}

export interface ShadowfaxTrackingHistoryItem {
  created_at: string;
  current_location: string;
  state: string;
  comment: string;
}

export interface ShadowfaxTrackingResponse {
  client_order_number: string;
  client_request_id: string;
  status: string;
  status_last_updated_at: string;
  pickup_request_state_histories?: ShadowfaxTrackingHistoryItem[];
  address?: {
    city?: string;
  };
}

export interface ShadowfaxWebhookPayload {
  awb_number: string;
  order_id: string;
  event_timestamp: string;
  current_location: string;
  comments: string;
  event: string;
  status: string;
  otp_verifed?: string;
  rider_name?: string | null;
  rider_contact?: string | null;
  client_id?: number;
  recipient_info?: any[];
  qc_images?: string[];
  type?: string;
}

export interface ShadowfaxForwardOrderRequest {
  order_details: {
    client_order_id: string;
    actual_weight: number;
    volumetric_weight: number;
    product_value: number;
    payment_mode: "Prepaid" | "COD";
    total_amount: number;
    package_count?: number;
    cod_amount?: number;
  };
  customer_details: {
    name: string;
    contact: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    pincode: number | string;
  };
  pickup_details: {
    name: string;
    contact: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    pincode: number | string;
  };
  return_details?: {
    name: string;
    contact: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    pincode: number | string;
  };
  product_details?: Array<{
    sku_name: string;
    sku_id: string;
    price: number;
    quantity: number;
    category?: string;
    hsn_code?: string;
  }>;
}

export interface ShadowfaxForwardOrderResponse {
  message: string;
  errors: any;
  data?: {
    client_order_id: string;
    awb_number: string;
    package_details?: Array<{
      awb_number: string;
    }>;
  };
}

