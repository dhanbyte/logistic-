import type { SupportedCourierCode } from "./registry";

export type PricingTier = "STANDARD" | "SILVER" | "GOLD" | "CUSTOM";

export interface UserCourierRate {
  courierCode: string;
  courierName: string;
  zoneA_0_500g: number; // Intra-city / Local (₹)
  zoneB_0_500g: number; // Regional / Within State (₹)
  zoneC_0_500g: number; // Metro to Metro (₹)
  zoneD_0_500g: number; // Rest of India (₹)
  zoneE_0_500g: number; // Special Zones (NE, J&K, Islands) (₹)
  additional500g: number; // Additional 500g slab (₹)
  codChargeFlat: number;  // Flat COD fee (₹)
  codPercent: number;     // COD percentage (%)
  slabs?: any[];          // Multi-slab weight matrix
}

export interface UserPricingProfile {
  userId: string;
  userName: string;
  tier: PricingTier;
  rates: Record<string, UserCourierRate>;
  updatedAt: string;
}

// In-memory user custom rate cards store
const userCustomRates = new Map<string, UserPricingProfile>();

/**
 * Standard Default Pricing Tiers
 */
export const DEFAULT_PRICING_TIERS: Record<PricingTier, Record<string, UserCourierRate>> = {
  STANDARD: {
    shadowfax: {
      courierCode: "shadowfax",
      courierName: "Shadowfax Express",
      zoneA_0_500g: 45,
      zoneB_0_500g: 52,
      zoneC_0_500g: 62,
      zoneD_0_500g: 72,
      zoneE_0_500g: 88,
      additional500g: 35,
      codChargeFlat: 0,
      codPercent: 0,
    },
    xpressbees: {
      courierCode: "xpressbees",
      courierName: "Xpressbees Surface",
      zoneA_0_500g: 52,
      zoneB_0_500g: 62,
      zoneC_0_500g: 72,
      zoneD_0_500g: 82,
      zoneE_0_500g: 98,
      additional500g: 38,
      codChargeFlat: 0,
      codPercent: 0,
    },
    delhivery: {
      courierCode: "delhivery",
      courierName: "Delhivery Direct",
      zoneA_0_500g: 55,
      zoneB_0_500g: 65,
      zoneC_0_500g: 75,
      zoneD_0_500g: 85,
      zoneE_0_500g: 105,
      additional500g: 40,
      codChargeFlat: 0,
      codPercent: 0,
    },
  },
  SILVER: {
    shadowfax: {
      courierCode: "shadowfax",
      courierName: "Shadowfax Express",
      zoneA_0_500g: 40,
      zoneB_0_500g: 48,
      zoneC_0_500g: 58,
      zoneD_0_500g: 68,
      zoneE_0_500g: 82,
      additional500g: 30,
      codChargeFlat: 0,
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
      codChargeFlat: 0,
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
      codChargeFlat: 0,
      codPercent: 0,
    },
  },
  GOLD: {
    shadowfax: {
      courierCode: "shadowfax",
      courierName: "Shadowfax Express",
      zoneA_0_500g: 35,
      zoneB_0_500g: 42,
      zoneC_0_500g: 52,
      zoneD_0_500g: 62,
      zoneE_0_500g: 75,
      additional500g: 25,
      codChargeFlat: 0,
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
      codChargeFlat: 0,
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
      codChargeFlat: 0,
      codPercent: 0,
    },
  },
  CUSTOM: {},
};

/**
 * Get or assign rate card for a user
 */
export function getUserPricingProfile(userId: string, userName = "Shipper"): UserPricingProfile {
  if (userCustomRates.has(userId)) {
    return userCustomRates.get(userId)!;
  }

  // Default initial profile is STANDARD
  const profile: UserPricingProfile = {
    userId,
    userName,
    tier: "STANDARD",
    rates: JSON.parse(JSON.stringify(DEFAULT_PRICING_TIERS.STANDARD)),
    updatedAt: new Date().toISOString(),
  };

  userCustomRates.set(userId, profile);
  return profile;
}

/**
 * Admin assigns custom courier rates or pricing tier to a user
 */
export function setUserPricingProfile(
  userId: string,
  userName: string,
  tier: PricingTier,
  customRates?: Record<string, UserCourierRate>,
): UserPricingProfile {
  let ratesToSet: Record<string, UserCourierRate>;

  if (tier === "CUSTOM" && customRates) {
    ratesToSet = customRates;
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
  return profile;
}

/**
 * Compute real-time shipping quote for a specific user and courier
 */
export function calculateUserCourierPrice(params: {
  userId: string;
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
  const courierRates = profile.rates[params.courierCode] || DEFAULT_PRICING_TIERS.STANDARD.shadowfax;

  // 1. Base 500g slab
  let basePrice = courierRates.zoneA_0_500g;
  if (params.zone === "ZONE_B") basePrice = courierRates.zoneB_0_500g;
  if (params.zone === "ZONE_C") basePrice = courierRates.zoneC_0_500g;
  if (params.zone === "ZONE_D") basePrice = courierRates.zoneD_0_500g;
  if (params.zone === "ZONE_E") basePrice = courierRates.zoneE_0_500g || courierRates.zoneD_0_500g + 16;

  // 2. Extra weight slabs (per additional 500g)
  if (params.weightKg > 0.5) {
    const extraSlabs = Math.ceil((params.weightKg - 0.5) / 0.5);
    basePrice += extraSlabs * (courierRates.additional500g || 35);
  }

  // 3. COD Fee (Free / Configured)
  let codCharge = 0;
  if (params.paymentMode === "COD") {
    const percentCharge = ((params.codAmount || 0) * (courierRates.codPercent || 0)) / 100;
    codCharge = Math.max(courierRates.codChargeFlat || 0, percentCharge);
  }

  return {
    baseFreight: Math.round(basePrice),
    codCharge: Math.round(codCharge),
    totalShippingCost: Math.round(basePrice + codCharge),
    appliedTier: profile.tier,
  };
}
