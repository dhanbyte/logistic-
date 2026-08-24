/**
 * Deterministic Money & Precise Arithmetic Layer for ShipWave.in
 *
 * Invariant: Never use floating-point for calculations.
 * All monetary amounts are internally tracked in integer minor units (paise).
 * Example: ₹100.50 is represented as 10050 paise.
 */

export function toPaise(rupees: number): number {
  if (isNaN(rupees) || !isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  if (isNaN(paise) || !isFinite(paise)) return 0;
  return Math.round(paise) / 100;
}

export function addPaise(a: number, b: number): number {
  return Math.round(a) + Math.round(b);
}

export function subPaise(a: number, b: number): number {
  return Math.round(a) - Math.round(b);
}

export function calculateGst(amountPaise: number, ratePercent = 18): {
  basePaise: number;
  gstPaise: number;
  totalPaise: number;
} {
  const safeAmount = Math.round(amountPaise);
  const gstPaise = Math.round((safeAmount * ratePercent) / 100);
  return {
    basePaise: safeAmount,
    gstPaise,
    totalPaise: safeAmount + gstPaise,
  };
}

export function formatPaiseINR(paise: number): string {
  const rupees = toRupees(paise);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function validatePositiveAmount(paise: number): boolean {
  return Number.isInteger(paise) && paise > 0;
}
