import { describe, it, expect } from "vitest";
import { ShadowfaxProvider } from "./provider";
import { calculateUserCourierPrice, setUserPricingProfile, getUserPricingProfile } from "../pricing-engine";

describe("Shadowfax Pricing & Multi-Zone Calculations", () => {
  const provider = new ShadowfaxProvider();

  it("calculates 0-500g Prepaid rates correctly across all 5 zones", async () => {
    // Zone A: ₹27
    const quoteA = await provider.calculateRate(
      { pickupPincode: "110001", deliveryPincode: "110002", paymentMode: "PREPAID", declaredValue: 500 },
      { chargeableWeightKg: 0.5, deadWeightKg: 0.5, volumetricWeightKg: 0.2 }
    );
    expect(quoteA?.totalShippingCost).toBe(27);

    // Zone B: ₹30
    const quoteB = await provider.calculateRate(
      { pickupPincode: "110001", deliveryPincode: "122001", paymentMode: "PREPAID", declaredValue: 500 },
      { chargeableWeightKg: 0.4, deadWeightKg: 0.4, volumetricWeightKg: 0.2 }
    );
    expect(quoteB?.totalShippingCost).toBe(30);

    // Zone C: ₹34
    const calcC = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_C",
      weightKg: 0.5,
      paymentMode: "PREPAID",
    });
    expect(calcC.totalShippingCost).toBe(34);

    // Zone D: ₹38 (User requested 38 instead of 72)
    const calcD = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_D",
      weightKg: 0.5,
      paymentMode: "PREPAID",
    });
    expect(calcD.totalShippingCost).toBe(38);

    // Zone E: ₹46
    const calcE = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_E",
      weightKg: 0.5,
      paymentMode: "PREPAID",
    });
    expect(calcE.totalShippingCost).toBe(46);
  });

  it("calculates 500g to 1.0kg Prepaid rates correctly across all 5 zones", async () => {
    // Zone A: ₹40
    const calcA = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_A",
      weightKg: 0.8,
      paymentMode: "PREPAID",
    });
    expect(calcA.totalShippingCost).toBe(40);

    // Zone B: ₹46
    const calcB = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_B",
      weightKg: 0.75,
      paymentMode: "PREPAID",
    });
    expect(calcB.totalShippingCost).toBe(46);

    // Zone C: ₹56
    const calcC = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_C",
      weightKg: 0.9,
      paymentMode: "PREPAID",
    });
    expect(calcC.totalShippingCost).toBe(56);

    // Zone D: ₹62
    const calcD = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_D",
      weightKg: 1.0,
      paymentMode: "PREPAID",
    });
    expect(calcD.totalShippingCost).toBe(62);

    // Zone E: ₹80
    const calcE = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_E",
      weightKg: 0.6,
      paymentMode: "PREPAID",
    });
    expect(calcE.totalShippingCost).toBe(80);
  });

  it("adds ₹20 extra for COD payment mode", async () => {
    // 0.5kg Zone D COD: 38 + 20 = 58
    const calcD_COD = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_D",
      weightKg: 0.5,
      paymentMode: "COD",
      codAmount: 1000,
    });
    expect(calcD_COD.codCharge).toBe(20);
    expect(calcD_COD.totalShippingCost).toBe(58);

    // 0.8kg Zone D COD: 62 + 20 = 82
    const calcD_COD_1kg = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_D",
      weightKg: 0.8,
      paymentMode: "COD",
      codAmount: 1000,
    });
    expect(calcD_COD_1kg.codCharge).toBe(20);
    expect(calcD_COD_1kg.totalShippingCost).toBe(82);

    // 0.5kg Zone A COD: 27 + 20 = 47
    const calcA_COD = calculateUserCourierPrice({
      courierCode: "shadowfax",
      zone: "ZONE_A",
      weightKg: 0.5,
      paymentMode: "COD",
      codAmount: 500,
    });
    expect(calcA_COD.totalShippingCost).toBe(47);
  });

  it("dynamically reflects custom user rate updates", async () => {
    const testUserId = "test-merchant-" + Date.now();
    
    // Assign custom pricing with Zone D @ ₹35 instead of default ₹38
    setUserPricingProfile(testUserId, "Test Merchant", "CUSTOM", {
      shadowfax: {
        courierCode: "shadowfax",
        courierName: "Shadowfax Express",
        zoneA_0_500g: 22,
        zoneB_0_500g: 25,
        zoneC_0_500g: 29,
        zoneD_0_500g: 35,
        zoneE_0_500g: 40,
        additional500g: 20,
        initialSlabWeightKg: 0.5,
        codChargeFlat: 15,
        codPercent: 0,
      },
    });

    const userQuote = calculateUserCourierPrice({
      userId: testUserId,
      courierCode: "shadowfax",
      zone: "ZONE_D",
      weightKg: 0.5,
      paymentMode: "PREPAID",
    });

    expect(userQuote.totalShippingCost).toBe(35);
  });
});
