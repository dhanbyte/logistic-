import fs from "fs";
import path from "path";
import type { UserPricingProfile } from "./pricing-engine";

const RATES_FILE_PATH = path.join(process.cwd(), "data", "user-rates.json");

export function loadRatesFromDisk(): Record<string, UserPricingProfile> {
  try {
    if (fs.existsSync(RATES_FILE_PATH)) {
      const data = fs.readFileSync(RATES_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("[PricingStore] Failed to load rate cards from disk:", err);
  }
  return {};
}

export function saveRatesToDisk(ratesMap: Map<string, UserPricingProfile>): void {
  try {
    const dir = path.dirname(RATES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const obj: Record<string, UserPricingProfile> = {};
    for (const [k, v] of ratesMap.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(RATES_FILE_PATH, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.warn("[PricingStore] Failed to save rate cards to disk:", err);
  }
}
