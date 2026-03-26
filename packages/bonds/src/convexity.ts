import { Decimal, toDecimal } from "@finprecise/core";
import type { BondPriceInput } from "./types.js";

/**
 * Calculate bond convexity.
 *
 * Convexity = (1 / (P × freq²)) × Σ [t(t+1) × CF_t / (1 + y)^(t+2)]
 *
 * where CF_t = coupon for t < n, coupon + face for t = n.
 */
export function bondConvexity(input: BondPriceInput): Decimal {
  const face = toDecimal(input.faceValue);
  const couponRate = toDecimal(input.couponRate);
  const yieldRate = toDecimal(input.yieldRate);
  const freq = input.frequency;
  const n = input.periods;

  const coupon = face.mul(couponRate).div(freq);
  const y = yieldRate.div(freq);
  const onePlusY = y.add(1);

  let price = new Decimal(0);
  let convexSum = new Decimal(0);

  for (let t = 1; t <= n; t++) {
    const cf = t === n ? coupon.add(face) : coupon;
    const discountedCf = cf.div(onePlusY.pow(t));
    price = price.add(discountedCf);

    // t(t+1) × CF / (1+y)^(t+2)
    convexSum = convexSum.add(
      new Decimal(t).mul(t + 1).mul(cf).div(onePlusY.pow(t + 2)),
    );
  }

  const freqSq = new Decimal(freq).pow(2);
  return convexSum.div(price.mul(freqSq));
}
