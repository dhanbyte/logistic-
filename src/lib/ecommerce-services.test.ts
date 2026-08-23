import { describe, expect, it } from "vitest";
import {
  calculateAdditionalSlabs,
  calculateChargeableWeight,
  calculateDeliverySuccessRate,
  calculateShippingQuote,
  calculateVolumetricWeight,
  determineShippingZone,
  formatINR,
} from "@/lib/calculations";
import { MockCourierProvider } from "@/lib/couriers/mock-provider";
import { compareAllCourierRates, getCourierProvider } from "@/lib/couriers/registry";
import { orderFormSchema } from "@/lib/validation/order";
import { warehouseFormSchema } from "@/lib/validation/warehouse";

describe("ShopWave Logistics — E-Commerce Weight & Rate Calculations", () => {
  it("calculates volumetric weight correctly using (L x W x H)/5000", () => {
    // 20cm x 15cm x 10cm = 3000 / 5000 = 0.6 kg
    const vol = calculateVolumetricWeight({ lengthCm: 20, widthCm: 15, heightCm: 10 });
    expect(vol).toBe(0.6);
  });

  it("calculates chargeable weight as the maximum of dead weight and volumetric weight", () => {
    // Dead weight 0.4 kg < Volumetric 0.6 kg -> Chargeable must be 0.6 kg
    const calc1 = calculateChargeableWeight(0.4, {
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
    });
    expect(calc1.deadWeightKg).toBe(0.4);
    expect(calc1.volumetricWeightKg).toBe(0.6);
    expect(calc1.chargeableWeightKg).toBe(0.6);

    // Dead weight 1.5 kg > Volumetric 0.6 kg -> Chargeable must be 1.5 kg
    const calc2 = calculateChargeableWeight(1.5, {
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
    });
    expect(calc2.chargeableWeightKg).toBe(1.5);
  });

  it("calculates additional 0.5kg slabs accurately", () => {
    expect(calculateAdditionalSlabs(0.4)).toBe(0);
    expect(calculateAdditionalSlabs(0.5)).toBe(0);
    expect(calculateAdditionalSlabs(0.6)).toBe(1); // 1 extra slab for 0.6kg
    expect(calculateAdditionalSlabs(1.2)).toBe(2); // 2 extra slabs for 1.2kg
  });

  it("determines Indian shipping zones based on PIN code rules", () => {
    // Same first 3 digits -> Zone A (Intra-city)
    expect(determineShippingZone("110020", "110001")).toBe("ZONE_A");

    // Same first 2 digits (Maharashtra 40) but different 3rd digit -> Zone B (Intra-state)
    expect(determineShippingZone("400001", "401201")).toBe("ZONE_B");

    // Metro to Metro (Delhi 11 to Bengaluru 56) -> Zone C
    expect(determineShippingZone("110020", "560001")).toBe("ZONE_C");

    // North East (78) -> Zone E (Special Zone)
    expect(determineShippingZone("110020", "781001")).toBe("ZONE_E");

    // Rest of India -> Zone D
    expect(determineShippingZone("110020", "302001")).toBe("ZONE_D");
  });

  it("calculates shipping quote with base rate, extra slabs, COD fee, and 18% GST", () => {
    const quote = calculateShippingQuote({
      zone: "ZONE_C",
      chargeableWeightKg: 1.2, // 0.5kg base + 2 slabs of 0.5kg
      baseRate: 50,
      additionalRate: 40,
      paymentMode: "COD",
      codAmount: 2000,
      codFixed: 40,
      codPercent: 2.0, // 2% of 2000 = 40 (matches fixed 40)
      gstRate: 18,
    });

    // Freight = 50 + (2 * 40) = 130
    expect(quote.freightCharge).toBe(130);
    // COD = 40
    expect(quote.codCharge).toBe(40);
    // Taxable = 170, GST = 30.6
    expect(quote.gstAmount).toBe(30.6);
    // Total = 200.6
    expect(quote.totalShippingCost).toBe(200.6);
  });

  it("formats Indian Rupee (INR ₹) properly", () => {
    const formatted = formatINR(1499.5);
    expect(formatted).toContain("1,499.50");
  });

  it("calculates delivery success rate percentage", () => {
    expect(calculateDeliverySuccessRate(93, 100)).toBe(93);
    expect(calculateDeliverySuccessRate(0, 0)).toBe(0);
  });
});

describe("ShopWave Logistics — Mock Courier Provider & Registry", () => {
  it("provides deterministic rate quotes for Delhivery, Blue Dart, and Xpressbees", async () => {
    const delhivery = getCourierProvider("delhivery");
    expect(delhivery.code).toBe("delhivery");

    const weightCalc = calculateChargeableWeight(0.5, {
      lengthCm: 10,
      widthCm: 10,
      heightCm: 10,
    });

    const quote = await delhivery.calculateRate(
      {
        pickupPincode: "110020",
        deliveryPincode: "400050",
        weightKg: 0.5,
        paymentMode: "PREPAID",
      },
      weightCalc,
    );

    expect(quote).not.toBeNull();
    expect(quote?.courierCode).toBe("delhivery");
    expect(quote?.totalShippingCost).toBeGreaterThan(0);
    expect(quote?.estimatedDeliveryDays).toBeGreaterThan(0);
  });

  it("compares rate quotes across all active courier partners sorted by price", async () => {
    const weightCalc = calculateChargeableWeight(0.8, {
      lengthCm: 15,
      widthCm: 10,
      heightCm: 8,
    });

    const quotes = await compareAllCourierRates(
      {
        pickupPincode: "110020",
        deliveryPincode: "560001",
        weightKg: weightCalc.chargeableWeightKg,
        paymentMode: "PREPAID",
      },
      weightCalc,
    );

    expect(quotes.length).toBeGreaterThanOrEqual(1);
    expect(quotes[0].courierCode).toBe("xpressbees");
    // Verified sorted order
    expect(quotes[0].totalShippingCost).toBeLessThanOrEqual(quotes[quotes.length - 1].totalShippingCost);
  });

  it("generates deterministic AWB number and routing code upon booking shipment", async () => {
    const bluedart = new MockCourierProvider("bluedart");
    const result = await bluedart.createShipment({
      orderId: "ord-test-1",
      orderNumber: "SW-99182",
      warehouseId: "wh-test",
      courierCode: "bluedart",
      pickupPincode: "110020",
      deliveryPincode: "560095",
      customerName: "Pooja Hegde",
      customerPhone: "9845098765",
      customerAddress: "Koramangala, Bengaluru",
      customerCity: "Bengaluru",
      customerState: "Karnataka",
      productName: "Headphones",
      quantity: 1,
      paymentMode: "PREPAID",
      orderAmount: 2999,
      codAmount: 0,
      weightKg: 1.0,
      lengthCm: 18,
      widthCm: 12,
      heightCm: 8,
    });

    expect(result.success).toBe(true);
    expect(result.awbNumber.startsWith("BD")).toBe(true);
    expect(result.routingCode).toBe("560-BLU");
    expect(result.trackingUrl).toContain(result.awbNumber);
  });

  it("tracks AWB checkpoints with origin, destination, and timestamps", async () => {
    const provider = getCourierProvider("delhivery");
    const tracking = await provider.trackAwb("DLV123456789");

    expect(tracking.awbNumber).toBe("DLV123456789");
    expect(tracking.checkpoints.length).toBeGreaterThan(0);
    expect(tracking.currentStatus).toBe("IN_TRANSIT");
  });
});

describe("ShopWave Logistics — Validation Schemas", () => {
  it("validates valid e-commerce order input data", () => {
    const validData = {
      customerName: "Aarav Sharma",
      customerPhone: "9876543210",
      customerEmail: "aarav@example.com",
      addressLine1: "Flat 101, Lake View Apts",
      addressLine2: "Near Metro",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      orderNumber: "SW-ORD-101",
      warehouseId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      channelName: "SHOPIFY",
      paymentMode: "PREPAID",
      orderAmount: 1899,
      codAmount: 0,
      productName: "Cotton Shirt",
      productSku: "SHT-COT-01",
      quantity: 1,
      weightKg: 0.5,
      lengthCm: 15,
      widthCm: 10,
      heightCm: 5,
    };

    const parsed = orderFormSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid 6-digit Indian PIN codes and invalid phone numbers", () => {
    const invalidData = {
      customerName: "A",
      customerPhone: "12345", // Invalid phone
      addressLine1: "St",
      city: "M",
      state: "M",
      pincode: "001122", // Invalid Indian PIN code (cannot start with 0)
      orderNumber: "",
      warehouseId: "invalid-uuid",
      paymentMode: "COD",
      orderAmount: 1000,
      codAmount: 0, // Invalid for COD
      productName: "",
      quantity: 0,
      weightKg: -1,
      lengthCm: 0,
      widthCm: 0,
      heightCm: 0,
    };

    const parsed = orderFormSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("validates warehouse form inputs including 15-digit Indian GSTIN", () => {
    const validWh = {
      warehouseName: "Okhla Central Hub",
      contactPerson: "Rajesh Sharma",
      contactPhone: "9811223344",
      contactEmail: "hub@example.com",
      addressLine1: "Plot 42, Okhla Phase 3",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110020",
      gstin: "07AAACB1234F1Z5",
      isDefault: true,
    };

    const parsed = warehouseFormSchema.safeParse(validWh);
    expect(parsed.success).toBe(true);
  });
});
