import type { SupportedCourierCode } from "./registry";

export type PricingTier = "STANDARD" | "SILVER" | "GOLD" | "CUSTOM";

export interface WeightSlabRate {
  slab: string;
  maxWeight: number;
  zoneA: number;
  zoneB: number;
  zoneC: number;
  zoneD: number;
  zoneE: number;
  codFee?: number;
}

export interface UserCourierRate {
  courierCode: string;
  courierName: string;
  zoneA_0_500g: number; // Intra-city / Local (₹)
  zoneB_0_500g: number; // Regional / Within State (₹)
  zoneC_0_500g: number; // Metro to Metro (₹)
  zoneD_0_500g: number; // Rest of India (₹)
  zoneE_0_500g: number; // Special Zones (NE, J&K, Islands) (₹)
  zoneA_500g_1kg?: number;
  zoneB_500g_1kg?: number;
  zoneC_500g_1kg?: number;
  zoneD_500g_1kg?: number;
  zoneE_500g_1kg?: number;
  additional500g: number; // Additional slab price (₹)
  additionalKg?: number;  // Additional 1kg slab for cargo (₹)
  initialSlabWeightKg?: number; // Base slab weight in kg (e.g. 0.5 for air, 5.0 for cargo)
  codChargeFlat: number;  // Flat COD fee (₹)
  codPercent: number;     // COD percentage (%)
  slabs?: WeightSlabRate[]; // Multi-slab weight matrix
}

export interface UserPricingProfile {
  userId: string;
  userName: string;
  tier: PricingTier;
  rates: Record<string, UserCourierRate>;
  updatedAt: string;
}

// Default Global Platform Rates (Zone A to E for Air & Surface Cargo)
export const DEFAULT_GLOBAL_RATES: Record<string, UserCourierRate> = {
  shadowfax: {
    courierCode: "shadowfax",
    courierName: "Shadowfax Express 0.5KG (Air)",
    zoneA_0_500g: 27,
    zoneB_0_500g: 30,
    zoneC_0_500g: 34,
    zoneD_0_500g: 38,
    zoneE_0_500g: 46,
    zoneA_500g_1kg: 40,
    zoneB_500g_1kg: 46,
    zoneC_500g_1kg: 56,
    zoneD_500g_1kg: 62,
    zoneE_500g_1kg: 80,
    additional500g: 24,
    initialSlabWeightKg: 0.5,
    codChargeFlat: 20,
    codPercent: 0,
    slabs: [
      { slab: "0–500g", maxWeight: 0.5, zoneA: 27, zoneB: 30, zoneC: 34, zoneD: 38, zoneE: 46, codFee: 20 },
      { slab: "500g–1kg", maxWeight: 1.0, zoneA: 40, zoneB: 46, zoneC: 56, zoneD: 62, zoneE: 80, codFee: 20 },
      { slab: "1kg–1.5kg", maxWeight: 1.5, zoneA: 53, zoneB: 62, zoneC: 78, zoneD: 86, zoneE: 114, codFee: 20 },
      { slab: "1.5kg–2kg", maxWeight: 2.0, zoneA: 66, zoneB: 78, zoneC: 100, zoneD: 110, zoneE: 148, codFee: 20 },
      { slab: "2kg–5kg", maxWeight: 5.0, zoneA: 105, zoneB: 126, zoneC: 166, zoneD: 182, zoneE: 250, codFee: 20 },
      { slab: "5kg–7kg", maxWeight: 7.0, zoneA: 145, zoneB: 174, zoneC: 232, zoneD: 254, zoneE: 352, codFee: 20 },
      { slab: "7kg–10kg", maxWeight: 10.0, zoneA: 205, zoneB: 246, zoneC: 331, zoneD: 362, zoneE: 505, codFee: 20 },
      { slab: "Above 10kg (+1kg)", maxWeight: 99.0, zoneA: 20, zoneB: 25, zoneC: 30, zoneD: 35, zoneE: 45, codFee: 20 },
    ],
  },
  shadowfax_surface: {
    courierCode: "shadowfax_surface",
    courierName: "Shadowfax Cargo 5KG (Surface)",
    zoneA_0_500g: 75,
    zoneB_0_500g: 85,
    zoneC_0_500g: 89,
    zoneD_0_500g: 99,
    zoneE_0_500g: 119,
    additional500g: 20,
    additionalKg: 20,
    initialSlabWeightKg: 5.0,
    codChargeFlat: 20,
    codPercent: 0,
  },
  xpressbees: {
    courierCode: "xpressbees",
    courierName: "Xpressbees Surface (0.5kg)",
    zoneA_0_500g: 52,
    zoneB_0_500g: 62,
    zoneC_0_500g: 72,
    zoneD_0_500g: 82,
    zoneE_0_500g: 98,
    additional500g: 38,
    initialSlabWeightKg: 0.5,
    codChargeFlat: 20,
    codPercent: 0,
  },
  delhivery: {
    courierCode: "delhivery",
    courierName: "Delhivery Direct (0.5kg)",
    zoneA_0_500g: 55,
    zoneB_0_500g: 65,
    zoneC_0_500g: 75,
    zoneD_0_500g: 85,
    zoneE_0_500g: 105,
    additional500g: 40,
    initialSlabWeightKg: 0.5,
    codChargeFlat: 20,
    codPercent: 0,
  },
};

// In-memory cache for fast lookup
const userCustomRates = new Map<string, UserPricingProfile>();
let globalRatesCache: Record<string, UserCourierRate> | null = null;
let isDiskLoaded = false;

function ensureDiskRatesLoaded(): void {
  if (typeof window !== "undefined") return;
  try {
    const { loadRatesFromDisk, loadGlobalRatesFromDisk } = require("./pricing-store");
    const diskData = loadRatesFromDisk();
    for (const [k, v] of Object.entries(diskData)) {
      userCustomRates.set(k, v as UserPricingProfile);
    }
    const globalDisk = loadGlobalRatesFromDisk();
    if (globalDisk) {
      globalRatesCache = globalDisk;
    }
    isDiskLoaded = true;
  } catch {
    // fallback to memory
  }
}

function triggerDiskSave(): void {
  if (typeof window !== "undefined") return;
  try {
    const { saveRatesToDisk } = require("./pricing-store");
    saveRatesToDisk(userCustomRates);
  } catch {
    // fallback
  }
}

/**
 * Standard Default Pricing Tiers
 */
export const DEFAULT_PRICING_TIERS: Record<PricingTier, Record<string, UserCourierRate>> = {
  STANDARD: DEFAULT_GLOBAL_RATES,
  SILVER: {
    shadowfax: {
      courierCode: "shadowfax",
      courierName: "Shadowfax Express 0.5KG (Air)",
      zoneA_0_500g: 25,
      zoneB_0_500g: 28,
      zoneC_0_500g: 32,
      zoneD_0_500g: 36,
      zoneE_0_500g: 44,
      zoneA_500g_1kg: 38,
      zoneB_500g_1kg: 44,
      zoneC_500g_1kg: 53,
      zoneD_500g_1kg: 59,
      zoneE_500g_1kg: 76,
      additional500g: 22,
      initialSlabWeightKg: 0.5,
      codChargeFlat: 15,
      codPercent: 0,
    },
    shadowfax_surface: {
      courierCode: "shadowfax_surface",
      courierName: "Shadowfax Cargo",
      zoneA_0_500g: 69,
      zoneB_0_500g: 79,
      zoneC_0_500g: 82,
      zoneD_0_500g: 92,
      zoneE_0_500g: 109,
      additional500g: 18,
      additionalKg: 18,
      initialSlabWeightKg: 5.0,
      codChargeFlat: 15,
      codPercent: 0,
    },
    xpressbees: {
      courierCode: "xpressbees",
      courierName: "Xpressbees Surface",
      zoneA_0_500g: 45,
      zoneB_0_500g: 55,
      zoneC_0_500g: 65,
      zoneD_0_500g: 75,
      zoneE_0_500g: 90,
      additional500g: 32,
      initialSlabWeightKg: 0.5,
      codChargeFlat: 15,
      codPercent: 0,
    },
    delhivery: {
      courierCode: "delhivery",
      courierName: "Delhivery Direct",
      zoneA_0_500g: 48,
      zoneB_0_500g: 58,
      zoneC_0_500g: 68,
      zoneD_0_500g: 78,
      zoneE_0_500g: 95,
      additional500g: 35,
      initialSlabWeightKg: 0.5,
      codChargeFlat: 15,
      codPercent: 0,
    },
  },
  GOLD: {
    shadowfax: {
      courierCode: "shadowfax",
      courierName: "Shadowfax Express 0.5KG (Air)",
      zoneA_0_500g: 23,
      zoneB_0_500g: 26,
      zoneC_0_500g: 30,
      zoneD_0_500g: 34,
      zoneE_0_500g: 42,
      zoneA_500g_1kg: 35,
      zoneB_500g_1kg: 40,
      zoneC_500g_1kg: 50,
      zoneD_500g_1kg: 55,
      zoneE_500g_1kg: 72,
      additional500g: 20,
      initialSlabWeightKg: 0.5,
      codChargeFlat: 10,
      codPercent: 0,
    },
    shadowfax_surface: {
      courierCode: "shadowfax_surface",
      courierName: "Shadowfax Cargo",
      zoneA_0_500g: 62,
      zoneB_0_500g: 72,
      zoneC_0_500g: 78,
      zoneD_0_500g: 85,
      zoneE_0_500g: 99,
      additional500g: 15,
      additionalKg: 15,
      initialSlabWeightKg: 5.0,
      codChargeFlat: 10,
      codPercent: 0,
    },
    xpressbees: {
      courierCode: "xpressbees",
      courierName: "Xpressbees Surface",
      zoneA_0_500g: 40,
      zoneB_0_500g: 50,
      zoneC_0_500g: 60,
      zoneD_0_500g: 70,
      zoneE_0_500g: 85,
      additional500g: 28,
      initialSlabWeightKg: 0.5,
      codChargeFlat: 10,
      codPercent: 0,
    },
    delhivery: {
      courierCode: "delhivery",
      courierName: "Delhivery Direct",
      zoneA_0_500g: 42,
      zoneB_0_500g: 52,
      zoneC_0_500g: 62,
      zoneD_0_500g: 72,
      zoneE_0_500g: 88,
      additional500g: 30,
      initialSlabWeightKg: 0.5,
      codChargeFlat: 10,
      codPercent: 0,
    },
  },
  CUSTOM: {},
};

/**
 * Get current platform-wide Global Default Rates
 */
export function getGlobalCourierRates(): Record<string, UserCourierRate> {
  ensureDiskRatesLoaded();
  if (globalRatesCache) {
    return JSON.parse(JSON.stringify(globalRatesCache));
  }
  return JSON.parse(JSON.stringify(DEFAULT_GLOBAL_RATES));
}

/**
 * Set platform-wide Global Default Rates (saves to data/global-rates.json)
 */
export function setGlobalCourierRates(rates: Record<string, UserCourierRate>): Record<string, UserCourierRate> {
  ensureDiskRatesLoaded();
  globalRatesCache = rates;
  if (typeof window === "undefined") {
    try {
      const { saveGlobalRatesToDisk } = require("./pricing-store");
      saveGlobalRatesToDisk(rates);
    } catch {
      // fallback
    }
  }
  return rates;
}

/**
 * Get rate card for a user.
 * If the user has custom assigned rates, returns those.
 * Otherwise, falls back to the current Global Default Rates.
 */
export function getUserPricingProfile(userId?: string | null, userName = "Shipper"): UserPricingProfile {
  ensureDiskRatesLoaded();
  if (userId && userCustomRates.has(userId)) {
    return userCustomRates.get(userId)!;
  }

  // Fallback to active Global Platform Rates
  const activeGlobalRates = getGlobalCourierRates();
  const profile: UserPricingProfile = {
    userId: userId || "default-user",
    userName,
    tier: "STANDARD",
    rates: activeGlobalRates,
    updatedAt: new Date().toISOString(),
  };

  if (userId) {
    userCustomRates.set(userId, profile);
    triggerDiskSave();
  }
  return profile;
}

/**
 * Admin assigns custom courier rates or pricing tier to a specific user
 */
export function setUserPricingProfile(
  userId: string,
  userName: string,
  tier: PricingTier,
  customRates?: Record<string, UserCourierRate>,
): UserPricingProfile {
  ensureDiskRatesLoaded();
  let ratesToSet: Record<string, UserCourierRate>;

  if (tier === "CUSTOM" && customRates) {
    ratesToSet = customRates;
  } else if (tier === "STANDARD") {
    ratesToSet = getGlobalCourierRates();
  } else {
    ratesToSet = JSON.parse(JSON.stringify(DEFAULT_PRICING_TIERS[tier] || DEFAULT_PRICING_TIERS.STANDARD));
  }

  const profile: UserPricingProfile = {
    userId,
    userName,
    tier,
    rates: ratesToSet,
    updatedAt: new Date().toISOString(),
  };

  userCustomRates.set(userId, profile);
  triggerDiskSave();
  return profile;
}

/**
 * Compute real-time shipping quote for a specific user and courier
 */
export function calculateUserCourierPrice(params: {
  userId?: string;
  courierCode: string;
  zone: "ZONE_A" | "ZONE_B" | "ZONE_C" | "ZONE_D" | "ZONE_E";
  weightKg: number;
  paymentMode: "PREPAID" | "COD";
  codAmount?: number;
}): {
  baseFreight: number;
  codCharge: number;
  totalShippingCost: number;
  appliedTier: PricingTier;
} {
  const profile = getUserPricingProfile(params.userId);
  const courierRates = profile.rates[params.courierCode] || profile.rates["shadowfax"] || DEFAULT_GLOBAL_RATES.shadowfax;
  const isSurface = params.courierCode.includes("surface");

  let basePrice = 0;
  let codCharge = 0;

  // 1. If multi-slab configuration exists in courier rate card
  if (Array.isArray(courierRates.slabs) && courierRates.slabs.length > 0) {
    const sortedSlabs = [...courierRates.slabs].sort((a, b) => a.maxWeight - b.maxWeight);
    const matchedSlab = sortedSlabs.find((s) => params.weightKg <= s.maxWeight);

    if (matchedSlab) {
      if (params.zone === "ZONE_A") basePrice = matchedSlab.zoneA;
      else if (params.zone === "ZONE_B") basePrice = matchedSlab.zoneB;
      else if (params.zone === "ZONE_C") basePrice = matchedSlab.zoneC;
      else if (params.zone === "ZONE_D") basePrice = matchedSlab.zoneD;
      else basePrice = matchedSlab.zoneE;

      if (params.paymentMode === "COD") {
        codCharge = matchedSlab.codFee !== undefined ? matchedSlab.codFee : (courierRates.codChargeFlat || 20);
      }
    } else {
      // Above max slab weight (e.g. > 10kg)
      const lastSlab = sortedSlabs[sortedSlabs.length - 1];
      const secondLastSlab = sortedSlabs[sortedSlabs.length - 2] || lastSlab;
      let highestPrice = lastSlab.zoneD;
      if (params.zone === "ZONE_A") highestPrice = lastSlab.zoneA;
      else if (params.zone === "ZONE_B") highestPrice = lastSlab.zoneB;
      else if (params.zone === "ZONE_C") highestPrice = lastSlab.zoneC;
      else if (params.zone === "ZONE_E") highestPrice = lastSlab.zoneE;

      const extraKg = Math.ceil(params.weightKg - (secondLastSlab.maxWeight || 10));
      basePrice = highestPrice + extraKg * (lastSlab.zoneD || 35);

      if (params.paymentMode === "COD") {
        codCharge = lastSlab.codFee !== undefined ? lastSlab.codFee : (courierRates.codChargeFlat || 20);
      }
    }
  } else {
    // 2. Standard 2-Tier / Slab Weight Calculation
    if (isSurface) {
      const baseWeightSlab = courierRates.initialSlabWeightKg || 5.0;
      if (params.zone === "ZONE_A") basePrice = courierRates.zoneA_0_500g || 75;
      else if (params.zone === "ZONE_B") basePrice = courierRates.zoneB_0_500g || 85;
      else if (params.zone === "ZONE_C") basePrice = courierRates.zoneC_0_500g || 89;
      else if (params.zone === "ZONE_D") basePrice = courierRates.zoneD_0_500g || 99;
      else basePrice = courierRates.zoneE_0_500g || 119;

      if (params.weightKg > baseWeightSlab) {
        const extraKg = Math.ceil(params.weightKg - baseWeightSlab);
        basePrice += extraKg * (courierRates.additionalKg || courierRates.additional500g || 20);
      }
    } else {
      // Air Express (e.g. Shadowfax Express)
      if (params.weightKg <= 0.5) {
        if (params.zone === "ZONE_A") basePrice = courierRates.zoneA_0_500g || 27;
        else if (params.zone === "ZONE_B") basePrice = courierRates.zoneB_0_500g || 30;
        else if (params.zone === "ZONE_C") basePrice = courierRates.zoneC_0_500g || 34;
        else if (params.zone === "ZONE_D") basePrice = courierRates.zoneD_0_500g || 38;
        else basePrice = courierRates.zoneE_0_500g || 46;
      } else if (params.weightKg <= 1.0) {
        if (params.zone === "ZONE_A") basePrice = courierRates.zoneA_500g_1kg || 40;
        else if (params.zone === "ZONE_B") basePrice = courierRates.zoneB_500g_1kg || 46;
        else if (params.zone === "ZONE_C") basePrice = courierRates.zoneC_500g_1kg || 56;
        else if (params.zone === "ZONE_D") basePrice = courierRates.zoneD_500g_1kg || 62;
        else basePrice = courierRates.zoneE_500g_1kg || 80;
      } else {
        // > 1.0 kg
        let base1kg = courierRates.zoneD_500g_1kg || 62;
        if (params.zone === "ZONE_A") base1kg = courierRates.zoneA_500g_1kg || 40;
        else if (params.zone === "ZONE_B") base1kg = courierRates.zoneB_500g_1kg || 46;
        else if (params.zone === "ZONE_C") base1kg = courierRates.zoneC_500g_1kg || 56;
        else if (params.zone === "ZONE_E") base1kg = courierRates.zoneE_500g_1kg || 80;

        const extraSlabs = Math.ceil((params.weightKg - 1.0) / 0.5);
        basePrice = base1kg + extraSlabs * (courierRates.additional500g || 24);
      }
    }

    if (params.paymentMode === "COD") {
      const percentCharge = ((params.codAmount || 0) * (courierRates.codPercent || 0)) / 100;
      codCharge = Math.max(courierRates.codChargeFlat !== undefined ? courierRates.codChargeFlat : 20, percentCharge);
    }
  }

  const baseFreight = Math.round(basePrice / 1.18);
  const totalShippingCost = Math.round(basePrice + codCharge);

  return {
    baseFreight,
    codCharge: Math.round(codCharge),
    totalShippingCost,
    appliedTier: profile.tier,
  };
}
