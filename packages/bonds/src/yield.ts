import { Decimal, toDecimal, solve, type SolverConfig, type SolveResult } from "@finprecise/core";
import type { BondYieldInput } from "./types.js";
import { bondPrice } from "./pricing.js";

/**
 * Calculate the yield to maturity (YTM) of a bond given its market price.
 *
 * Uses iterative solving (Newton-Raphson / bisection hybrid) to find the
 * discount rate that equates the present value of cash flows to the market price.
 */
export function bondYield(
  input: BondYieldInput,
  solverConfig?: Partial<SolverConfig>,
): SolveResult {
  const marketPrice = toDecimal(input.marketPrice);
  const face = toDecimal(input.faceValue);
  const couponRate = toDecimal(input.couponRate);
  const freq = input.frequency;
  const n = input.periods;

  const coupon = face.mul(couponRate).div(freq);

  // f(y) = bondPrice(y) - marketPrice = 0
  const f = (annualYield: Decimal): Decimal => {
    const price = bondPrice({ ...input, yieldRate: annualYield });
    return price.minus(marketPrice);
  };

  // f'(y) = dPrice/dy
  // dP/dy = Σ [-t/freq × C / (1 + y/freq)^(t+1)] + [-n/freq × F / (1 + y/freq)^(n+1)]
  const fPrime = (annualYield: Decimal): Decimal => {
    const y = annualYield.div(freq);
    const onePlusY = y.add(1);

    let dPdy = new Decimal(0);
    for (let t = 1; t <= n; t++) {
      dPdy = dPdy.add(
        new Decimal(-t).div(freq).mul(coupon).div(onePlusY.pow(t + 1)),
      );
    }
    dPdy = dPdy.add(
      new Decimal(-n).div(freq).mul(face).div(onePlusY.pow(n + 1)),
    );

    return dPdy;
  };

  // Initial guess: current yield as starting point
  const currentYield = coupon.mul(freq).div(marketPrice);
  const guess = currentYield.isFinite() && currentYield.gt(0)
    ? currentYield.toString()
    : "0.05";

  return solve(f, fPrime, { guess, ...solverConfig });
}
