import type { UserPricingProfile, UserCourierRate } from "./pricing-engine";

export function loadRatesFromDisk(): Record<string, UserPricingProfile> {
  if (typeof window !== "undefined") return {};
  try {
    const fs = require("fs");
    const path = require("path");
    const USER_RATES_FILE_PATH = path.join(process.cwd(), "data", "user-rates.json");
    if (fs.existsSync(USER_RATES_FILE_PATH)) {
      const data = fs.readFileSync(USER_RATES_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("[PricingStore] Failed to load rate cards from disk:", err);
  }
  return {};
}

export function saveRatesToDisk(ratesMap: Map<string, UserPricingProfile>): void {
  if (typeof window !== "undefined") return;
  try {
    const fs = require("fs");
    const path = require("path");
    const USER_RATES_FILE_PATH = path.join(process.cwd(), "data", "user-rates.json");
    const dir = path.dirname(USER_RATES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const obj: Record<string, UserPricingProfile> = {};
    for (const [k, v] of ratesMap.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(USER_RATES_FILE_PATH, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.warn("[PricingStore] Failed to save rate cards to disk:", err);
  }
}

export function loadGlobalRatesFromDisk(): Record<string, UserCourierRate> | null {
  if (typeof window !== "undefined") return null;
  try {
    const fs = require("fs");
    const path = require("path");
    const GLOBAL_RATES_FILE_PATH = path.join(process.cwd(), "data", "global-rates.json");
    if (fs.existsSync(GLOBAL_RATES_FILE_PATH)) {
      const data = fs.readFileSync(GLOBAL_RATES_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("[PricingStore] Failed to load global rates from disk:", err);
  }
  return null;
}

export function saveGlobalRatesToDisk(globalRates: Record<string, UserCourierRate>): void {
  if (typeof window !== "undefined") return;
  try {
    const fs = require("fs");
    const path = require("path");
    const GLOBAL_RATES_FILE_PATH = path.join(process.cwd(), "data", "global-rates.json");
    const dir = path.dirname(GLOBAL_RATES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(GLOBAL_RATES_FILE_PATH, JSON.stringify(globalRates, null, 2), "utf-8");
  } catch (err) {
    console.warn("[PricingStore] Failed to save global rates to disk:", err);
  }
}
