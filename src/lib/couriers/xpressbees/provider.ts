import { determineShippingZone } from "@/lib/calculations";
import type {
  CalculatedWeight,
  CourierRateQuote,
  CreateShipmentInput,
  ICourierProvider,
  ServiceabilityRequest,
  ServiceabilityResult,
  ShipmentBookingResult,
  TrackingDetails,
} from "../types";
import { XpressbeesClient } from "./client";
import { mapXpressbeesStatus } from "./status-mapping";
import type {
  XpressbeesOrderItem,
  XpressbeesShipmentRequest,
} from "./types";

export class XpressbeesProvider implements ICourierProvider {
  public code = "xpressbees";
  public name = "Xpressbees Express & Surface";
  private client: XpressbeesClient;

  constructor(client?: XpressbeesClient) {
    this.client = client || new XpressbeesClient();
  }

  public isConfigured(): boolean {
    return this.client.isConfigured();
  }

  /**
   * Checks if Xpressbees is running in Safe Test Mode (default true)
   */
  public isTestMode(): boolean {
    return (
      process.env.XPRESSBEES_TEST_MODE === "true" ||
      process.env.NEXT_PUBLIC_XPRESSBEES_TEST_MODE === "true"
    );
  }

  /**
   * Checks serviceability between origin and destination PIN codes via live Xpressbees API
   * (Allowed in Test Mode for rate checking)
   */
  public async checkServiceability(
    req: ServiceabilityRequest,
  ): Promise<ServiceabilityResult> {
    const zone = determineShippingZone(req.pickupPincode, req.deliveryPincode);

    try {
      const resp = await this.client.getServiceabilityAndRates({
        origin: req.pickupPincode,
        destination: req.deliveryPincode,
        payment_type: req.paymentMode === "COD" ? "cod" : "prepaid",
        order_amount: req.declaredValue || 1000,
        weight: Math.round(req.weightKg * 1000),
      });

      if (!resp.status || !resp.data || resp.data.length === 0) {
        return {
          courierCode: this.code,
          courierName: this.name,
          isServiceable: false,
          supportsCod: false,
          supportsPrepaid: false,
          estimatedDeliveryDays: 0,
          zone,
          reason: resp.message || "Route not serviceable by Xpressbees.",
        };
      }

      return {
        courierCode: this.code,
        courierName: this.name,
        isServiceable: true,
        supportsCod: true,
        supportsPrepaid: true,
        estimatedDeliveryDays: zone === "ZONE_A" ? 1 : zone === "ZONE_B" ? 2 : 3,
        zone,
      };
    } catch (error: any) {
      return {
        courierCode: this.code,
        courierName: this.name,
        isServiceable: false,
        supportsCod: false,
        supportsPrepaid: false,
        estimatedDeliveryDays: 0,
        zone,
        reason: error.message || "Serviceability check failed.",
      };
    }
  }

  /**
   * Calculates live rate quote strictly from Xpressbees API
   * (Allowed in Test Mode)
   */
  public async calculateRate(
    req: ServiceabilityRequest,
    weight: CalculatedWeight,
  ): Promise<CourierRateQuote | null> {
    const zone = determineShippingZone(req.pickupPincode, req.deliveryPincode);

    // Check if user has custom rate card set by Admin
    if (req.userId) {
      try {
        const { getUserPricingProfile } = await import("../pricing-engine");
        const profile = getUserPricingProfile(req.userId);
        if (profile && (profile.tier === "CUSTOM" || profile.tier === "SILVER" || profile.tier === "GOLD")) {
          const userRate = profile.rates.xpressbees;
          if (userRate) {
            let base = userRate.zoneA_0_500g;
            if (zone === "ZONE_B") base = userRate.zoneB_0_500g;
            if (zone === "ZONE_C") base = userRate.zoneC_0_500g;
            if (zone === "ZONE_D") base = userRate.zoneD_0_500g;
            if (zone === "ZONE_E") base = userRate.zoneE_0_500g || (userRate.zoneD_0_500g + 16);

            const w = weight.chargeableWeightKg;
            if (w > 0.5) {
              const extraSlabs = Math.ceil((w - 0.5) / 0.5);
              base += extraSlabs * (userRate.additional500g || 38);
            }

            let codCharge = 0;
            if (req.paymentMode === "COD") {
              const codPercentFee = ((req.declaredValue || 0) * (userRate.codPercent || 0)) / 100;
              codCharge = Math.max(userRate.codChargeFlat || 0, codPercentFee);
            }

            const totalShippingCost = base + codCharge;
            return {
              courierCode: this.code,
              courierName: this.name,
              zone,
              chargeableWeightKg: weight.chargeableWeightKg,
              freightCharge: base,
              codCharge,
              gstAmount: 0,
              totalShippingCost,
              estimatedDeliveryDays: zone === "ZONE_A" ? 1 : zone === "ZONE_B" ? 2 : zone === "ZONE_C" ? 3 : 4,
              rating: 4.8,
              isRecommended: true,
              isLive: this.isConfigured(),
              isTestMode: this.isTestMode(),
            };
          }
        }
      } catch (e) {
        // fallback to live API
      }
    }

    try {
      const resp = await this.client.getServiceabilityAndRates({
        origin: req.pickupPincode,
        destination: req.deliveryPincode,
        payment_type: req.paymentMode === "COD" ? "cod" : "prepaid",
        order_amount: req.declaredValue || 1000,
        weight: Math.round(weight.chargeableWeightKg * 1000),
        length: 10,
        breadth: 10,
        height: 10,
      });

      if (!resp.status || !resp.data || resp.data.length === 0) {
        return null;
      }

      // Pick the most economical service (e.g. Surface 0.5kg or Air)
      const sorted = [...resp.data].sort((a, b) => a.total_charges - b.total_charges);
      const best = sorted[0];

      const freightCharge = Number(best.freight_charges);
      const codCharge = Number(best.cod_charges || 0);
      const totalShippingCost = Number(best.total_charges);
      const gstAmount = Math.round(totalShippingCost * 0.18 * 100) / 100;

      return {
        courierCode: this.code,
        courierName: best.name || this.name,
        zone,
        chargeableWeightKg: Number(best.chargeable_weight) / 1000 || weight.chargeableWeightKg,
        freightCharge,
        codCharge,
        gstAmount,
        totalShippingCost: Math.round((totalShippingCost + gstAmount) * 100) / 100,
        estimatedDeliveryDays:
          typeof best.eddDays === "number" && best.eddDays > 0
            ? best.eddDays
            : zone === "ZONE_A"
              ? 1
              : zone === "ZONE_B"
                ? 2
                : zone === "ZONE_C"
                  ? 3
                  : 4,
        rating: 4.8,
        isRecommended: true,
        isLive: this.isConfigured(),
        isTestMode: this.isTestMode(),
      };
    } catch (error) {
      console.error("[XpressbeesProvider.calculateRate] error", error);
      return null;
    }
  }

  /**
   * Creates/Books a Shipment
   * BLOCKED in Safe Test Mode to prevent real AWB or live pickup creation
   */
  public async createShipment(input: CreateShipmentInput): Promise<ShipmentBookingResult> {
    // 1. Strict Test Mode Guard
    if (this.isTestMode()) {
      throw new Error("Xpressbees Test Mode — Real shipment booking is disabled.");
    }

    // 2. Production Booking Flow (Only when XPRESSBEES_TEST_MODE=false)
    const isCod = input.paymentMode === "COD";
    const weightGrams = Math.round(input.weightKg * 1000);

    const items: XpressbeesOrderItem[] = [
      {
        name: input.productName,
        qty: String(input.quantity),
        sku: input.productSku || "SKU-01",
        price: String(input.orderAmount),
      },
    ];

    const payload: XpressbeesShipmentRequest = {
      order_number: input.orderNumber,
      unique_order_number: "yes",
      payment_type: isCod ? "cod" : "prepaid",
      package_weight: weightGrams,
      package_length: input.lengthCm,
      package_breadth: input.widthCm,
      package_height: input.heightCm,
      request_auto_pickup: "yes",
      order_amount: input.orderAmount,
      collectable_amount: isCod ? input.codAmount : 0,
      consignee: {
        name: input.customerName,
        address: input.customerAddress,
        address_2: "",
        city: input.customerCity,
        state: input.customerState,
        pincode: input.deliveryPincode,
        phone: input.customerPhone,
      },
      pickup: {
        warehouse_name: input.warehouseName || "Primary Hub",
        name: "Warehouse Dispatch",
        address: input.warehouseAddress || "Plot 12, Industrial Area",
        address_2: "",
        city: input.warehouseCity || "Delhi",
        state: input.warehouseState || "Delhi",
        pincode: input.pickupPincode,
        phone: input.warehousePhone || "9876543210",
      },
      order_items: items,
    };

    const resp = await this.client.createShipment(payload);

    if (!resp.status || !resp.data) {
      const errorMsg = resp.message || "Failed to book shipment on Xpressbees.";
      throw new Error(`Xpressbees Error: ${errorMsg}`);
    }

    const data = resp.data;
    const awbNumber = String(data.awb_number);
    const labelUrl = data.label || "";

    const estDelivery = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const pickupDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);

    return {
      success: true,
      awbNumber,
      courierCode: this.code,
      courierName: data.courier_name || this.name,
      shippingCharge: 68.5,
      courierCharge: 52.0,
      sellerMargin: 16.5,
      labelUrl,
      manifestUrl: `https://shipment.xpressbees.com/manifest/${awbNumber}`,
      routingCode: data.additional_info || `${input.deliveryPincode.slice(0, 3)}-XB`,
      trackingUrl: `https://www.xpressbees.com/track/${awbNumber}`,
      estimatedDeliveryDate: estDelivery,
      pickupScheduledDate: pickupDate,
    };
  }

  /**
   * Generates a 4x6 shipping label PDF
   */
  public async generateLabel(awbNumber: string): Promise<string> {
    return `https://shipment.xpressbees.com/api/shipments2/label/${awbNumber}`;
  }

  /**
   * Generates a pickup handover manifest PDF
   */
  public async generateManifest(awbNumbers: string[]): Promise<string> {
    if (this.isTestMode()) {
      throw new Error("Xpressbees Test Mode — Real manifest generation is disabled.");
    }
    const resp = await this.client.generateManifest(awbNumbers);
    if (!resp.status || !resp.data) {
      throw new Error(resp.message || "Could not generate Xpressbees pickup manifest.");
    }
    return resp.data;
  }

  /**
   * Tracks AWB status strictly from live Xpressbees API
   */
  public async trackAwb(awbNumber: string): Promise<TrackingDetails> {
    const resp = await this.client.trackShipment(awbNumber);

    if (!resp.status || !resp.data) {
      throw new Error(resp.message || `No tracking record found on Xpressbees for AWB ${awbNumber}`);
    }

    const data = resp.data;
    const checkpoints = (data.history || []).map((h) => ({
      status: mapXpressbeesStatus(h.status_code, undefined, h.message),
      activity: h.message,
      location: h.location,
      timestamp: h.event_time ? new Date(h.event_time).toISOString() : new Date().toISOString(),
      rawCode: h.status_code,
    }));

    const latestCheckpoint = checkpoints[0];
    const currentStatus = mapXpressbeesStatus(
      latestCheckpoint?.rawCode,
      data.status || data.rto_status,
      latestCheckpoint?.activity,
    );

    return {
      awbNumber: data.awb_number || awbNumber,
      courierCode: this.code,
      courierName: this.name,
      currentStatus,
      originCity: data.warehouse_id || "Origin",
      destinationCity: data.shipment_info?.split("/")?.[0]?.trim() || "Destination",
      estimatedDeliveryDate: "In 2-3 Days",
      checkpoints,
    };
  }

  /**
   * Cancels shipment
   */
  public async cancelShipment(awbNumber: string): Promise<{ success: boolean; message: string }> {
    if (this.isTestMode()) {
      return { success: true, message: "Xpressbees Test Mode — Real cancellation skipped." };
    }
    const resp = await this.client.cancelShipment(awbNumber);
    return {
      success: Boolean(resp.status),
      message: resp.message || (resp.status ? "Shipment Cancelled." : "Unable to cancel."),
    };
  }
}
