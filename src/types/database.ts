export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CurrencyCode = "PLN" | "EUR" | "USD";
export type IndianCurrencyCode = "INR";

// Legacy freight status retained for compatibility
export type LegacyShipmentStatus = "New" | "Accepted" | "In Transit" | "Delivered" | "Cancelled" | "Issue";

// Indian E-Commerce Enums
export type OrderStatus =
  | "DRAFT"
  | "PENDING_PICKUP"
  | "READY_TO_SHIP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "NDR"
  | "RTO_INITIATED"
  | "RTO_DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED";

export type EcommerceShipmentStatus =
  | "MANIFESTED"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "UNDELIVERED_ATTEMPT"
  | "NDR"
  | "RTO_INITIATED"
  | "RTO_IN_TRANSIT"
  | "RTO_DELIVERED"
  | "CANCELLED"
  | "LOST"
  | "DAMAGED";

export type PaymentMode = "PREPAID" | "COD";
export type NdrStatus = "OPEN" | "ACTION_REQUESTED" | "REATTEMPT_SCHEDULED" | "RTO_REQUESTED" | "RESOLVED" | "CLOSED";
export type RtoStatus = "INITIATED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "DISPUTED";
export type ReturnStatus = "REQUESTED" | "APPROVED" | "PICKUP_SCHEDULED" | "PICKED_UP" | "IN_TRANSIT" | "RECEIVED" | "REJECTED" | "REFUNDED";
export type SettlementStatus = "PENDING" | "PROCESSING" | "REMITTED" | "FAILED" | "ON_HOLD";
export type ShippingZone = "ZONE_A" | "ZONE_B" | "ZONE_C" | "ZONE_D" | "ZONE_E";
export type WalletTxnType = "CREDIT" | "DEBIT";
export type WalletTxnCategory = "WALLET_RECHARGE" | "SHIPPING_DEDUCTION" | "WEIGHT_DISCREPANCY" | "COD_REMITTANCE" | "REFUND" | "PENALTY";
export type DocumentKind = "LABEL" | "MANIFEST" | "TAX_INVOICE" | "EWAY_BILL" | "POD" | "CMR" | "OTHER";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          reporting_currency: CurrencyCode;
          phone?: string;
          company_name?: string;
          gstin?: string;
          pan?: string;
          kyc_status?: string;
          wallet_balance?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          reporting_currency?: CurrencyCode;
          phone?: string;
          company_name?: string;
          gstin?: string;
          pan?: string;
          kyc_status?: string;
          wallet_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      seller_accounts: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          brand_name: string;
          gstin: string | null;
          pan: string | null;
          billing_address: string;
          city: string;
          state: string;
          pincode: string;
          email: string;
          phone: string;
          kyc_status: "PENDING" | "VERIFIED" | "REJECTED";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          brand_name: string;
          gstin?: string | null;
          pan?: string | null;
          billing_address: string;
          city: string;
          state: string;
          pincode: string;
          email: string;
          phone: string;
          kyc_status?: "PENDING" | "VERIFIED" | "REJECTED";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["seller_accounts"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "seller_accounts_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      warehouses: {
        Row: {
          id: string;
          user_id: string;
          warehouse_name: string;
          contact_person: string;
          contact_phone: string;
          contact_email: string | null;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          pincode: string;
          gstin: string | null;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          warehouse_name: string;
          contact_person: string;
          contact_phone: string;
          contact_email?: string | null;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state: string;
          pincode: string;
          gstin?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["warehouses"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "warehouses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string | null;
          phone: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          pincode: string;
          country: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email?: string | null;
          phone: string;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state: string;
          pincode: string;
          country?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "customers_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      courier_providers: {
        Row: {
          id: string;
          code: string;
          name: string;
          is_active: boolean;
          supports_cod: boolean;
          supports_prepaid: boolean;
          supports_reverse_pickup: boolean;
          config_schema: Json;
          tracking_url_template: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          is_active?: boolean;
          supports_cod?: boolean;
          supports_prepaid?: boolean;
          supports_reverse_pickup?: boolean;
          config_schema?: Json;
          tracking_url_template?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courier_providers"]["Insert"]>;
        Relationships: [];
      };
      courier_accounts: {
        Row: {
          id: string;
          user_id: string | null;
          courier_provider_id: string;
          account_name: string;
          is_aggregated: boolean;
          is_active: boolean;
          credentials_placeholder: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          courier_provider_id: string;
          account_name: string;
          is_aggregated?: boolean;
          is_active?: boolean;
          credentials_placeholder?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courier_accounts"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "courier_accounts_courier_provider_id_fkey"; columns: ["courier_provider_id"]; isOneToOne: false; referencedRelation: "courier_providers"; referencedColumns: ["id"] }
        ];
      };
      courier_rates: {
        Row: {
          id: string;
          courier_provider_id: string;
          zone: ShippingZone;
          min_weight_kg: number;
          additional_weight_slab_kg: number;
          forward_base_rate: number;
          forward_additional_rate: number;
          cod_fixed_charge: number;
          cod_percentage: number;
          rto_rate: number;
          reverse_rate: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          courier_provider_id: string;
          zone: ShippingZone;
          min_weight_kg?: number;
          additional_weight_slab_kg?: number;
          forward_base_rate: number;
          forward_additional_rate: number;
          cod_fixed_charge?: number;
          cod_percentage?: number;
          rto_rate: number;
          reverse_rate: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courier_rates"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "courier_rates_courier_provider_id_fkey"; columns: ["courier_provider_id"]; isOneToOne: false; referencedRelation: "courier_providers"; referencedColumns: ["id"] }
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          channel_order_id: string | null;
          channel_name: string;
          customer_id: string;
          warehouse_id: string;
          payment_mode: PaymentMode;
          order_amount: number;
          cod_amount: number;
          order_status: OrderStatus;
          total_weight_kg: number;
          length_cm: number;
          width_cm: number;
          height_cm: number;
          volumetric_weight_kg: number;
          chargeable_weight_kg: number;
          invoice_number: string | null;
          invoice_date: string | null;
          eway_bill_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          channel_order_id?: string | null;
          channel_name?: string;
          customer_id: string;
          warehouse_id: string;
          payment_mode?: PaymentMode;
          order_amount: number;
          cod_amount?: number;
          order_status?: OrderStatus;
          total_weight_kg?: number;
          length_cm?: number;
          width_cm?: number;
          height_cm?: number;
          chargeable_weight_kg?: number;
          invoice_number?: string | null;
          invoice_date?: string | null;
          eway_bill_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "orders_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] },
          { foreignKeyName: "orders_warehouse_id_fkey"; columns: ["warehouse_id"]; isOneToOne: false; referencedRelation: "warehouses"; referencedColumns: ["id"] }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_name: string;
          sku: string | null;
          hsn_code: string | null;
          quantity: number;
          unit_price: number;
          tax_rate: number;
          tax_amount: number;
          total_amount: number;
          weight_grams: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_name: string;
          sku?: string | null;
          hsn_code?: string | null;
          quantity: number;
          unit_price: number;
          tax_rate?: number;
          tax_amount?: number;
          total_amount: number;
          weight_grams?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "order_items_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] }
        ];
      };
      ecommerce_shipments: {
        Row: {
          id: string;
          user_id: string;
          order_id: string;
          warehouse_id: string;
          courier_provider_id: string;
          courier_account_id: string | null;
          awb_number: string;
          tracking_number: string | null;
          shipment_status: EcommerceShipmentStatus;
          pickup_pincode: string;
          delivery_pincode: string;
          payment_mode: PaymentMode;
          cod_amount: number;
          declared_value: number;
          weight_kg: number;
          length_cm: number;
          width_cm: number;
          height_cm: number;
          volumetric_weight_kg: number;
          chargeable_weight_kg: number;
          shipping_charge: number;
          courier_charge: number;
          seller_margin: number;
          pickup_scheduled_date: string | null;
          estimated_delivery_date: string | null;
          actual_delivery_date: string | null;
          label_url: string | null;
          manifest_url: string | null;
          routing_code: string | null;
          tracking_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id: string;
          warehouse_id: string;
          courier_provider_id: string;
          courier_account_id?: string | null;
          awb_number: string;
          tracking_number?: string | null;
          shipment_status?: EcommerceShipmentStatus;
          pickup_pincode: string;
          delivery_pincode: string;
          payment_mode?: PaymentMode;
          cod_amount?: number;
          declared_value: number;
          weight_kg: number;
          length_cm: number;
          width_cm: number;
          height_cm: number;
          chargeable_weight_kg: number;
          shipping_charge: number;
          courier_charge: number;
          pickup_scheduled_date?: string | null;
          estimated_delivery_date?: string | null;
          actual_delivery_date?: string | null;
          label_url?: string | null;
          manifest_url?: string | null;
          routing_code?: string | null;
          tracking_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ecommerce_shipments"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "ecommerce_shipments_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "ecommerce_shipments_courier_provider_id_fkey"; columns: ["courier_provider_id"]; isOneToOne: false; referencedRelation: "courier_providers"; referencedColumns: ["id"] }
        ];
      };
      tracking_events: {
        Row: {
          id: string;
          shipment_id: string;
          user_id: string;
          status: EcommerceShipmentStatus;
          activity: string;
          location: string | null;
          scan_datetime: string;
          courier_status_code: string | null;
          raw_payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          user_id: string;
          status: EcommerceShipmentStatus;
          activity: string;
          location?: string | null;
          scan_datetime?: string;
          courier_status_code?: string | null;
          raw_payload?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_events"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "tracking_events_shipment_id_fkey"; columns: ["shipment_id"]; isOneToOne: false; referencedRelation: "ecommerce_shipments"; referencedColumns: ["id"] }
        ];
      };
      ndr_cases: {
        Row: {
          id: string;
          shipment_id: string;
          user_id: string;
          attempt_number: number;
          reason_code: string;
          reason_description: string;
          ndr_status: NdrStatus;
          customer_action: string | null;
          reattempt_date: string | null;
          remark: string | null;
          escalated_at: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          user_id: string;
          attempt_number?: number;
          reason_code: string;
          reason_description: string;
          ndr_status?: NdrStatus;
          customer_action?: string | null;
          reattempt_date?: string | null;
          remark?: string | null;
          escalated_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ndr_cases"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "ndr_cases_shipment_id_fkey"; columns: ["shipment_id"]; isOneToOne: false; referencedRelation: "ecommerce_shipments"; referencedColumns: ["id"] }
        ];
      };
      rto_shipments: {
        Row: {
          id: string;
          original_shipment_id: string;
          user_id: string;
          rto_awb_number: string | null;
          reason: string;
          rto_status: RtoStatus;
          initiated_at: string;
          delivered_at: string | null;
          rto_shipping_charge: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          original_shipment_id: string;
          user_id: string;
          rto_awb_number?: string | null;
          reason: string;
          rto_status?: RtoStatus;
          initiated_at?: string;
          delivered_at?: string | null;
          rto_shipping_charge?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rto_shipments"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "rto_shipments_original_shipment_id_fkey"; columns: ["original_shipment_id"]; isOneToOne: false; referencedRelation: "ecommerce_shipments"; referencedColumns: ["id"] }
        ];
      };
      return_shipments: {
        Row: {
          id: string;
          original_order_id: string;
          user_id: string;
          customer_id: string;
          warehouse_id: string;
          courier_provider_id: string;
          return_awb_number: string | null;
          return_reason: string;
          return_status: ReturnStatus;
          quality_check_status: string | null;
          refund_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          original_order_id: string;
          user_id: string;
          customer_id: string;
          warehouse_id: string;
          courier_provider_id: string;
          return_awb_number?: string | null;
          return_reason: string;
          return_status?: ReturnStatus;
          quality_check_status?: string | null;
          refund_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["return_shipments"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "return_shipments_original_order_id_fkey"; columns: ["original_order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] }
        ];
      };
      cod_settlements: {
        Row: {
          id: string;
          user_id: string;
          settlement_reference: string;
          total_cod_collected: number;
          courier_deductions: number;
          net_settlement_amount: number;
          settlement_status: SettlementStatus;
          remitted_at: string | null;
          bank_utr: string | null;
          invoice_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          settlement_reference: string;
          total_cod_collected: number;
          courier_deductions?: number;
          net_settlement_amount: number;
          settlement_status?: SettlementStatus;
          remitted_at?: string | null;
          bank_utr?: string | null;
          invoice_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cod_settlements"]["Insert"]>;
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: WalletTxnType;
          category: WalletTxnCategory;
          amount: number;
          balance_after: number;
          reference_id: string | null;
          description: string;
          payment_gateway_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: WalletTxnType;
          category: WalletTxnCategory;
          amount: number;
          balance_after: number;
          reference_id?: string | null;
          description: string;
          payment_gateway_reference?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_transactions"]["Insert"]>;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          provider: string;
          event_type: string;
          payload: Json;
          processed: boolean;
          error: string | null;
          received_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          provider: string;
          event_type: string;
          payload?: Json;
          processed?: boolean;
          error?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_events"]["Insert"]>;
        Relationships: [];
      };

      // Retained legacy tables for current UI backwards compatibility
      clients: {
        Row: { id: string; user_id: string; company_name: string; tax_id: string; contact_person: string; email: string; phone: string; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; company_name: string; tax_id: string; contact_person: string; email: string; phone: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [{ foreignKeyName: "clients_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      carriers: {
        Row: { id: string; user_id: string; company_name: string; country: string; contact_person: string; email: string; phone: string; vehicle_type: string; rating: number; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; company_name: string; country: string; contact_person: string; email: string; phone: string; vehicle_type: string; rating?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["carriers"]["Insert"]>;
        Relationships: [{ foreignKeyName: "carriers_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      shipments: {
        Row: { id: string; user_id: string; client_id: string; carrier_id: string; reference_number: string; pickup_city: string; delivery_city: string; pickup_date: string; delivery_date: string; client_price: number; carrier_cost: number; additional_costs: number; profit: number; margin_percent: number; currency: CurrencyCode; exchange_rate_to_base: number; status: LegacyShipmentStatus; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; client_id: string; carrier_id: string; reference_number: string; pickup_city: string; delivery_city: string; pickup_date: string; delivery_date: string; client_price: number; carrier_cost: number; additional_costs?: number; currency?: CurrencyCode; exchange_rate_to_base?: number; status?: LegacyShipmentStatus; notes?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["shipments"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "shipments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "shipments_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "shipments_carrier_id_fkey"; columns: ["carrier_id"]; isOneToOne: false; referencedRelation: "carriers"; referencedColumns: ["id"] }
        ];
      };
      shipment_status_events: {
        Row: { id: string; shipment_id: string; user_id: string; changed_by: string | null; from_status: LegacyShipmentStatus | null; to_status: LegacyShipmentStatus; event_kind: "created" | "changed" | "baseline"; changed_at: string };
        Insert: { id?: string; shipment_id: string; user_id: string; changed_by?: string | null; from_status?: LegacyShipmentStatus | null; to_status: LegacyShipmentStatus; event_kind: "created" | "changed" | "baseline"; changed_at?: string };
        Update: Partial<Database["public"]["Tables"]["shipment_status_events"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "shipment_status_events_owner_fkey"; columns: ["shipment_id", "user_id"]; isOneToOne: false; referencedRelation: "shipments"; referencedColumns: ["id", "user_id"] },
          { foreignKeyName: "shipment_status_events_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "shipment_status_events_changed_by_fkey"; columns: ["changed_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      shipment_documents: {
        Row: { id: string; shipment_id: string; storage_path: string; original_name: string; mime_type: "application/pdf" | "image/jpeg" | "image/png"; size_bytes: number; upload_status: "pending" | "ready"; created_at: string; uploaded_at: string | null };
        Insert: { id?: string; shipment_id: string; storage_path: string; original_name: string; mime_type: "application/pdf" | "image/jpeg" | "image/png"; size_bytes: number; upload_status?: "pending" | "ready"; created_at?: string; uploaded_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["shipment_documents"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "shipment_documents_shipment_id_fkey"; columns: ["shipment_id"]; isOneToOne: false; referencedRelation: "shipments"; referencedColumns: ["id"] }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_sample_workspace: { Args: Record<PropertyKey, never>; Returns: Json };
      delete_shipment_document_metadata: { Args: { document_id: string }; Returns: undefined };
      finalize_shipment_document: { Args: { document_id: string }; Returns: undefined };
    };
    Enums: {
      currency_code: CurrencyCode;
      order_status: OrderStatus;
      ecommerce_shipment_status: EcommerceShipmentStatus;
      payment_mode: PaymentMode;
      ndr_status: NdrStatus;
      rto_status: RtoStatus;
      return_status: ReturnStatus;
      settlement_status: SettlementStatus;
      shipping_zone: ShippingZone;
      wallet_txn_type: WalletTxnType;
      wallet_txn_category: WalletTxnCategory;
      document_kind: DocumentKind;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
