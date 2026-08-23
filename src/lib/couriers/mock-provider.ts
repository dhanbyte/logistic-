import {
  calculateChargeableWeight,
  calculateShippingQuote,
  determineShippingZone,
} from "@/lib/calculations";
import type {
  CalculatedWeight,
  CourierRateQuote,
  CreateShipmentInput,
  ICourierProvider,
  ServiceabilityRequest,
  ServiceabilityResult,
  ShipmentBookingResult,
  TrackingDetails,
} from "./types";

interface CourierProfile {
  code: string;
  name: string;
  rating: number;
  supportsCod: boolean;
  supportsPrepaid: boolean;
  baseDeliveryDays: { [key in "ZONE_A" | "ZONE_B" | "ZONE_C" | "ZONE_D" | "ZONE_E"]: number };
  rates: {
    [key in "ZONE_A" | "ZONE_B" | "ZONE_C" | "ZONE_D" | "ZONE_E"]: {
      baseRate: number; // For first 0.5kg
      additionalRate: number; // Per additional 0.5kg
    };
  };
  codFixed: number;
  codPercent: number;
  awbPrefix: string;
}

const COURIER_PROFILES: Record<string, CourierProfile> = {
  delhivery: {
    code: "delhivery",
    name: "Delhivery Surface & Express",
    rating: 4.8,
    supportsCod: true,
    supportsPrepaid: true,
    baseDeliveryDays: { ZONE_A: 1, ZONE_B: 2, ZONE_C: 2, ZONE_D: 4, ZONE_E: 6 },
    rates: {
      ZONE_A: { baseRate: 34, additionalRate: 28 },
      ZONE_B: { baseRate: 42, additionalRate: 35 },
      ZONE_C: { baseRate: 52, additionalRate: 44 },
      ZONE_D: { baseRate: 64, additionalRate: 56 },
      ZONE_E: { baseRate: 88, additionalRate: 78 },
    },
    codFixed: 40,
    codPercent: 1.8,
    awbPrefix: "DLV",
  },
  bluedart: {
    code: "bluedart",
    name: "Blue Dart Air Express",
    rating: 4.9,
    supportsCod: true,
    supportsPrepaid: true,
    baseDeliveryDays: { ZONE_A: 1, ZONE_B: 1, ZONE_C: 2, ZONE_D: 3, ZONE_E: 4 },
    rates: {
      ZONE_A: { baseRate: 48, additionalRate: 38 },
      ZONE_B: { baseRate: 58, additionalRate: 48 },
      ZONE_C: { baseRate: 72, additionalRate: 60 },
      ZONE_D: { baseRate: 90, additionalRate: 75 },
      ZONE_E: { baseRate: 120, additionalRate: 98 },
    },
    codFixed: 50,
    codPercent: 2.2,
    awbPrefix: "BD",
  },
  xpressbees: {
    code: "xpressbees",
    name: "Xpressbees B2C",
    rating: 4.5,
    supportsCod: true,
    supportsPrepaid: true,
    baseDeliveryDays: { ZONE_A: 1, ZONE_B: 2, ZONE_C: 3, ZONE_D: 4, ZONE_E: 7 },
    rates: {
      ZONE_A: { baseRate: 30, additionalRate: 25 },
      ZONE_B: { baseRate: 38, additionalRate: 32 },
      ZONE_C: { baseRate: 48, additionalRate: 40 },
      ZONE_D: { baseRate: 58, additionalRate: 50 },
      ZONE_E: { baseRate: 82, additionalRate: 72 },
    },
    codFixed: 35,
    codPercent: 1.6,
    awbPrefix: "XB",
  },
  ekart: {
    code: "ekart",
    name: "Ekart Logistics",
    rating: 4.7,
    supportsCod: true,
    supportsPrepaid: true,
    baseDeliveryDays: { ZONE_A: 1, ZONE_B: 2, ZONE_C: 2, ZONE_D: 4, ZONE_E: 6 },
    rates: {
      ZONE_A: { baseRate: 32, additionalRate: 26 },
      ZONE_B: { baseRate: 40, additionalRate: 34 },
      ZONE_C: { baseRate: 50, additionalRate: 42 },
      ZONE_D: { baseRate: 60, additionalRate: 52 },
      ZONE_E: { baseRate: 85, additionalRate: 75 },
    },
    codFixed: 38,
    codPercent: 1.75,
    awbPrefix: "EKT",
  },
  shadowfax: {
    code: "shadowfax",
    name: "Shadowfax Forward",
    rating: 4.4,
    supportsCod: true,
    supportsPrepaid: true,
    baseDeliveryDays: { ZONE_A: 1, ZONE_B: 2, ZONE_C: 3, ZONE_D: 5, ZONE_E: 7 },
    rates: {
      ZONE_A: { baseRate: 29, additionalRate: 24 },
      ZONE_B: { baseRate: 36, additionalRate: 30 },
      ZONE_C: { baseRate: 46, additionalRate: 38 },
      ZONE_D: { baseRate: 56, additionalRate: 48 },
      ZONE_E: { baseRate: 80, additionalRate: 70 },
    },
    codFixed: 32,
    codPercent: 1.5,
    awbPrefix: "SFX",
  },
  dtdc: {
    code: "dtdc",
    name: "DTDC Express Premium",
    rating: 4.3,
    supportsCod: true,
    supportsPrepaid: true,
    baseDeliveryDays: { ZONE_A: 1, ZONE_B: 2, ZONE_C: 3, ZONE_D: 4, ZONE_E: 6 },
    rates: {
      ZONE_A: { baseRate: 36, additionalRate: 30 },
      ZONE_B: { baseRate: 44, additionalRate: 38 },
      ZONE_C: { baseRate: 54, additionalRate: 46 },
      ZONE_D: { baseRate: 66, additionalRate: 58 },
      ZONE_E: { baseRate: 92, additionalRate: 80 },
    },
    codFixed: 45,
    codPercent: 2.0,
    awbPrefix: "DTDC",
  },
};

export class MockCourierProvider implements ICourierProvider {
  public code: string;
  public name: string;
  private profile: CourierProfile;

  constructor(courierCode: string) {
    const profile = COURIER_PROFILES[courierCode] ?? COURIER_PROFILES.delhivery;
    this.code = profile.code;
    this.name = profile.name;
    this.profile = profile;
  }

  async checkServiceability(req: ServiceabilityRequest): Promise<ServiceabilityResult> {
    const zone = determineShippingZone(req.pickupPincode, req.deliveryPincode);
    const estimatedDays = this.profile.baseDeliveryDays[zone];
    const isServiceable =
      req.pickupPincode.length === 6 && req.deliveryPincode.length === 6;

    return {
      courierCode: this.code,
      courierName: this.name,
      isServiceable,
      supportsCod: this.profile.supportsCod,
      supportsPrepaid: this.profile.supportsPrepaid,
      estimatedDeliveryDays: estimatedDays,
      zone,
      reason: isServiceable ? undefined : "Invalid 6-digit PIN code.",
    };
  }

  async calculateRate(
    req: ServiceabilityRequest,
    weight: CalculatedWeight,
  ): Promise<CourierRateQuote | null> {
    const serviceability = await this.checkServiceability(req);
    if (!serviceability.isServiceable) return null;

    const rateTable = this.profile.rates[serviceability.zone];
    const quote = calculateShippingQuote({
      zone: serviceability.zone,
      chargeableWeightKg: weight.chargeableWeightKg,
      baseRate: rateTable.baseRate,
      additionalRate: rateTable.additionalRate,
      paymentMode: req.paymentMode,
      codAmount: req.paymentMode === "COD" ? (req.declaredValue ?? 0) : 0,
      codFixed: this.profile.codFixed,
      codPercent: this.profile.codPercent,
    });

    return {
      courierCode: this.code,
      courierName: this.name,
      zone: serviceability.zone,
      chargeableWeightKg: weight.chargeableWeightKg,
      freightCharge: quote.freightCharge,
      codCharge: quote.codCharge,
      gstAmount: quote.gstAmount,
      totalShippingCost: quote.totalShippingCost,
      estimatedDeliveryDays: serviceability.estimatedDeliveryDays,
      rating: this.profile.rating,
      isRecommended: this.code === "delhivery",
    };
  }

  async createShipment(input: CreateShipmentInput): Promise<ShipmentBookingResult> {
    const weightCalc = calculateChargeableWeight(input.weightKg, {
      lengthCm: input.lengthCm,
      widthCm: input.widthCm,
      heightCm: input.heightCm,
    });

    const quote = await this.calculateRate(
      {
        pickupPincode: input.pickupPincode,
        deliveryPincode: input.deliveryPincode,
        weightKg: weightCalc.chargeableWeightKg,
        paymentMode: input.paymentMode,
        declaredValue: input.orderAmount,
      },
      weightCalc,
    );

    const shippingCharge = quote?.totalShippingCost ?? 75;
    const courierCost = Math.round(shippingCharge * 0.82 * 100) / 100; // Aggregator platform margin
    const sellerMargin = Math.round((shippingCharge - courierCost) * 100) / 100;

    // Generate deterministic AWB based on timestamp and courier prefix
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const awbNumber = `${this.profile.awbPrefix}${randomSuffix}`;

    const today = new Date();
    const pickupDate = new Date(today);
    pickupDate.setDate(today.getDate() + 1);

    const deliveryDays = quote?.estimatedDeliveryDays ?? 3;
    const deliveryDate = new Date(pickupDate);
    deliveryDate.setDate(pickupDate.getDate() + deliveryDays);

    const routingCode = `${input.deliveryPincode.slice(0, 3)}-${this.code.toUpperCase().slice(0, 3)}`;

    return {
      success: true,
      awbNumber,
      courierCode: this.code,
      courierName: this.name,
      shippingCharge,
      courierCharge: courierCost,
      sellerMargin,
      labelUrl: `/api/labels/${awbNumber}.pdf`,
      manifestUrl: `/api/manifests/${awbNumber}.pdf`,
      routingCode,
      trackingUrl: `https://shopwave.logistics/track/${awbNumber}`,
      estimatedDeliveryDate: deliveryDate.toISOString().slice(0, 10),
      pickupScheduledDate: pickupDate.toISOString().slice(0, 10),
    };
  }

  async generateLabel(awbNumber: string): Promise<string> {
    return `/labels/${awbNumber}.pdf`;
  }

  async generateManifest(awbNumbers: string[]): Promise<string> {
    return `/manifests/MAN-${Date.now()}.pdf`;
  }

  async trackAwb(awbNumber: string): Promise<TrackingDetails> {
    const now = new Date();
    const d1 = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const d2 = new Date(now.getTime() - 12 * 3600 * 1000).toISOString();
    const d3 = new Date(now.getTime() - 3 * 3600 * 1000).toISOString();

    return {
      awbNumber,
      courierCode: this.code,
      courierName: this.name,
      currentStatus: "IN_TRANSIT",
      originCity: "New Delhi",
      destinationCity: "Bengaluru",
      estimatedDeliveryDate: new Date(now.getTime() + 48 * 3600 * 1000)
        .toISOString()
        .slice(0, 10),
      checkpoints: [
        {
          status: "PICKUP_DONE",
          activity: "Shipment picked up from Seller Warehouse",
          location: "Okhla Phase III Hub, New Delhi",
          timestamp: d1,
        },
        {
          status: "IN_TRANSIT",
          activity: "Departed from Origin Mother Hub via Air Connect",
          location: "IGI Airport Hub, New Delhi",
          timestamp: d2,
        },
        {
          status: "IN_TRANSIT",
          activity: "Arrived at Destination Sort Center",
          location: "Bommasandra Hub, Bengaluru",
          timestamp: d3,
        },
      ],
    };
  }

  async cancelShipment(awbNumber: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Shipment ${awbNumber} successfully cancelled with ${this.name}.`,
    };
  }
}
