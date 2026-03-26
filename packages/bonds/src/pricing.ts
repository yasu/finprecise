import { Decimal, toDecimal } from "@finprecise/core";
import type { BondPriceInput } from "./types.js";

/**
 * Calculate the price (present value) of a bond given a yield to maturity.
 *
 * Price = Σ [C / (1 + y)^t] + F / (1 + y)^n
 *
 * where:
 *   C = periodic coupon payment (faceValue × couponRate / frequency)
 *   y = periodic yield (yieldRate / frequency)
 *   F = face value
 *   n = number of remaining periods
 *   t = period index (1..n)
 */
export function bondPrice(input: BondPriceInput): Decimal {
  const face = toDecimal(input.faceValue);
  const couponRate = toDecimal(input.couponRate);
  const yieldRate = toDecimal(input.yieldRate);
  const freq = input.frequency;
  const n = input.periods;

  const coupon = face.mul(couponRate).div(freq);
  const y = yieldRate.div(freq);
  const onePlusY = y.add(1);

  let pv = new Decimal(0);

  // Present value of coupon payments
  for (let t = 1; t <= n; t++) {
    pv = pv.add(coupon.div(onePlusY.pow(t)));
  }

  // Present value of face value at maturity
  pv = pv.add(face.div(onePlusY.pow(n)));

  return pv;
}
