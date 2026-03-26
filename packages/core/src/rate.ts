import { Decimal, toDecimal, type DecimalLike } from "./decimal.js";

/**
 * Compounding frequency for interest rate conversions.
 */
export type CompoundingFrequency =
  | "continuous"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual";

/**
 * Map compounding frequency to periods per year.
 * "continuous" returns Infinity and must be handled separately.
 */
export function periodsPerYear(freq: CompoundingFrequency): number {
  switch (freq) {
    case "continuous": return Infinity;
    case "daily": return 365;
    case "weekly": return 52;
    case "biweekly": return 26;
    case "monthly": return 12;
    case "quarterly": return 4;
    case "semiannual": return 2;
    case "annual": return 1;
  }
}

/**
 * Convert a nominal annual rate to an effective annual rate.
 *
 * For discrete compounding: EAR = (1 + r/n)^n - 1
 * For continuous compounding: EAR = e^r - 1
 */
export function effectiveAnnualRate(
  nominalRate: DecimalLike,
  compounding: CompoundingFrequency,
): Decimal {
  const r = toDecimal(nominalRate);
  if (compounding === "continuous") {
    return r.exp().minus(1);
  }
  const n = periodsPerYear(compounding);
  return r.div(n).add(1).pow(n).minus(1);
}

/**
 * Convert an effective annual rate to a nominal annual rate.
 *
 * For discrete compounding: r = n * ((1 + EAR)^(1/n) - 1)
 * For continuous compounding: r = ln(1 + EAR)
 */
export function nominalAnnualRate(
  ear: DecimalLike,
  compounding: CompoundingFrequency,
): Decimal {
  const e = toDecimal(ear);
  if (e.lte(-1)) {
    throw new Error("Effective annual rate must be greater than -1 (i.e., -100%)");
  }
  if (compounding === "continuous") {
    return e.add(1).ln();
  }
  const n = periodsPerYear(compounding);
  return e.add(1).pow(toDecimal(1).div(n)).minus(1).mul(n);
}

/**
 * Calculate the periodic rate from an annual rate and compounding frequency.
 */
export function periodicRate(
  annualRate: DecimalLike,
  compounding: CompoundingFrequency,
): Decimal {
  const r = toDecimal(annualRate);
  if (compounding === "continuous") {
    throw new Error("Periodic rate is not defined for continuous compounding. Use effectiveAnnualRate instead.");
  }
  return r.div(periodsPerYear(compounding));
}
