import { Decimal, toDecimal } from "@finprecise/core";
import type { BondPriceInput, BondAnalytics } from "./types.js";
import { bondPrice } from "./pricing.js";
import { bondDuration } from "./duration.js";
import { bondConvexity } from "./convexity.js";

/**
 * Calculate comprehensive bond analytics in a single call.
 *
 * Returns price, accrued interest, dirty price, Macaulay duration,
 * modified duration, and convexity.
 */
export function bondAnalytics(input: BondPriceInput): BondAnalytics {
  const price = bondPrice(input);
  const { macaulay, modified } = bondDuration(input);
  const convexity = bondConvexity(input);

  // Full-period pricing: no accrued interest
  const accruedInterest = new Decimal(0);
  const dirtyPrice = price.add(accruedInterest);

  return {
    price,
    accruedInterest,
    dirtyPrice,
    macaulayDuration: macaulay,
    modifiedDuration: modified,
    convexity,
  };
}
