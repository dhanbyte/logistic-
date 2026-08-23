import type { CalculatedWeight, Dimensions } from "@/lib/couriers/types";

// Legacy helpers retained for backwards compatibility
export function toMinorUnits(value: number, exchangeRateToBase = 1): number {
  const converted = value * exchangeRateToBase;
  const roundedMagnitude = Math.round((Math.abs(converted) + Number.EPSILON) * 100);
  return converted < 0 ? -roundedMagnitude : roundedMagnitude;
}

export function fromMinorUnits(value: number): number {
  return value / 100;
}

export function calculateProfit(clientPrice: number, carrierCost: number, additionalCosts: number): number {
  return fromMinorUnits(toMinorUnits(clientPrice - carrierCost - additionalCosts));
}

export function calculateMarginPercent(profit: number, clientPrice: number): number {
  if (clientPrice === 0) return 0;
  return fromMinorUnits(toMinorUnits((profit / clientPrice) * 100));
}

export function convertToReportingCurrency(value: number, exchangeRateToBase: number): number {
  return fromMinorUnits(toMinorUnits(value, exchangeRateToBase));
}

// ============================================================================
// ShopWave Logistics — Indian E-Commerce Shipping Calculations
// ============================================================================

/**
 * Calculates volumetric weight in kilograms using standard industry divisor (5000)
 * Volumetric Weight (kg) = (Length cm * Width cm * Height cm) / 5000
 */
export function calculateVolumetricWeight(dimensions: Dimensions): number {
  const { lengthCm, widthCm, heightCm } = dimensions;
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0;
  const raw = (lengthCm * widthCm * heightCm) / 5000;
  return Math.round(raw * 1000) / 1000;
}

/**
 * Returns dead weight, volumetric weight, and the effective chargeable weight
 * Chargeable Weight = max(Dead Weight, Volumetric Weight)
 */
export function calculateChargeableWeight(
  deadWeightKg: number,
  dimensions: Dimensions,
): CalculatedWeight {
  const volumetric = calculateVolumetricWeight(dimensions);
  const dead = Math.max(0.01, Math.round(deadWeightKg * 1000) / 1000);
  const chargeable = Math.max(dead, volumetric);
  return {
    deadWeightKg: dead,
    volumetricWeightKg: volumetric,
    chargeableWeightKg: Math.round(chargeable * 1000) / 1000,
  };
}

/**
 * Calculates number of 0.5kg (or custom slab) additional slabs beyond min weight
 */
export function calculateAdditionalSlabs(
  chargeableWeightKg: number,
  minWeightKg = 0.5,
  slabKg = 0.5,
): number {
  if (chargeableWeightKg <= minWeightKg) return 0;
  const extraWeight = chargeableWeightKg - minWeightKg;
  return Math.ceil(extraWeight / slabKg);
}

export type ShippingZone = "ZONE_A" | "ZONE_B" | "ZONE_C" | "ZONE_D" | "ZONE_E";

const METRO_PIN_PREFIXES = new Set([
  "11", // Delhi NCR
  "12", // Gurgaon / Faridabad
  "20", // Noida / Ghaziabad
  "40", // Mumbai
  "41", // Pune
  "56", // Bengaluru
  "50", // Hyderabad
  "60", // Chennai
  "70", // Kolkata
]);

const SPECIAL_ZONE_PREFIXES = new Set([
  "18", // J&K
  "19", // J&K / Ladakh
  "78", // Assam
  "79", // North East (Meghalaya, Manipur, Mizoram, Tripura, Nagaland, Arunachal)
  "74", // Andaman & Nicobar
  "73", // Sikkim / North Bengal
]);

/**
 * Determines Indian Shipping Zone between Origin & Destination PIN codes
 * - Zone A: Intra-City (Same first 3 digits)
 * - Zone B: Intra-State (Same first 2 digits)
 * - Zone C: Metro-to-Metro
 * - Zone E: Special Zone (NE, J&K, Islands)
 * - Zone D: Rest of India
 */
export function determineShippingZone(
  pickupPincode: string,
  deliveryPincode: string,
): ShippingZone {
  const cleanPickup = pickupPincode.trim().slice(0, 6);
  const cleanDelivery = deliveryPincode.trim().slice(0, 6);

  if (
    SPECIAL_ZONE_PREFIXES.has(cleanPickup.slice(0, 2)) ||
    SPECIAL_ZONE_PREFIXES.has(cleanDelivery.slice(0, 2))
  ) {
    return "ZONE_E";
  }

  if (cleanPickup.slice(0, 3) === cleanDelivery.slice(0, 3)) {
    return "ZONE_A"; // Intra-city
  }

  if (cleanPickup.slice(0, 2) === cleanDelivery.slice(0, 2)) {
    return "ZONE_B"; // Intra-state
  }

  if (
    METRO_PIN_PREFIXES.has(cleanPickup.slice(0, 2)) &&
    METRO_PIN_PREFIXES.has(cleanDelivery.slice(0, 2))
  ) {
    return "ZONE_C"; // Metro-to-Metro
  }

  return "ZONE_D"; // Rest of India
}

/**
 * Calculates full shipping breakdown for a courier rate card
 */
export function calculateShippingQuote(params: {
  zone: ShippingZone;
  chargeableWeightKg: number;
  baseRate: number;
  additionalRate: number;
  paymentMode: "PREPAID" | "COD";
  codAmount?: number;
  codFixed?: number;
  codPercent?: number;
  gstRate?: number;
}): {
  freightCharge: number;
  codCharge: number;
  gstAmount: number;
  totalShippingCost: number;
} {
  const {
    chargeableWeightKg,
    baseRate,
    additionalRate,
    paymentMode,
    codAmount = 0,
    codFixed = 40,
    codPercent = 2.0,
    gstRate = 18,
  } = params;

  const extraSlabs = calculateAdditionalSlabs(chargeableWeightKg, 0.5, 0.5);
  const freightCharge = Math.round((baseRate + extraSlabs * additionalRate) * 100) / 100;

  let codCharge = 0;
  if (paymentMode === "COD" && codAmount > 0) {
    const calculatedPercentage = (codAmount * codPercent) / 100;
    codCharge = Math.max(codFixed, Math.round(calculatedPercentage * 100) / 100);
  }

  const taxableAmount = freightCharge + codCharge;
  const gstAmount = Math.round((taxableAmount * gstRate) / 100 * 100) / 100;
  const totalShippingCost = Math.round((taxableAmount + gstAmount) * 100) / 100;

  return {
    freightCharge,
    codCharge,
    gstAmount,
    totalShippingCost,
  };
}

/**
 * Formats Indian Currency (INR ₹)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculates delivery success rate percentage
 */
export function calculateDeliverySuccessRate(
  deliveredCount: number,
  totalOutCount: number,
): number {
  if (totalOutCount <= 0) return 0;
  const rate = (deliveredCount / totalOutCount) * 100;
  return Math.round(rate * 10) / 10;
}
