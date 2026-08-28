import { MockCourierProvider } from "./mock-provider";
import type {
  CalculatedWeight,
  CourierRateQuote,
  ICourierProvider,
  ServiceabilityRequest,
} from "./types";
import { ShadowfaxClient } from "./shadowfax/client";
import { ShadowfaxProvider } from "./shadowfax/provider";
import { XpressbeesClient } from "./xpressbees/client";
import { XpressbeesProvider } from "./xpressbees/provider";

export const SUPPORTED_COURIERS = [
  "shadowfax",
  "shadowfax_surface",
] as const;

export type SupportedCourierCode = (typeof SUPPORTED_COURIERS)[number];

const courierCache = new Map<string, ICourierProvider>();

/**
 * Checks whether a given courier provider has live credentials configured in environment
 */
export function isCourierConfigured(code: string): boolean {
  const normalized = code.toLowerCase().trim();
  if (normalized === "xpressbees") {
    if (process.env.NEXT_PUBLIC_XPRESSBEES_CONFIGURED === "true") return true;
    const client = new XpressbeesClient();
    return client.isConfigured();
  }
  if (normalized === "shadowfax_surface") {
    if (process.env.NEXT_PUBLIC_SHADOWFAX_SURFACE_CONFIGURED === "true") return true;
    const token = process.env.SHADOWFAX_SURFACE_TOKEN || process.env.SHADOWFAX_TOKEN;
    const client = new ShadowfaxClient({ token });
    return client.isConfigured();
  }
  if (normalized === "shadowfax") {
    if (process.env.NEXT_PUBLIC_SHADOWFAX_CONFIGURED === "true") return true;
    const client = new ShadowfaxClient();
    return client.isConfigured();
  }
  return false;
}

/**
 * Checks whether a courier is operating in test/sandbox mode
 */
export function isCourierTestMode(code: string): boolean {
  const normalized = code.toLowerCase().trim();
  if (normalized === "xpressbees") {
    return (
      process.env.NEXT_PUBLIC_XPRESSBEES_TEST_MODE === "true" ||
      process.env.XPRESSBEES_TEST_MODE === "true"
    );
  }
  if (normalized === "shadowfax" || normalized === "shadowfax_surface") {
    return (
      process.env.NEXT_PUBLIC_SHADOWFAX_TEST_MODE === "true" ||
      process.env.SHADOWFAX_TEST_MODE === "true"
    );
  }
  return false;
}

/**
 * Resolves courier provider instance (returns live provider if configured, mock provider otherwise)
 */
export function getCourierProvider(code: string): ICourierProvider {
  const normalized = code.toLowerCase().trim();
  if (courierCache.has(normalized)) {
    return courierCache.get(normalized)!;
  }

  let provider: ICourierProvider;
  if (normalized === "xpressbees") {
    const client = new XpressbeesClient();
    if (client.isConfigured()) {
      provider = new XpressbeesProvider(client);
    } else {
      provider = new MockCourierProvider(normalized);
    }
  } else if (normalized === "shadowfax_surface") {
    provider = new ShadowfaxProvider({
      code: "shadowfax_surface",
      name: "Shadowfax Cargo 7KG (Surface)",
      isSurface7Kg: true,
    });
  } else if (normalized === "shadowfax") {
    provider = new ShadowfaxProvider({
      code: "shadowfax",
      name: "Shadowfax Express 0.5KG (Air)",
      isSurface7Kg: false,
    });
  } else {
    provider = new MockCourierProvider(normalized);
  }

  courierCache.set(normalized, provider);
  return provider;
}

/**
 * Calculates rate quotes across all active courier partners for real-time comparison
 */
export async function compareAllCourierRates(
  req: ServiceabilityRequest,
  weight: CalculatedWeight,
): Promise<CourierRateQuote[]> {
  const quotePromises = SUPPORTED_COURIERS.map(async (code) => {
    const provider = getCourierProvider(code);
    return provider.calculateRate(req, weight);
  });

  const results = await Promise.all(quotePromises);
  const validQuotes = results.filter((q): q is CourierRateQuote => q !== null);

  // Sort by lowest total shipping cost first
  return validQuotes.sort((a, b) => a.totalShippingCost - b.totalShippingCost);
}
