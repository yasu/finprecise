import { Decimal, toDecimal } from "@finprecise/core";
import type { BondPriceInput } from "./types.js";
import type { DurationResult } from "./types.js";

/**
 * Calculate Macaulay duration and modified duration.
 *
 * Macaulay Duration = (1/P) × Σ [t × C / (1 + y)^t] + (n × F) / (1 + y)^n
 *   expressed in years: divide by frequency
 *
 * Modified Duration = Macaulay Duration / (1 + y/freq)
 */
export function bondDuration(input: BondPriceInput): DurationResult {
  const face = toDecimal(input.faceValue);
  const couponRate = toDecimal(input.couponRate);
  const yieldRate = toDecimal(input.yieldRate);
  const freq = input.frequency;
  const n = input.periods;

  const coupon = face.mul(couponRate).div(freq);
  const y = yieldRate.div(freq);
  const onePlusY = y.add(1);

  let price = new Decimal(0);
  let weightedSum = new Decimal(0);

  for (let t = 1; t <= n; t++) {
    const discountedCf = coupon.div(onePlusY.pow(t));
    price = price.add(discountedCf);
    weightedSum = weightedSum.add(new Decimal(t).mul(discountedCf));
  }

  // Face value at maturity
  const discountedFace = face.div(onePlusY.pow(n));
  price = price.add(discountedFace);
  weightedSum = weightedSum.add(new Decimal(n).mul(discountedFace));

  // Macaulay duration in years
  const macaulay = weightedSum.div(price).div(freq);

  // Modified duration
  const modified = macaulay.div(onePlusY);

  return { macaulay, modified };
}
